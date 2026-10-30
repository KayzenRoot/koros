import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closePool, withTenant } from '../src/db.mjs';
import { createAgendorMock } from '../src/crm/mock-agendor.mjs';
import { enqueueAction, processNextAction } from '../src/outbox/index.mjs';
import {
  APPROVAL_ERROR,
  decideApprovalInTenant,
  requestApprovalInTenant,
  revokeApprovalInTenant,
  verifyApprovalInTenant,
} from '../src/approval/index.mjs';
import { createRunInTenant, getRun, transitionRunInTenant } from '../src/workflow/index.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const LEAD_A = 'a0000000-0000-4000-8000-000000000004';
const WORKFLOW_VERSION_A = 'a0000000-0000-4000-8000-000000000002';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const RUN_ID = `${Date.now().toString(36)}-${process.pid}`;
const SCOPE = 'crm.contact.upsert';

function payloadFor(suffix) {
  return {
    external_id: `approval-${RUN_ID}-${suffix}`,
    email: `${suffix}@example.invalid`,
    name: `Synthetic ${suffix}`,
  };
}

async function pendingRun(suffix) {
  const { run } = await createRunInTenant({
    tenantId: TENANT_A,
    leadId: LEAD_A,
    workflowVersionId: WORKFLOW_VERSION_A,
    idempotencyKey: `approval-${RUN_ID}-${suffix}`,
  });
  for (const state of ['VALIDATED', 'PROPOSED', 'PENDING_APPROVAL']) {
    await transitionRunInTenant({ tenantId: TENANT_A, runId: run.run_id, targetState: state });
  }
  return run;
}

function request(run, payload, overrides = {}) {
  return requestApprovalInTenant({
    tenantId: TENANT_A,
    runId: run.run_id,
    actorUserId: USER_A,
    scope: SCOPE,
    payload,
    payloadVersion: 1,
    ttlSeconds: 300,
    ...overrides,
  });
}

function decide(approval, token, overrides = {}) {
  return decideApprovalInTenant({
    tenantId: TENANT_A,
    approvalId: approval.approval_id,
    actorUserId: USER_A,
    token,
    decision: 'APPROVED',
    ...overrides,
  });
}

async function countRows(sql, params) {
  return withTenant(TENANT_A, async (client) => {
    const result = await client.query(sql, params);
    return result.rows[0].total;
  });
}

function outboxCount(runId) {
  return countRows('SELECT count(*)::int AS total FROM outbox_actions WHERE run_id = $1', [runId]);
}

function approvalCount(runId) {
  return countRows('SELECT count(*)::int AS total FROM approvals WHERE run_id = $1', [runId]);
}

function auditCount(runId, action) {
  return countRows(
    'SELECT count(*)::int AS total FROM audit_events WHERE run_id = $1 AND action = $2',
    [runId, action],
  );
}

function adapterHasContact(adapter, externalId) {
  try {
    adapter.getPerson({ tenantId: TENANT_A, externalId });
    return true;
  } catch (error) {
    if (error.code === 'NOT_FOUND') return false;
    throw error;
  }
}

async function storedDecision(approvalId) {
  return withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT decision FROM approvals WHERE approval_id = $1', [
      approvalId,
    ]);
    return result.rows[0].decision;
  });
}

async function enqueueApproved(run, payload, approval) {
  return withTenant(TENANT_A, (client) =>
    enqueueAction({
      client,
      tenantId: TENANT_A,
      runId: run.run_id,
      source: 'synthetic-crm',
      externalId: payload.external_id,
      payloadVersion: 1,
      target: 'crm:agendor',
      contact: payload,
      approval: {
        approved: true,
        payloadHash: approval.payload_hash,
        expiresAt: new Date(approval.expires_at).toISOString(),
      },
    }),
  );
}

after(async () => {
  if (enabled) await closePool();
});

