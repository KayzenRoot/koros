import {
  assertAdapter,
  assertApproval,
  assertTenantId,
  canonicalContact,
  contactPayloadHash,
} from '../crm/contract.mjs';
import { withTenant } from '../db.mjs';
import { insertAuditEvent } from '../audit/events.mjs';
import { assertOperationsAllowedWithClient } from '../control/guard.mjs';
import { WORKFLOW_ERROR } from '../workflow/errors.mjs';
import { transitionRun } from '../workflow/service.mjs';
import { OUTBOX_ERROR, OutboxError } from './errors.mjs';
import {
  FAILURE_CLASS,
  OUTBOX_LIMITS,
  classifyDispatchError,
  nextAttemptAt,
  operationKey,
} from './policy.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function requireString(value, maxLength) {
  if (typeof value !== 'string') throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) {
    throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  }
  return trimmed;
}

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  }
  return value;
}

function assertNow(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  }
}

function toContactInput(canonical) {
  const contact = { external_id: canonical.externalId };
  if (canonical.email !== undefined) contact.email = canonical.email;
  if (canonical.name !== undefined) contact.name = canonical.name;
  if (canonical.companyExternalId !== undefined) {
    contact.company_external_id = canonical.companyExternalId;
  }
  return contact;
}

function safeErrorCode(error) {
  const code = typeof error?.code === 'string' ? error.code : 'UNKNOWN';
  return /^[A-Z0-9_]{1,64}$/.test(code) ? code : 'UNKNOWN';
}

function assertApprovalOrOutboxError(approval, canonical) {
  try {
    assertApproval(approval, canonical);
  } catch (error) {
    if (typeof error?.code === 'string' && error.code.startsWith('APPROVAL_')) {
      throw new OutboxError(error.code);
    }
    throw error;
  }
}

/**
 * Creates the outbox row and moves the run to DISPATCHING in the caller's
 * transaction. The operation is idempotent by tenant + source + external_id +
 * payload_version and refuses to write without a persisted APPROVED approval.
 */
export async function enqueueAction({
  client,
  tenantId,
  runId,
  source,
  externalId,
  payloadVersion,
  target,
  contact,
  approval,
  now = new Date(),
}) {
  if (!client || typeof client.query !== 'function') {
    throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  }
  assertTenantId(tenantId);
  assertNow(now);
  const normalizedRunId = requireUuid(runId);
  const normalizedSource = requireString(source, 200);
  const normalizedExternalId = requireString(externalId, 200);
  const normalizedTarget = requireString(target, 200);
  if (!Number.isInteger(payloadVersion) || payloadVersion < 1 || payloadVersion > 1_000_000) {
    throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  }

  const canonical = canonicalContact(contact);
  const payloadHash = contactPayloadHash(canonical);
  const key = operationKey({
    tenantId,
    source: normalizedSource,
    externalId: normalizedExternalId,
    payloadVersion,
  });

  const existing = await client.query(
    'SELECT * FROM outbox_actions WHERE tenant_id = $1 AND operation_key = $2',
    [tenantId, key],
  );
  if (existing.rowCount > 0) {
    if (existing.rows[0].payload_hash !== payloadHash) {
      throw new OutboxError(OUTBOX_ERROR.IDEMPOTENCY_CONFLICT);
    }
    return { created: false, action: existing.rows[0] };
  }

  assertApprovalOrOutboxError(approval, canonical);
  const persistedApproval = await client.query(
    `SELECT approval_id, expires_at
       FROM approvals
      WHERE tenant_id = $1 AND run_id = $2 AND payload_hash = $3
        AND decision = 'APPROVED' AND revoked_at IS NULL
        AND decided_at IS NOT NULL AND expires_at > $4
      ORDER BY expires_at DESC
      LIMIT 1`,
    [tenantId, normalizedRunId, payloadHash, now],
  );
  if (persistedApproval.rowCount !== 1) {
    throw new OutboxError(OUTBOX_ERROR.APPROVAL_REQUIRED);
  }

  const payload = { contact: toContactInput(canonical) };
  const inserted = await client.query(
    `INSERT INTO outbox_actions
       (tenant_id, run_id, operation_key, target, payload_hash, status,
        next_attempt_at, source, external_id, payload_version, payload,
        approval_id, approval_expires_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8, $9, $10::jsonb, $11, $12, $6)
     ON CONFLICT (tenant_id, operation_key) DO NOTHING
     RETURNING *`,
    [
      tenantId,
      normalizedRunId,
      key,
      normalizedTarget,
      payloadHash,
      now,
      normalizedSource,
      normalizedExternalId,
      payloadVersion,
      JSON.stringify(payload),
      persistedApproval.rows[0].approval_id,
      persistedApproval.rows[0].expires_at,
    ],
  );

  if (inserted.rowCount === 0) {
    const raced = await client.query(
      'SELECT * FROM outbox_actions WHERE tenant_id = $1 AND operation_key = $2',
      [tenantId, key],
    );
    if (!raced.rows[0]) throw new OutboxError(OUTBOX_ERROR.IDEMPOTENCY_CONFLICT);
    if (raced.rows[0].payload_hash !== payloadHash) {
      throw new OutboxError(OUTBOX_ERROR.IDEMPOTENCY_CONFLICT);
    }
    return { created: false, action: raced.rows[0] };
  }

  const action = inserted.rows[0];
  try {
    await transitionRun({
      client,
      tenantId,
      runId: normalizedRunId,
      expectedState: 'APPROVED',
      targetState: 'QUEUED',
      reason: 'OUTBOX_ENQUEUED',
      now,
    });
  } catch (error) {
    if (
      error?.code === WORKFLOW_ERROR.STATE_MISMATCH ||
      error?.code === WORKFLOW_ERROR.NOT_FOUND ||
      error?.code === WORKFLOW_ERROR.INVALID_TRANSITION
    ) {
      throw new OutboxError(OUTBOX_ERROR.RUN_NOT_APPROVED);
    }
    throw error;
  }

  await insertAuditEvent(client, {
    tenantId,
    runId: normalizedRunId,
    action: 'OUTBOX_ENQUEUED',
    entity: 'outbox_action',
    entityId: action.action_id,
    metadata: {
      source: normalizedSource,
      payloadVersion,
      target: normalizedTarget,
    },
  });

  return { created: true, action };
}

