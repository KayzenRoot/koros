import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { closePool, withTenant } from '../src/db.mjs';
import { CrmError, canonicalContact, contactPayloadHash } from '../src/crm/contract.mjs';
import { createAgendorMock } from '../src/crm/mock-agendor.mjs';
import {
  OUTBOX_ERROR,
  claimNextAction,
  enqueueAction,
  processNextAction,
  resumePausedAction,
} from '../src/outbox/index.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const LEAD_A = 'a0000000-0000-4000-8000-000000000004';
const WORKFLOW_VERSION_A = 'a0000000-0000-4000-8000-000000000002';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RUN_ID = `${Date.now().toString(36)}-${process.pid}`;

async function createRun(client, suffix, { state = 'APPROVED' } = {}) {
  const runId = randomUUID();
  const externalId = `outbox-${RUN_ID}-${suffix}`;
  const contact = {
    external_id: externalId,
    email: `${suffix}@example.invalid`,
    name: `Synthetic ${suffix}`,
  };
  const canonical = canonicalContact(contact);
  const payloadHash = contactPayloadHash(canonical);
  const expiresAt = new Date(Date.now() + 86_400_000);
  const approvalId = randomUUID();

  await client.query(
    `INSERT INTO runs (run_id, tenant_id, lead_id, workflow_version_id, state, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [runId, TENANT_A, LEAD_A, WORKFLOW_VERSION_A, state, `outbox-${RUN_ID}-${suffix}`],
  );
  await client.query(
    `INSERT INTO approvals
       (approval_id, tenant_id, run_id, actor_user_id, payload_hash, decision, expires_at, decided_at)
     VALUES ($1, $2, $3, $4, $5, 'APPROVED', $6, now())`,
    [approvalId, TENANT_A, runId, USER_A, payloadHash, expiresAt],
  );

  return {
    runId,
    externalId,
    contact,
    payloadHash,
    approval: {
      approved: true,
      payloadHash,
      expiresAt: expiresAt.toISOString(),
    },
  };
}

async function enqueue(run, { target = 'crm:agendor', contact = run.contact, approval = run.approval } = {}) {
  return withTenant(TENANT_A, (client) =>
    enqueueAction({
      client,
      tenantId: TENANT_A,
      runId: run.runId,
      source: 'synthetic-crm',
      externalId: run.externalId,
      payloadVersion: 1,
      target,
      contact,
      approval,
    }),
  );
}

async function readState(actionId) {
  return withTenant(TENANT_A, async (client) => {
    const outbox = await client.query('SELECT * FROM outbox_actions WHERE action_id = $1', [actionId]);
    if (outbox.rowCount !== 1) return null;
    const action = outbox.rows[0];
    const run = await client.query('SELECT state FROM runs WHERE run_id = $1', [action.run_id]);
    const audits = await client.query(
      `SELECT action, metadata FROM audit_events
        WHERE entity = 'outbox_action' AND entity_id = $1
        ORDER BY created_at, action`,
      [actionId],
    );
    return {
      action,
      runState: run.rows[0]?.state,
      audits: audits.rows,
    };
  });
}

async function countActions(runId) {
  return withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT count(*)::int AS total FROM outbox_actions WHERE run_id = $1', [runId]);
    return result.rows[0].total;
  });
}

after(async () => {
  if (enabled) await closePool();
});

test('enqueue is idempotent, binds the payload and moves the run atomically', options, async () => {
  const run = await withTenant(TENANT_A, (client) => createRun(client, 'enqueue'));
  const first = await enqueue(run);
  assert.equal(first.created, true);
  assert.equal(first.action.status, 'PENDING');

  const second = await enqueue(run);
  assert.equal(second.created, false);
  assert.equal(second.action.action_id, first.action.action_id);
  assert.equal(await countActions(run.runId), 1);

  const state = await readState(first.action.action_id);
  assert.equal(state.action.status, 'PENDING');
  assert.equal(state.runState, 'DISPATCHING');
  assert.equal(state.audits.filter((entry) => entry.action === 'OUTBOX_ENQUEUED').length, 1);

  await assert.rejects(
    () => enqueue(run, { contact: { ...run.contact, name: 'Conflicting Payload' } }),
    (error) => error.code === OUTBOX_ERROR.IDEMPOTENCY_CONFLICT,
  );
});

test('enqueue without a persisted approval leaves no outbox row and no state change', options, async () => {
  const run = await withTenant(TENANT_A, (client) => createRun(client, 'no-approval'));
  await assert.rejects(
    () => enqueue(run, { approval: null }),
    (error) => error.code === OUTBOX_ERROR.APPROVAL_REQUIRED,
  );
  assert.equal(await countActions(run.runId), 0);

  const state = await withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT state FROM runs WHERE run_id = $1', [run.runId]);
    return result.rows[0].state;
  });
  assert.equal(state, 'APPROVED');

  const pendingRun = await withTenant(TENANT_A, (client) => createRun(client, 'not-approved', { state: 'PENDING_APPROVAL' }));
  await assert.rejects(
    () => enqueue(pendingRun),
    (error) => error.code === OUTBOX_ERROR.RUN_NOT_APPROVED,
  );
  assert.equal(await countActions(pendingRun.runId), 0);
});

test('a single dispatch completes the outbox action and the run', options, async () => {
  const run = await withTenant(TENANT_A, (client) => createRun(client, 'single-dispatch'));
  const { action } = await enqueue(run);
  const adapter = createAgendorMock();

  const result = await processNextAction({ tenantId: TENANT_A, adapter, actionId: action.action_id });
  assert.equal(result.processed, true);
  assert.equal(result.outcome, 'COMPLETED');

  const state = await readState(action.action_id);
  assert.equal(state.action.status, 'COMPLETED');
  assert.equal(state.action.attempts, 1);
  assert.equal(state.runState, 'COMPLETED');
  assert.ok(state.audits.some((entry) => entry.action === 'OUTBOX_COMPLETED'));

  const contact = adapter.getPerson({ tenantId: TENANT_A, externalId: run.externalId });
  assert.equal(contact.contact.email, run.contact.email.toLowerCase());

  const replay = await processNextAction({ tenantId: TENANT_A, adapter, actionId: action.action_id });
  assert.equal(replay.processed, false);
});

test('two simultaneous workers cannot claim the same action', options, async () => {
  const run = await withTenant(TENANT_A, (client) => createRun(client, 'double-claim'));
  const { action } = await enqueue(run);

  const [first, second] = await Promise.all([
    claimNextAction({ tenantId: TENANT_A, actionId: action.action_id }),
    claimNextAction({ tenantId: TENANT_A, actionId: action.action_id }),
  ]);
  assert.equal([first, second].filter(Boolean).length, 1);

  const state = await readState(action.action_id);
  assert.equal(state.action.status, 'DISPATCHING');
  assert.equal(state.action.attempts, 1);

  const otherTenant = await processNextAction({
    tenantId: TENANT_B,
    adapter: createAgendorMock(),
    actionId: action.action_id,
  });
  assert.equal(otherTenant.processed, false);
});

test('a timeout after a successful write reconciles without a second write', options, async () => {
  const run = await withTenant(TENANT_A, (client) => createRun(client, 'timeout-after-success'));
  const { action } = await enqueue(run);
  const base = createAgendorMock();
  let upserts = 0;
  let reads = 0;
  const adapter = {
    ...base,
    upsertPerson(args) {
      upserts += 1;
      base.upsertPerson(args);
      const error = new Error('synthetic timeout after commit');
      error.code = 'ETIMEDOUT';
      throw error;
    },
    getPerson(args) {
      reads += 1;
      return base.getPerson(args);
    },
  };

  const now = new Date();
  const first = await processNextAction({ tenantId: TENANT_A, adapter, actionId: action.action_id, now });
  assert.equal(first.outcome, 'UNCERTAIN');
  const ambiguous = await readState(action.action_id);
  assert.equal(ambiguous.action.status, 'UNCERTAIN');
  assert.equal(ambiguous.runState, 'UNCERTAIN_EXTERNAL_RESULT');
  assert.equal(upserts, 1);

  const second = await processNextAction({
    tenantId: TENANT_A,
    adapter,
    actionId: action.action_id,
    now: new Date(now.getTime() + 3_600_000),
  });
  assert.equal(second.outcome, 'RECONCILED');
  const reconciled = await readState(action.action_id);
  assert.equal(reconciled.action.status, 'COMPLETED');
  assert.equal(reconciled.runState, 'COMPLETED');
  assert.equal(upserts, 1);
  assert.equal(reads, 1);
  assert.ok(reconciled.audits.some((entry) => entry.action === 'OUTBOX_RECONCILED'));
  const contact = base.getPerson({ tenantId: TENANT_A, externalId: run.externalId });
  assert.equal(contact.contact.email, run.contact.email.toLowerCase());
});

test('an expired lease is recovered as uncertain and reconciled', options, async () => {
  const run = await withTenant(TENANT_A, (client) => createRun(client, 'lease-expired'));
  const { action } = await enqueue(run);
  const now = new Date();
  const claimed = await claimNextAction({
    tenantId: TENANT_A,
    actionId: action.action_id,
    now,
    leaseSeconds: 1,
  });
  assert.equal(claimed.status, 'DISPATCHING');

  const adapter = createAgendorMock();
  const recovered = await processNextAction({
    tenantId: TENANT_A,
    adapter,
    actionId: action.action_id,
    now: new Date(now.getTime() + 2_000),
  });
  assert.equal(recovered.outcome, 'RECONCILED_ABSENT');

  const state = await readState(action.action_id);
  assert.equal(state.action.status, 'PENDING');
  assert.equal(state.runState, 'DISPATCHING');
  assert.ok(state.audits.some((entry) => entry.action === 'OUTBOX_LEASE_EXPIRED'));
});

test('503 retries with backoff; quota pauses and can be resumed', options, async () => {
  const retryRun = await withTenant(TENANT_A, (client) => createRun(client, 'retry-503'));
  const retryAction = (await enqueue(retryRun)).action;
  const base = createAgendorMock();
  const retryAdapter = {
    ...base,
    upsertPerson() {
      const error = new Error('synthetic 503');
      error.status = 503;
      throw error;
    },
  };
  const now = new Date();
  const retry = await processNextAction({
    tenantId: TENANT_A,
    adapter: retryAdapter,
    actionId: retryAction.action_id,
    now,
  });
  assert.equal(retry.outcome, 'RETRY_SCHEDULED');
  const retryState = await readState(retryAction.action_id);
  assert.equal(retryState.action.status, 'PENDING');
  assert.equal(retryState.action.attempts, 1);
  assert.equal(retryState.runState, 'DISPATCHING');
  assert.ok(retryState.action.next_attempt_at.getTime() > now.getTime());

  const quotaRun = await withTenant(TENANT_A, (client) => createRun(client, 'quota'));
  const quotaAction = (await enqueue(quotaRun)).action;
  const quotaAdapter = {
    ...base,
    upsertPerson() {
      throw new CrmError('QUOTA_EXCEEDED');
    },
  };
  const quotaNow = new Date();
  const paused = await processNextAction({
    tenantId: TENANT_A,
    adapter: quotaAdapter,
    actionId: quotaAction.action_id,
    now: quotaNow,
  });
  assert.equal(paused.outcome, 'PAUSED');
  const pausedState = await readState(quotaAction.action_id);
  assert.equal(pausedState.action.status, 'PAUSED');
  assert.equal(pausedState.action.next_attempt_at, null);
  assert.equal(pausedState.runState, 'BLOCKED');
  assert.ok(pausedState.audits.some((entry) => entry.action === 'OUTBOX_PAUSED'));

  const resumed = await resumePausedAction({ tenantId: TENANT_A, actionId: quotaAction.action_id, now });
  assert.equal(resumed.status, 'PENDING');
  assert.equal(resumed.attempts, 0);
  const resumedState = await readState(quotaAction.action_id);
  assert.equal(resumedState.runState, 'DISPATCHING');
  assert.ok(resumedState.audits.some((entry) => entry.action === 'OUTBOX_RESUMED'));
});

test('terminal failure is final, and retry exhaustion is bounded', options, async () => {
  const terminalRun = await withTenant(TENANT_A, (client) => createRun(client, 'terminal'));
  const terminalAction = (await enqueue(terminalRun)).action;
  const terminalAdapter = {
    ...createAgendorMock(),
    upsertPerson() {
      throw new CrmError('UNAUTHORIZED_FIELD');
    },
  };
  const terminal = await processNextAction({
    tenantId: TENANT_A,
    adapter: terminalAdapter,
    actionId: terminalAction.action_id,
  });
  assert.equal(terminal.outcome, 'FAILED');
  const terminalState = await readState(terminalAction.action_id);
  assert.equal(terminalState.action.status, 'FAILED');
  assert.equal(terminalState.runState, 'FAILED');
  const replay = await processNextAction({
    tenantId: TENANT_A,
    adapter: createAgendorMock(),
    actionId: terminalAction.action_id,
  });
  assert.equal(replay.processed, false);

  const exhaustedRun = await withTenant(TENANT_A, (client) => createRun(client, 'exhausted'));
  const exhaustedAction = (await enqueue(exhaustedRun)).action;
  const unavailableAdapter = {
    ...createAgendorMock(),
    upsertPerson() {
      const error = new Error('synthetic 503');
      error.status = 503;
      throw error;
    },
  };
  const exhausted = await processNextAction({
    tenantId: TENANT_A,
    adapter: unavailableAdapter,
    actionId: exhaustedAction.action_id,
    maxAttempts: 1,
  });
  assert.equal(exhausted.outcome, 'FAILED');
  const exhaustedState = await readState(exhaustedAction.action_id);
  assert.equal(exhaustedState.action.status, 'FAILED');
  assert.ok(
    exhaustedState.audits.some(
      (entry) => entry.action === 'OUTBOX_FAILED' && entry.metadata.retryExhausted === true,
    ),
  );
});