test('a pending approval is not usable before the decision', options, async () => {
  const run = await pendingRun('exact');
  const payload = payloadFor('exact');
  const requested = await request(run, payload);
  assert.equal(requested.created, true);
  assert.equal(requested.approval.decision, 'PENDING');
  assert.ok(requested.token);

  await assert.rejects(
    () =>
      verifyApprovalInTenant({
        tenantId: TENANT_A,
        approvalId: requested.approval.approval_id,
        scope: SCOPE,
        payload,
        payloadVersion: 1,
      }),
    (error) => error.code === APPROVAL_ERROR.NOT_APPROVED,
  );
  assert.equal(await outboxCount(run.run_id), 0);
});

test('an approved exact payload can be enqueued and dispatched once', options, async () => {
  const run = await pendingRun('approved');
  const payload = payloadFor('approved');
  const requested = await request(run, payload);
  const approved = await decide(requested.approval, requested.token);
  assert.equal(approved.status, 'APPROVED');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'APPROVED');

  const verified = await verifyApprovalInTenant({
    tenantId: TENANT_A,
    approvalId: requested.approval.approval_id,
    scope: SCOPE,
    payload,
    payloadVersion: 1,
  });
  assert.equal(verified.payload_hash, requested.approval.payload_hash);

  const enqueued = await enqueueApproved(run, payload, requested.approval);
  assert.equal(enqueued.created, true);
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'QUEUED');

  const adapter = createAgendorMock();
  const processed = await processNextAction({
    tenantId: TENANT_A,
    adapter,
    actionId: enqueued.action.action_id,
  });
  assert.equal(processed.outcome, 'COMPLETED');
  assert.equal(adapterHasContact(adapter, payload.external_id), true);
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'COMPLETED');
});

test('payload v2 after an approval for v1 is rejected with zero mock writes', options, async () => {
  const run = await pendingRun('payload-v2');
  const payloadV1 = payloadFor('payload-v1');
  const payloadV2 = { ...payloadV1, name: 'Changed After Approval' };
  const requested = await request(run, payloadV1);
  await decide(requested.approval, requested.token);

  await assert.rejects(
    () =>
      verifyApprovalInTenant({
        tenantId: TENANT_A,
        approvalId: requested.approval.approval_id,
        scope: SCOPE,
        payload: payloadV2,
        payloadVersion: 1,
      }),
    (error) => error.code === APPROVAL_ERROR.PAYLOAD_MISMATCH,
  );
  await assert.rejects(
    () => enqueueApproved(run, payloadV2, requested.approval),
    (error) => error.code === 'APPROVAL_MISMATCH',
  );
  assert.equal(await outboxCount(run.run_id), 0);
  assert.equal(adapterHasContact(createAgendorMock(), payloadV1.external_id), false);
});

test('a cross-tenant approval token is not found and cannot change the run', options, async () => {
  const run = await pendingRun('cross-tenant');
  const payload = payloadFor('cross-tenant');
  const requested = await request(run, payload);
  // The auth suite leaves tenant B's synthetic user as viewer; give it the
  // approver role so this test reaches the tenant-scoped approval lookup.
  await withTenant(TENANT_B, (client) =>
    client.query(
      `UPDATE memberships SET role = 'approver'
        WHERE tenant_id = $1 AND user_id = $2`,
      [TENANT_B, USER_B],
    ),
  );

  await assert.rejects(
    () =>
      decideApprovalInTenant({
        tenantId: TENANT_B,
        approvalId: requested.approval.approval_id,
        actorUserId: USER_B,
        token: requested.token,
        decision: 'APPROVED',
      }),
    (error) => error.code === APPROVAL_ERROR.NOT_FOUND,
  );
  assert.equal(await storedDecision(requested.approval.approval_id), 'PENDING');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'PENDING_APPROVAL');
  assert.equal(await outboxCount(run.run_id), 0);
});

test('an expired approval transitions to EXPIRED and performs no write', options, async () => {
  const run = await pendingRun('expired');
  const payload = payloadFor('expired');
  const requestedAt = new Date();
  const requested = await request(run, payload, { ttlSeconds: 30, now: requestedAt });
  const expired = await decide(requested.approval, requested.token, {
    now: new Date(requestedAt.getTime() + 31_000),
  });
  assert.equal(expired.status, 'EXPIRED');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'EXPIRED');
  assert.equal(await outboxCount(run.run_id), 0);
  assert.equal(await auditCount(run.run_id, 'APPROVAL_EXPIRED'), 1);
});