/** Convenience wrapper that opens the tenant transaction around enqueueAction. */
export async function enqueueDispatch({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => enqueueAction({ client, tenantId, ...options }));
}

async function claimWithClient(client, { tenantId, now, actionId, leaseSeconds }) {
  await assertOperationsAllowedWithClient(client, tenantId);
  const leaseExpiresAt = new Date(now.getTime() + leaseSeconds * 1000);
  const recovered = await client.query(
    `UPDATE outbox_actions
        SET status = 'UNCERTAIN',
            lease_expires_at = NULL,
            next_attempt_at = $2,
            updated_at = $2,
            last_error_code = 'LEASE_EXPIRED'
      WHERE tenant_id = $1
        AND status = 'DISPATCHING'
        AND (lease_expires_at IS NULL OR lease_expires_at <= $2)
      RETURNING action_id, run_id`,
    [tenantId, now],
  );

  if (recovered.rowCount > 0) {
    await Promise.all(
      recovered.rows.map(async (row) => {
        await transitionRun({
          client,
          tenantId,
          runId: row.run_id,
          targetState: 'RECONCILING',
          reason: 'OUTBOX_LEASE_EXPIRED',
          now,
        });
        await insertAuditEvent(client, {
          tenantId,
          runId: row.run_id,
          action: 'OUTBOX_LEASE_EXPIRED',
          entity: 'outbox_action',
          entityId: row.action_id,
          metadata: {},
        });
      }),
    );
  }

  const result = await client.query(
    `WITH candidate AS (
       SELECT action_id, status
         FROM outbox_actions
        WHERE tenant_id = $1
          AND status IN ('PENDING', 'UNCERTAIN')
          AND COALESCE(next_attempt_at, created_at) <= $2
          AND ($4::uuid IS NULL OR action_id = $4::uuid)
        ORDER BY COALESCE(next_attempt_at, created_at), created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
     )
     UPDATE outbox_actions AS o
        SET status = 'DISPATCHING',
            attempts = o.attempts + CASE WHEN c.status = 'PENDING' THEN 1 ELSE 0 END,
            reconciliations = o.reconciliations + CASE WHEN c.status = 'UNCERTAIN' THEN 1 ELSE 0 END,
            lease_expires_at = $3,
            updated_at = $2,
            last_error_code = NULL
       FROM candidate AS c
      WHERE o.action_id = c.action_id
      RETURNING o.*, c.status AS previous_status`,
    [tenantId, now, leaseExpiresAt, actionId],
  );
  return result.rows[0] ?? null;
}

