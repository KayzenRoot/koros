import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { withTenant } from '../db.mjs';
import { insertAuditEvent } from '../audit/events.mjs';
import { hasPermission } from '../auth/rbac.mjs';
import { canonicalContact, contactPayloadHash } from '../crm/contract.mjs';
import { transitionRun } from '../workflow/service.mjs';
import { APPROVAL_ERROR, ApprovalError } from './errors.mjs';
import { approvalHash, compareStrings, fieldsForPayload } from './hash.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const SCOPES = new Set(['crm.contact.upsert']);
const DEFAULT_TTL_SECONDS = 900;
const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 3600;

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
  return value;
}

function requireString(value, maxLength) {
  if (typeof value !== 'string') throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
  return trimmed;
}

function assertNow(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function tokenMatches(token, storedHash) {
  if (typeof token !== 'string' || typeof storedHash !== 'string') return false;
  const actual = Buffer.from(tokenHash(token), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function actorRole(client, tenantId, userId) {
  const result = await client.query(
    `SELECT role FROM memberships
      WHERE tenant_id = $1 AND user_id = $2 AND status = 'ACTIVE'`,
    [tenantId, userId],
  );
  if (result.rowCount !== 1) throw new ApprovalError(APPROVAL_ERROR.FORBIDDEN);
  return result.rows[0].role;
}

async function requirePermission(client, tenantId, userId, permission) {
  const role = await actorRole(client, tenantId, userId);
  if (!hasPermission(role, permission)) throw new ApprovalError(APPROVAL_ERROR.FORBIDDEN);
}

function validatePolicy({ scope, payload, payloadVersion, ttlSeconds }) {
  if (!SCOPES.has(scope)) throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
  const fields = fieldsForPayload(payload);
  if (!Number.isInteger(payloadVersion) || payloadVersion < 1 || payloadVersion > 1_000_000) {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
  }
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < MIN_TTL_SECONDS || ttlSeconds > MAX_TTL_SECONDS) {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
  }
  return fields;
}

/**
 * Stores a proposed operation and issues a one-time token. The token is returned
 * only on creation; the database stores only its SHA-256. No mock or CRM write
 * happens here.
 */
export async function requestApproval({
  client,
  tenantId,
  runId,
  actorUserId,
  scope = 'crm.contact.upsert',
  payload,
  payloadVersion = 1,
  ttlSeconds = DEFAULT_TTL_SECONDS,
  now = new Date(),
}) {
  if (!client || typeof client.query !== 'function') {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
  requireUuid(tenantId);
  const normalizedRunId = requireUuid(runId);
  const normalizedActor = requireUuid(actorUserId);
  assertNow(now);
  const normalizedScope = requireString(scope, 100);
  const fields = validatePolicy({
    scope: normalizedScope,
    payload,
    payloadVersion,
    ttlSeconds,
  });
  await requirePermission(client, tenantId, normalizedActor, 'automation:run');

  const selected = await client.query(
    'SELECT state FROM runs WHERE tenant_id = $1 AND run_id = $2 FOR UPDATE',
    [tenantId, normalizedRunId],
  );
  if (selected.rowCount !== 1) throw new ApprovalError(APPROVAL_ERROR.NOT_FOUND);
  if (selected.rows[0].state !== 'PENDING_APPROVAL') {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_STATE);
  }

  const proposedOperation = {
    operation: normalizedScope,
    payload,
    fields,
    version: payloadVersion,
  };
  // payload_hash stays compatible with consumers (canonical contact hash);
  // operation_hash additionally binds scope, fields and payload version.
  let canonicalPayload;
  try {
    canonicalPayload = canonicalContact(payload);
  } catch {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
  }
  const payloadHash = contactPayloadHash(canonicalPayload);
  const operationHash = approvalHash({
    scope: normalizedScope,
    operation: normalizedScope,
    payload,
    fields,
    payloadVersion,
  });
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  const inserted = await client.query(
    `INSERT INTO approvals
       (tenant_id, run_id, actor_user_id, payload_hash, operation_hash, decision, expires_at,
        decided_at, scope, proposed_operation, field_allowlist, payload_version, token_hash, requested_by)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, NULL, $7, $8::jsonb, $9::text[], $10, $11, $3)
     ON CONFLICT (run_id, payload_hash) DO NOTHING
     RETURNING *`,
    [
      tenantId,
      normalizedRunId,
      normalizedActor,
      payloadHash,
      operationHash,
      expiresAt,
      normalizedScope,
      JSON.stringify(proposedOperation),
      fields,
      payloadVersion,
      tokenHash(token),
    ],
  );

  if (inserted.rowCount === 0) {
    const existing = await client.query(
      'SELECT * FROM approvals WHERE tenant_id = $1 AND run_id = $2 AND payload_hash = $3',
      [tenantId, normalizedRunId, payloadHash],
    );
    if (existing.rowCount !== 1) throw new ApprovalError(APPROVAL_ERROR.IDEMPOTENCY_CONFLICT);
    if (existing.rows[0].operation_hash !== operationHash) {
      throw new ApprovalError(APPROVAL_ERROR.IDEMPOTENCY_CONFLICT);
    }
    return { created: false, approval: existing.rows[0], token: null };
  }

  const approval = inserted.rows[0];
  await insertAuditEvent(client, {
    tenantId,
    runId: normalizedRunId,
    actorUserId: normalizedActor,
    action: 'APPROVAL_REQUESTED',
    entity: 'approval',
    entityId: normalizedRunId,
    metadata: { scope: normalizedScope, payloadVersion, fields },
  });
  return { created: true, approval, token };
}

async function recomputeStoredHash(approval) {
  const operation = approval.proposed_operation;
  if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new ApprovalError(APPROVAL_ERROR.PAYLOAD_MISMATCH);
  }
  const fields = fieldsForPayload(operation.payload);
  const storedFields = Array.isArray(approval.field_allowlist)
    ? [...approval.field_allowlist].sort(compareStrings)
    : [];
  if (fields.join(',') !== storedFields.join(',')) {
    throw new ApprovalError(APPROVAL_ERROR.PAYLOAD_MISMATCH);
  }
  const expectedOperationHash = approvalHash({
    scope: approval.scope,
    operation: operation.operation,
    payload: operation.payload,
    fields,
    payloadVersion: approval.payload_version,
  });
  let expectedPayloadHash;
  try {
    expectedPayloadHash = contactPayloadHash(canonicalContact(operation.payload));
  } catch {
    throw new ApprovalError(APPROVAL_ERROR.PAYLOAD_MISMATCH);
  }
  if (
    expectedOperationHash !== approval.operation_hash ||
    expectedPayloadHash !== approval.payload_hash
  ) {
    throw new ApprovalError(APPROVAL_ERROR.PAYLOAD_MISMATCH);
  }
  return { fields, operation, payloadHash: expectedPayloadHash };
}

async function decideApprovalInternal({
  client,
  tenantId,
  approvalId,
  actorUserId,
  token = null,
  requireToken = false,
  decision,
  now = new Date(),
}) {
  if (!client || typeof client.query !== 'function') {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
  requireUuid(tenantId);
  const normalizedApprovalId = requireUuid(approvalId);
  const normalizedActor = requireUuid(actorUserId);
  assertNow(now);
  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
  await requirePermission(client, tenantId, normalizedActor, 'approval:decide');

  const selected = await client.query(
    'SELECT * FROM approvals WHERE tenant_id = $1 AND approval_id = $2 FOR UPDATE',
    [tenantId, normalizedApprovalId],
  );
  if (selected.rowCount !== 1) throw new ApprovalError(APPROVAL_ERROR.NOT_FOUND);
  const approval = selected.rows[0];

  if (approval.decision === decision) {
    return { status: 'IDEMPOTENT', approval };
  }
  if (approval.decision !== 'PENDING') {
    throw new ApprovalError(APPROVAL_ERROR.ALREADY_DECIDED);
  }
  if (requireToken && !tokenMatches(token, approval.token_hash)) {
    throw new ApprovalError(APPROVAL_ERROR.FORGED_APPROVAL);
  }

  const expiresAt = new Date(approval.expires_at);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now) {
    const expired = await client.query(
      `UPDATE approvals
          SET decision = 'EXPIRED', decided_at = $3, decided_by = $4, token_hash = NULL
        WHERE tenant_id = $1 AND approval_id = $2
        RETURNING *`,
      [tenantId, normalizedApprovalId, now, normalizedActor],
    );
    await transitionRun({
      client,
      tenantId,
      runId: approval.run_id,
      targetState: 'EXPIRED',
      reason: 'APPROVAL_EXPIRED',
      now,
    });
    await insertAuditEvent(client, {
      tenantId,
      runId: approval.run_id,
      actorUserId: normalizedActor,
      action: 'APPROVAL_EXPIRED',
      entity: 'approval',
      entityId: approval.run_id,
      metadata: { scope: approval.scope },
    });
    return { status: 'EXPIRED', approval: expired.rows[0] };
  }

  const { fields } = await recomputeStoredHash(approval);
  const updated = await client.query(
    `UPDATE approvals
        SET decision = $3, decided_at = $4, decided_by = $5, token_hash = NULL
      WHERE tenant_id = $1 AND approval_id = $2
      RETURNING *`,
    [tenantId, normalizedApprovalId, decision, now, normalizedActor],
  );
  await transitionRun({
    client,
    tenantId,
    runId: approval.run_id,
    targetState: decision,
    reason: decision === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
    now,
  });
  await insertAuditEvent(client, {
    tenantId,
    runId: approval.run_id,
    actorUserId: normalizedActor,
    action: decision === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
    entity: 'approval',
    entityId: approval.run_id,
    metadata: { scope: approval.scope, payloadVersion: approval.payload_version, fields },
  });
  return { status: decision, approval: updated.rows[0] };
}

/** Token-bearing path for API/automation clients. */
export async function decideApproval(options) {
  return decideApprovalInternal({ ...options, token: options.token, requireToken: true });
}

/**
 * Session-bearing path for the human dashboard. Tenant/actor come from the
 * authenticated session and the server still enforces approval:decide, row lock,
 * expiry and payload integrity. No token or payload is trusted from the client.
 */
export async function decideApprovalByActor(options) {
  return decideApprovalInternal({ ...options, token: null, requireToken: false });
}

export async function listApprovals({ tenantId, now = new Date() }) {
  requireUuid(tenantId);
  assertNow(now);
  return withTenant(tenantId, async (client) => {
    const pending = await client.query(
      `SELECT a.approval_id, a.run_id, a.scope, a.proposed_operation,
              a.field_allowlist, a.payload_version, a.expires_at, a.created_at,
              r.state AS run_state, r.idempotency_key
         FROM approvals a
         JOIN runs r ON r.run_id = a.run_id AND r.tenant_id = a.tenant_id
        WHERE a.tenant_id = $1 AND a.decision = 'PENDING' AND a.expires_at > $2
        ORDER BY a.created_at ASC, a.approval_id ASC
        LIMIT 50`,
      [tenantId, now],
    );
    const history = await client.query(
      `SELECT approval_id, run_id, scope, decision, decided_at, expires_at, payload_version
         FROM approvals
        WHERE tenant_id = $1
          AND decision IN ('APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED')
        ORDER BY decided_at DESC NULLS LAST, approval_id DESC
        LIMIT 20`,
      [tenantId],
    );
    return { pending: pending.rows, history: history.rows };
  });
}

/** Revokes a still-pending or approved request before dispatch. */
export async function revokeApproval({
  client,
  tenantId,
  approvalId,
  actorUserId,
  now = new Date(),
}) {
  if (!client || typeof client.query !== 'function') {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
  requireUuid(tenantId);
  const normalizedApprovalId = requireUuid(approvalId);
  const normalizedActor = requireUuid(actorUserId);
  assertNow(now);
  await requirePermission(client, tenantId, normalizedActor, 'approval:decide');

  const selected = await client.query(
    'SELECT * FROM approvals WHERE tenant_id = $1 AND approval_id = $2 FOR UPDATE',
    [tenantId, normalizedApprovalId],
  );
  if (selected.rowCount !== 1) throw new ApprovalError(APPROVAL_ERROR.NOT_FOUND);
  const approval = selected.rows[0];
  if (approval.decision === 'REVOKED') {
    return { status: 'IDEMPOTENT', approval };
  }
  if (approval.decision !== 'PENDING' && approval.decision !== 'APPROVED') {
    throw new ApprovalError(APPROVAL_ERROR.NOT_REVOCABLE);
  }

  const run = await client.query(
    'SELECT state FROM runs WHERE tenant_id = $1 AND run_id = $2 FOR UPDATE',
    [tenantId, approval.run_id],
  );
  if (run.rowCount !== 1) throw new ApprovalError(APPROVAL_ERROR.NOT_FOUND);
  if (!['PENDING_APPROVAL', 'APPROVED'].includes(run.rows[0].state)) {
    throw new ApprovalError(APPROVAL_ERROR.APPROVAL_IN_USE);
  }

  const updated = await client.query(
    `UPDATE approvals
        SET decision = 'REVOKED', revoked_at = $3, revoked_by = $4,
            decided_at = COALESCE(decided_at, $3), token_hash = NULL
      WHERE tenant_id = $1 AND approval_id = $2
      RETURNING *`,
    [tenantId, normalizedApprovalId, now, normalizedActor],
  );
  await transitionRun({
    client,
    tenantId,
    runId: approval.run_id,
    targetState: 'EXPIRED',
    reason: 'APPROVAL_REVOKED',
    now,
  });
  await insertAuditEvent(client, {
    tenantId,
    runId: approval.run_id,
    actorUserId: normalizedActor,
    action: 'APPROVAL_REVOKED',
    entity: 'approval',
    entityId: approval.run_id,
    metadata: { scope: approval.scope },
  });
  return { status: 'REVOKED', approval: updated.rows[0] };
}

/** Verifies that an approved request is usable for the exact proposed payload. */
export async function verifyApproval({
  client,
  tenantId,
  approvalId,
  scope,
  payload,
  payloadVersion,
  now = new Date(),
}) {
  if (!client || typeof client.query !== 'function') {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_INPUT);
  }
  requireUuid(tenantId);
  const normalizedApprovalId = requireUuid(approvalId);
  assertNow(now);
  const selected = await client.query(
    'SELECT * FROM approvals WHERE tenant_id = $1 AND approval_id = $2',
    [tenantId, normalizedApprovalId],
  );
  if (selected.rowCount !== 1) throw new ApprovalError(APPROVAL_ERROR.NOT_FOUND);
  const approval = selected.rows[0];
  if (approval.decision !== 'APPROVED' || approval.revoked_at !== null) {
    throw new ApprovalError(APPROVAL_ERROR.NOT_APPROVED);
  }
  if (new Date(approval.expires_at) <= now) {
    throw new ApprovalError(APPROVAL_ERROR.APPROVAL_EXPIRED);
  }
  const { operation: proposedOperation } = await recomputeStoredHash(approval);
  const fields = fieldsForPayload(payload);
  const candidateOperationHash = approvalHash({
    scope,
    operation: proposedOperation.operation,
    payload,
    fields,
    payloadVersion,
  });
  let candidatePayloadHash;
  try {
    candidatePayloadHash = contactPayloadHash(canonicalContact(payload));
  } catch {
    throw new ApprovalError(APPROVAL_ERROR.PAYLOAD_MISMATCH);
  }
  if (
    candidateOperationHash !== approval.operation_hash ||
    candidatePayloadHash !== approval.payload_hash
  ) {
    throw new ApprovalError(APPROVAL_ERROR.PAYLOAD_MISMATCH);
  }
  return approval;
}

export async function requestApprovalInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => requestApproval({ client, tenantId, ...options }));
}

export async function decideApprovalInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => decideApproval({ client, tenantId, ...options }));
}

export async function decideApprovalByActorInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => decideApprovalByActor({ client, tenantId, ...options }));
}

export async function revokeApprovalInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => revokeApproval({ client, tenantId, ...options }));
}

export async function verifyApprovalInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => verifyApproval({ client, tenantId, ...options }));
}