test('double click produces one approval decision and one audit event', options, async () => {
  const run = await pendingRun('double-click');
  const payload = payloadFor('double-click');
  const requested = await request(run, payload);
  const [first, second] = await Promise.all([
    decide(requested.approval, requested.token),
    decide(requested.approval, requested.token),
  ]);
  assert.deepEqual(
    [first.status, second.status].sort(),
    ['APPROVED', 'IDEMPOTENT'],
  );
  assert.equal(await auditCount(run.run_id, 'APPROVAL_APPROVED'), 1);
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'APPROVED');
});

test('a forged approval token fails closed without mutation', options, async () => {
  const run = await pendingRun('forged');
  const payload = payloadFor('forged');
  const requested = await request(run, payload);
  await assert.rejects(
    () => decide(requested.approval, 'forged-token'),
    (error) => error.code === APPROVAL_ERROR.FORGED_APPROVAL,
  );
  assert.equal(await storedDecision(requested.approval.approval_id), 'PENDING');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'PENDING_APPROVAL');
  assert.equal(await outboxCount(run.run_id), 0);
});

test('an invalid approval policy creates no approval row', options, async () => {
  const run = await pendingRun('invalid-policy');
  const payload = payloadFor('invalid-policy');
  await assert.rejects(
    () => request(run, payload, { scope: 'crm.contact.delete' }),
    (error) => error.code === APPROVAL_ERROR.INVALID_POLICY,
  );
  await assert.rejects(
    () => request(run, { nested: { value: 1 } }),
    (error) => error.code === APPROVAL_ERROR.INVALID_POLICY,
  );
  await assert.rejects(
    () => request(run, { ...payload, ssn: 'not-allowed' }),
    (error) => error.code === APPROVAL_ERROR.INVALID_POLICY,
  );
  assert.equal(await approvalCount(run.run_id), 0);
  assert.equal(await outboxCount(run.run_id), 0);
});

test('rejection transitions the run to REJECTED and writes nothing', options, async () => {
  const run = await pendingRun('rejected');
  const payload = payloadFor('rejected');
  const requested = await request(run, payload);
  const rejected = await decide(requested.approval, requested.token, { decision: 'REJECTED' });
  assert.equal(rejected.status, 'REJECTED');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'REJECTED');
  assert.equal(await outboxCount(run.run_id), 0);
  assert.equal(adapterHasContact(createAgendorMock(), payload.external_id), false);
});

test('revocation before dispatch expires the run and blocks enqueue', options, async () => {
  const run = await pendingRun('revoked');
  const payload = payloadFor('revoked');
  const requested = await request(run, payload);
  await decide(requested.approval, requested.token);
  const revoked = await revokeApprovalInTenant({
    tenantId: TENANT_A,
    approvalId: requested.approval.approval_id,
    actorUserId: USER_A,
  });
  assert.equal(revoked.status, 'REVOKED');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'EXPIRED');
  await assert.rejects(
    () => enqueueApproved(run, payload, requested.approval),
    (error) => error.code === 'APPROVAL_REQUIRED',
  );
  assert.equal(await outboxCount(run.run_id), 0);
});

test('replaying the request does not create a second approval or token', options, async () => {
  const run = await pendingRun('request-replay');
  const payload = payloadFor('request-replay');
  const first = await request(run, payload);
  const second = await request(run, payload);
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.approval.approval_id, first.approval.approval_id);
  assert.equal(second.token, null);
  assert.equal(await approvalCount(run.run_id), 1);
  assert.equal(await outboxCount(run.run_id), 0);
  await assert.rejects(
    () => request(run, payload, { payloadVersion: 2 }),
    (error) => error.code === APPROVAL_ERROR.IDEMPOTENCY_CONFLICT,
  );
});