/** Claims one due action with a short lease; concurrent workers use SKIP LOCKED. */
export async function claimNextAction({
  tenantId,
  now = new Date(),
  actionId = null,
  leaseSeconds = OUTBOX_LIMITS.LEASE_SECONDS,
} = {}) {
  assertTenantId(tenantId);
  assertNow(now);
  const normalizedActionId = actionId === null ? null : requireUuid(actionId);
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 3600) {
    throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  }
  return withTenant(tenantId, (client) =>
    claimWithClient(client, {
      tenantId,
      now,
      actionId: normalizedActionId,
      leaseSeconds,
    }),
  );
}

async function transitionClaimedAction({
  tenantId,
  action,
  now,
  status,
  outcome,
  nextAt = null,
  runState,
  auditAction,
  errorCode = null,
  metadata = {},
}) {
  return withTenant(tenantId, async (client) => {
    const updated = await client.query(
      `UPDATE outbox_actions
          SET status = $3,
              next_attempt_at = $4,
              lease_expires_at = NULL,
              updated_at = $5,
              last_error_code = $6,
              last_error = $6
        WHERE tenant_id = $1 AND action_id = $2 AND status = 'DISPATCHING'
        RETURNING action_id`,
      [tenantId, action.action_id, status, nextAt, now, errorCode],
    );
    if (updated.rowCount !== 1) {
      return { processed: false, stale: true, actionId: action.action_id };
    }
    await transitionRun({
      client,
      tenantId,
      runId: action.run_id,
      targetState: runState,
      reason: auditAction,
      now,
    });
    await insertAuditEvent(client, {
      tenantId,
      runId: action.run_id,
      action: auditAction,
      entity: 'outbox_action',
      entityId: action.action_id,
      metadata: { ...metadata, status, errorCode },
    });
    return { processed: true, actionId: action.action_id, outcome, status };
  });
}

async function completeClaimedAction({ tenantId, action, now, outcome, auditAction, metadata }) {
  return withTenant(tenantId, async (client) => {
    const updated = await client.query(
      `UPDATE outbox_actions
          SET status = 'COMPLETED',
              completed_at = $3,
              next_attempt_at = NULL,
              lease_expires_at = NULL,
              updated_at = $3,
              last_error_code = NULL,
              last_error = NULL
        WHERE tenant_id = $1 AND action_id = $2 AND status = 'DISPATCHING'
        RETURNING action_id`,
      [tenantId, action.action_id, now],
    );
    if (updated.rowCount !== 1) {
      return { processed: false, stale: true, actionId: action.action_id };
    }
    await transitionRun({
      client,
      tenantId,
      runId: action.run_id,
      targetState: 'COMPLETED',
      reason: auditAction,
      now,
    });
    await insertAuditEvent(client, {
      tenantId,
      runId: action.run_id,
      action: auditAction,
      entity: 'outbox_action',
      entityId: action.action_id,
      metadata,
    });
    return { processed: true, actionId: action.action_id, outcome, status: 'COMPLETED' };
  });
}

function approvalIsValid(action, now) {
  const expiresAt = action.approval_expires_at ? new Date(action.approval_expires_at) : null;
  return Boolean(expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt > now);
}

