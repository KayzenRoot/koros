import { withTenant } from '../db.mjs';
import { insertAuditEvent } from '../audit/events.mjs';
import { WORKFLOW_ERROR, WorkflowError } from './errors.mjs';
import { assertTransition, isKnownState } from './fsm.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function requireString(value, maxLength) {
  if (typeof value !== 'string') throw new WorkflowError(WORKFLOW_ERROR.INVALID_INPUT);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) {
    throw new WorkflowError(WORKFLOW_ERROR.INVALID_INPUT);
  }
  return trimmed;
}

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new WorkflowError(WORKFLOW_ERROR.INVALID_INPUT);
  }
  return value;
}

function assertNow(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new WorkflowError(WORKFLOW_ERROR.INVALID_INPUT);
  }
}

function assertActor(actorUserId) {
  if (actorUserId === null || actorUserId === undefined) return null;
  return requireUuid(actorUserId);
}

/** Creates a run at RECEIVED; the unique tenant/idempotency key makes replay safe. */
export async function createRun({
  client,
  tenantId,
  leadId,
  workflowVersionId,
  idempotencyKey,
  actorUserId = null,
  now = new Date(),
}) {
  if (!client || typeof client.query !== 'function') {
    throw new WorkflowError(WORKFLOW_ERROR.INVALID_INPUT);
  }
  requireUuid(tenantId);
  assertNow(now);
  const normalizedLeadId = requireUuid(leadId);
  const normalizedWorkflowVersionId = requireUuid(workflowVersionId);
  const normalizedKey = requireString(idempotencyKey, 200);
  const normalizedActor = assertActor(actorUserId);

  const inserted = await client.query(
    `INSERT INTO runs
       (tenant_id, lead_id, workflow_version_id, state, idempotency_key, created_at, updated_at)
     VALUES ($1, $2, $3, 'RECEIVED', $4, $5, $5)
     ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
     RETURNING *`,
    [tenantId, normalizedLeadId, normalizedWorkflowVersionId, normalizedKey, now],
  );

  if (inserted.rowCount === 1) {
    const run = inserted.rows[0];
    await insertAuditEvent(client, {
      tenantId,
      runId: run.run_id,
      actorUserId: normalizedActor,
      action: 'RUN_CREATED',
      entity: 'run',
      entityId: run.run_id,
      metadata: { state: 'RECEIVED' },
    });
    return { created: true, run };
  }

  const existing = await client.query(
    'SELECT * FROM runs WHERE tenant_id = $1 AND idempotency_key = $2',
    [tenantId, normalizedKey],
  );
  if (existing.rowCount !== 1) throw new WorkflowError(WORKFLOW_ERROR.IDEMPOTENCY_CONFLICT);
  const run = existing.rows[0];
  if (run.lead_id !== normalizedLeadId || run.workflow_version_id !== normalizedWorkflowVersionId) {
    throw new WorkflowError(WORKFLOW_ERROR.IDEMPOTENCY_CONFLICT);
  }
  return { created: false, run };
}

/**
 * Applies one FSM transition under a row lock. A repeated request for the state
 * the run already has is idempotent and does not create another audit event.
 */
export async function transitionRun({
  client,
  tenantId,
  runId,
  targetState,
  expectedState = null,
  actorUserId = null,
  reason = '',
  now = new Date(),
}) {
  if (!client || typeof client.query !== 'function') {
    throw new WorkflowError(WORKFLOW_ERROR.INVALID_INPUT);
  }
  requireUuid(tenantId);
  const normalizedRunId = requireUuid(runId);
  assertNow(now);
  if (!isKnownState(targetState)) throw new WorkflowError(WORKFLOW_ERROR.INVALID_STATE);
  if (expectedState !== null && !isKnownState(expectedState)) {
    throw new WorkflowError(WORKFLOW_ERROR.INVALID_STATE);
  }
  const normalizedReason = reason === '' ? '' : requireString(reason, 200);
  const normalizedActor = assertActor(actorUserId);

  const selected = await client.query(
    'SELECT state FROM runs WHERE tenant_id = $1 AND run_id = $2 FOR UPDATE',
    [tenantId, normalizedRunId],
  );
  if (selected.rowCount !== 1) throw new WorkflowError(WORKFLOW_ERROR.NOT_FOUND);
  const currentState = selected.rows[0].state;

  if (currentState === targetState) {
    return {
      transitioned: false,
      idempotent: true,
      runId: normalizedRunId,
      from: currentState,
      to: targetState,
    };
  }
  if (expectedState !== null && currentState !== expectedState) {
    throw new WorkflowError(WORKFLOW_ERROR.STATE_MISMATCH);
  }
  assertTransition(currentState, targetState);

  const updated = await client.query(
    `UPDATE runs
        SET state = $3, updated_at = $4
      WHERE tenant_id = $1 AND run_id = $2 AND state = $5`,
    [tenantId, normalizedRunId, targetState, now, currentState],
  );
  if (updated.rowCount !== 1) throw new WorkflowError(WORKFLOW_ERROR.STATE_MISMATCH);

  await insertAuditEvent(client, {
    tenantId,
    runId: normalizedRunId,
    actorUserId: normalizedActor,
    action: 'RUN_STATE_CHANGED',
    entity: 'run',
    entityId: normalizedRunId,
    metadata: { from: currentState, to: targetState, reason: normalizedReason },
  });

  return {
    transitioned: true,
    idempotent: false,
    runId: normalizedRunId,
    from: currentState,
    to: targetState,
  };
}

export async function createRunInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => createRun({ client, tenantId, ...options }));
}

export async function transitionRunInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => transitionRun({ client, tenantId, ...options }));
}

export async function getRun({ tenantId, runId }) {
  requireUuid(tenantId);
  requireUuid(runId);
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT run_id, state, idempotency_key, lead_id, workflow_version_id, created_at, updated_at
         FROM runs WHERE tenant_id = $1 AND run_id = $2`,
      [tenantId, runId],
    );
    if (result.rowCount !== 1) throw new WorkflowError(WORKFLOW_ERROR.NOT_FOUND);
    return result.rows[0];
  });
}
