import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { closePool, withTenant } from '../src/db.mjs';
import {
  WORKFLOW_ERROR,
  createRunInTenant,
  getRun,
  transitionRunInTenant,
} from '../src/workflow/index.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const LEAD_A = 'a0000000-0000-4000-8000-000000000004';
const WORKFLOW_A = 'a0000000-0000-4000-8000-000000000001';
const WORKFLOW_VERSION_A = 'a0000000-0000-4000-8000-000000000002';
const RUN_ID = `${Date.now().toString(36)}-${process.pid}`;

function idempotencyKey(suffix) {
  return `fsm-${RUN_ID}-${suffix}`;
}

function createRun(suffix, overrides = {}) {
  return createRunInTenant({
    tenantId: TENANT_A,
    leadId: LEAD_A,
    workflowVersionId: WORKFLOW_VERSION_A,
    idempotencyKey: idempotencyKey(suffix),
    ...overrides,
  });
}

function transition(runId, targetState, optionsForTransition = {}) {
  return transitionRunInTenant({
    tenantId: TENANT_A,
    runId,
    targetState,
    ...optionsForTransition,
  });
}

async function auditCount(runId, action) {
  return withTenant(TENANT_A, async (client) => {
    const result = await client.query(
      `SELECT count(*)::int AS total FROM audit_events
        WHERE run_id = $1 AND action = $2`,
      [runId, action],
    );
    return result.rows[0].total;
  });
}

after(async () => {
  if (enabled) await closePool();
});

test('createRun is idempotent and a conflicting contract is rejected', options, async () => {
  const first = await createRun('create');
  assert.equal(first.created, true);
  assert.equal(first.run.state, 'RECEIVED');

  const replay = await createRun('create');
  assert.equal(replay.created, false);
  assert.equal(replay.run.run_id, first.run.run_id);
  assert.equal(await auditCount(first.run.run_id, 'RUN_CREATED'), 1);

  const secondVersionId = randomUUID();
  await withTenant(TENANT_A, async (client) => {
    await client.query(
      `INSERT INTO workflow_versions
         (workflow_version_id, workflow_id, tenant_id, version, input_schema, approval_policy)
       SELECT $1, $2, $3, COALESCE(MAX(version), 0) + 1, '{}'::jsonb, '{}'::jsonb
         FROM workflow_versions
        WHERE workflow_id = $2 AND tenant_id = $3`,
      [secondVersionId, WORKFLOW_A, TENANT_A],
    );
  });
  await assert.rejects(
    () => createRun('create', { workflowVersionId: secondVersionId }),
    (error) => error.code === WORKFLOW_ERROR.IDEMPOTENCY_CONFLICT,
  );
});

test('the happy path reaches COMPLETED with one audit event per transition', options, async () => {
  const { run } = await createRun('happy');
  const path = [
    'VALIDATED',
    'PROPOSED',
    'PENDING_APPROVAL',
    'APPROVED',
    'QUEUED',
    'RECONCILING',
    'COMPLETED',
  ];
  for (const targetState of path) {
    const result = await transition(run.run_id, targetState);
    assert.equal(result.transitioned, true);
    assert.equal(result.to, targetState);
  }
  const current = await getRun({ tenantId: TENANT_A, runId: run.run_id });
  assert.equal(current.state, 'COMPLETED');
  assert.equal(await auditCount(run.run_id, 'RUN_STATE_CHANGED'), path.length);
});

test('illegal transitions and direct AI shortcuts are rejected without mutation', options, async () => {
  const { run } = await createRun('illegal');
  await assert.rejects(
    () => transition(run.run_id, 'APPROVED'),
    (error) => error.code === WORKFLOW_ERROR.INVALID_TRANSITION,
  );
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'RECEIVED');
  assert.equal(await auditCount(run.run_id, 'RUN_STATE_CHANGED'), 0);

  const terminalRun = await createRun('terminal');
  await transition(terminalRun.run.run_id, 'VALIDATED');
  await transition(terminalRun.run.run_id, 'REJECTED');
  await assert.rejects(
    () => transition(terminalRun.run.run_id, 'VALIDATED'),
    (error) => error.code === WORKFLOW_ERROR.INVALID_TRANSITION,
  );

  const shortcutRun = await createRun('shortcut');
  for (const state of ['VALIDATED', 'PROPOSED', 'PENDING_APPROVAL', 'APPROVED']) {
    await transition(shortcutRun.run.run_id, state);
  }
  await assert.rejects(
    () => transition(shortcutRun.run.run_id, 'COMPLETED'),
    (error) => error.code === WORKFLOW_ERROR.INVALID_TRANSITION,
  );
  assert.equal((await getRun({ tenantId: TENANT_A, runId: shortcutRun.run.run_id })).state, 'APPROVED');
});

test('replay is idempotent and a stale worker gets STATE_MISMATCH', options, async () => {
  const { run } = await createRun('replay');
  const first = await transition(run.run_id, 'VALIDATED', { expectedState: 'RECEIVED' });
  assert.equal(first.transitioned, true);

  const replay = await transition(run.run_id, 'VALIDATED', { expectedState: 'RECEIVED' });
  assert.equal(replay.transitioned, false);
  assert.equal(replay.idempotent, true);
  assert.equal(await auditCount(run.run_id, 'RUN_STATE_CHANGED'), 1);

  await assert.rejects(
    () => transition(run.run_id, 'PROPOSED', { expectedState: 'RECEIVED' }),
    (error) => error.code === WORKFLOW_ERROR.STATE_MISMATCH,
  );
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'VALIDATED');
});

test('two concurrent transitions from the same state produce one audit event', options, async () => {
  const { run } = await createRun('concurrent');
  const [first, second] = await Promise.all([
    transition(run.run_id, 'VALIDATED', { expectedState: 'RECEIVED' }),
    transition(run.run_id, 'VALIDATED', { expectedState: 'RECEIVED' }),
  ]);
  assert.equal([first, second].filter((result) => result.transitioned).length, 1);
  assert.equal([first, second].filter((result) => result.idempotent).length, 1);
  assert.equal(await auditCount(run.run_id, 'RUN_STATE_CHANGED'), 1);
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'VALIDATED');
});

test('cross-tenant transitions fail closed with NOT_FOUND', options, async () => {
  const { run } = await createRun('cross-tenant');
  await assert.rejects(
    () =>
      transitionRunInTenant({
        tenantId: TENANT_B,
        runId: run.run_id,
        targetState: 'VALIDATED',
      }),
    (error) => error.code === WORKFLOW_ERROR.NOT_FOUND,
  );
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'RECEIVED');
});