async function handleClaimedFailure({ tenantId, action, error, now, maxAttempts, stage }) {
  const classification = classifyDispatchError(error);
  const errorCode = safeErrorCode(error);
  const metadata = { stage, attempts: action.attempts, errorCode };

  if (classification === FAILURE_CLASS.PAUSE) {
    return transitionClaimedAction({
      tenantId,
      action,
      now,
      status: 'PAUSED',
      outcome: 'PAUSED',
      runState: 'PAUSED',
      auditAction: 'OUTBOX_PAUSED',
      errorCode,
      metadata,
    });
  }

  if (classification === FAILURE_CLASS.UNCERTAIN) {
    return transitionClaimedAction({
      tenantId,
      action,
      now,
      status: 'UNCERTAIN',
      outcome: 'UNCERTAIN',
      nextAt: nextAttemptAt(now, Math.max(action.attempts, 1)),
      runState: 'RECONCILING',
      auditAction: 'OUTBOX_UNCERTAIN',
      errorCode,
      metadata,
    });
  }

  if (classification === FAILURE_CLASS.RETRY && action.attempts < maxAttempts) {
    return transitionClaimedAction({
      tenantId,
      action,
      now,
      status: 'PENDING',
      outcome: 'RETRY_SCHEDULED',
      nextAt: nextAttemptAt(now, action.attempts),
      runState: 'QUEUED',
      auditAction: 'OUTBOX_RETRY_SCHEDULED',
      errorCode,
      metadata,
    });
  }

  return transitionClaimedAction({
    tenantId,
    action,
    now,
    status: 'FAILED',
    outcome: 'FAILED',
    runState: 'FAILED',
    auditAction: 'OUTBOX_FAILED',
    errorCode,
    metadata: {
      ...metadata,
      retryExhausted: classification === FAILURE_CLASS.RETRY,
    },
  });
}

async function approvalStillUsable(tenantId, action, now) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT 1 FROM approvals
        WHERE tenant_id = $1 AND approval_id = $2
          AND decision = 'APPROVED' AND revoked_at IS NULL AND expires_at > $3`,
      [tenantId, action.approval_id, now],
    );
    return result.rowCount === 1;
  });
}

async function dispatchClaimedAction({ tenantId, adapter, action, now, maxAttempts }) {
  if (!action.payload || typeof action.payload !== 'object' || !action.payload.contact) {
    return transitionClaimedAction({
      tenantId,
      action,
      now,
      status: 'FAILED',
      outcome: 'FAILED',
      runState: 'FAILED',
      auditAction: 'OUTBOX_FAILED',
      errorCode: 'INVALID_PAYLOAD',
      metadata: { stage: 'DISPATCH' },
    });
  }
  if (!approvalIsValid(action, now)) {
    return transitionClaimedAction({
      tenantId,
      action,
      now,
      status: 'FAILED',
      outcome: 'FAILED',
      runState: 'FAILED',
      auditAction: 'OUTBOX_FAILED',
      errorCode: 'APPROVAL_EXPIRED',
      metadata: { stage: 'DISPATCH' },
    });
  }
  if (!(await approvalStillUsable(tenantId, action, now))) {
    return transitionClaimedAction({
      tenantId,
      action,
      now,
      status: 'FAILED',
      outcome: 'FAILED',
      runState: 'FAILED',
      auditAction: 'OUTBOX_FAILED',
      errorCode: 'APPROVAL_REVOKED',
      metadata: { stage: 'DISPATCH' },
    });
  }

  try {
    const result = await adapter.upsertPerson({
      tenantId,
      contact: action.payload.contact,
      approval: {
        approved: true,
        payloadHash: action.payload_hash,
        expiresAt: new Date(action.approval_expires_at).toISOString(),
      },
    });
    return completeClaimedAction({
      tenantId,
      action,
      now,
      outcome: 'COMPLETED',
      auditAction: 'OUTBOX_COMPLETED',
      metadata: {
        provider: adapter.provider,
        contactId: result.contactId,
        version: result.version,
        created: result.created,
        updated: result.updated,
      },
    });
  } catch (error) {
    return handleClaimedFailure({
      tenantId,
      action,
      error,
      now,
      maxAttempts,
      stage: 'DISPATCH',
    });
  }
}

async function reconcileClaimedAction({ tenantId, adapter, action, now, maxAttempts }) {
  if (!action.external_id) {
    return transitionClaimedAction({
      tenantId,
      action,
      now,
      status: 'FAILED',
      outcome: 'FAILED',
      runState: 'FAILED',
      auditAction: 'OUTBOX_FAILED',
      errorCode: 'INVALID_PAYLOAD',
      metadata: { stage: 'RECONCILE' },
    });
  }

  try {
    const found = await adapter.getPerson({ tenantId, externalId: action.external_id });
    return completeClaimedAction({
      tenantId,
      action,
      now,
      outcome: 'RECONCILED',
      auditAction: 'OUTBOX_RECONCILED',
      metadata: {
        provider: adapter.provider,
        contactId: found.contactId,
        version: found.version,
      },
    });
  } catch (error) {
    const errorCode = safeErrorCode(error);
    if (errorCode === 'NOT_FOUND') {
      if (!approvalIsValid(action, now)) {
        return transitionClaimedAction({
          tenantId,
          action,
          now,
          status: 'FAILED',
          outcome: 'FAILED',
          runState: 'FAILED',
          auditAction: 'OUTBOX_FAILED',
          errorCode: 'APPROVAL_EXPIRED',
          metadata: { stage: 'RECONCILE' },
        });
      }
      if (action.attempts >= maxAttempts) {
        return transitionClaimedAction({
          tenantId,
          action,
          now,
          status: 'FAILED',
          outcome: 'FAILED',
          runState: 'FAILED',
          auditAction: 'OUTBOX_FAILED',
          errorCode: 'RETRY_EXHAUSTED',
          metadata: { stage: 'RECONCILE', attempts: action.attempts },
        });
      }
      return transitionClaimedAction({
        tenantId,
        action,
        now,
        status: 'PENDING',
        outcome: 'RECONCILED_ABSENT',
        nextAt: nextAttemptAt(now, Math.max(action.attempts, 1)),
        runState: 'QUEUED',
        auditAction: 'OUTBOX_RECONCILED_ABSENT',
        errorCode: 'NOT_FOUND',
        metadata: { stage: 'RECONCILE', attempts: action.attempts },
      });
    }
    return handleClaimedFailure({
      tenantId,
      action,
      error,
      now,
      maxAttempts,
      stage: 'RECONCILE',
    });
  }
}

/**
 * Claims and processes at most one action. The provider call happens outside the
 * database transaction; the short lease makes a crash recoverable as UNCERTAIN.
 */
export async function processNextAction({
  tenantId,
  adapter,
  now = new Date(),
  actionId = null,
  leaseSeconds = OUTBOX_LIMITS.LEASE_SECONDS,
  maxAttempts = OUTBOX_LIMITS.MAX_ATTEMPTS,
} = {}) {
  assertTenantId(tenantId);
  assertAdapter(adapter);
  assertNow(now);
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100) {
    throw new OutboxError(OUTBOX_ERROR.INVALID_INPUT);
  }
  const action = await claimNextAction({ tenantId, now, actionId, leaseSeconds });
  if (!action) return { processed: false };
  if (action.previous_status === 'UNCERTAIN') {
    return reconcileClaimedAction({ tenantId, adapter, action, now, maxAttempts });
  }
  return dispatchClaimedAction({ tenantId, adapter, action, now, maxAttempts });
}

/** Manual recovery from a quota pause. The next dispatch revalidates approval. */
export async function resumePausedAction({ tenantId, actionId, now = new Date() }) {
  assertTenantId(tenantId);
  assertNow(now);
  const normalizedActionId = requireUuid(actionId);
  return withTenant(tenantId, async (client) => {
    const updated = await client.query(
      `UPDATE outbox_actions
          SET status = 'PENDING',
              attempts = 0,
              reconciliations = 0,
              next_attempt_at = $3,
              lease_expires_at = NULL,
              last_error_code = NULL,
              last_error = NULL,
              updated_at = $3
        WHERE tenant_id = $1 AND action_id = $2 AND status = 'PAUSED'
        RETURNING *`,
      [tenantId, normalizedActionId, now],
    );
    if (updated.rowCount !== 1) throw new OutboxError(OUTBOX_ERROR.NOT_FOUND);
    const action = updated.rows[0];
    await transitionRun({
      client,
      tenantId,
      runId: action.run_id,
      expectedState: 'PAUSED',
      targetState: 'QUEUED',
      reason: 'OUTBOX_RESUMED',
      now,
    });
    await insertAuditEvent(client, {
      tenantId,
      runId: action.run_id,
      action: 'OUTBOX_RESUMED',
      entity: 'outbox_action',
      entityId: action.action_id,
      metadata: {},
    });
    return action;
  });
}
