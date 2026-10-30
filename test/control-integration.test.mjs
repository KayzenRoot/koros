import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { closePool, withTenant } from '../src/db.mjs';
import { insertAuditEvent, verifyAuditChain } from '../src/audit/index.mjs';
import {
  CONTROL_ERROR,
  getTenantMetrics,
  runMeteredOperation,
  setBudgetInTenant,
  setKillSwitchInTenant,
} from '../src/control/index.mjs';
import { claimNextAction } from '../src/outbox/index.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const RUN_A = 'a0000000-0000-4000-8000-000000000005';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PSQL = process.env.PSQL_BIN || 'psql';

function budgetWindow() {
  return {
    periodStart: new Date(Date.now() - 3_600_000),
    periodEnd: new Date(Date.now() + 3_600_000),
  };
}

function psqlAsOwner(sql) {
  const result = spawnSync(PSQL, ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-tA', '-c', sql], {
    encoding: 'utf8',
    env: { ...process.env, PGUSER: process.env.PGUSER || 'postgres' },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

async function readUsage(usageId) {
  return withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT * FROM usage_ledger WHERE usage_id = $1', [usageId]);
    return result.rows[0];
  });
}

after(async () => {
  if (enabled) await closePool();
});

test('usage under the budget reserves, settles and is metered', options, async () => {
  await setBudgetInTenant({
    tenantId: TENANT_A,
    actorUserId: USER_A,
    ...budgetWindow(),
    maxTokens: 1000,
    maxCost: 10,
  });
  let calls = 0;
  const { result, usage } = await runMeteredOperation({
    tenantId: TENANT_A,
    runId: RUN_A,
    provider: 'mock-ai',
    operation: 'ai.classify',
    estimatedTokens: 100,
    estimatedCost: 1,
    action: async () => {
      calls += 1;
      return { tokens: 100, cost: 1 };
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { tokens: 100, cost: 1 });
  assert.equal(usage.status, 'SETTLED');
  assert.equal(usage.tokens, 100);
  assert.ok(usage.correlation_id);
  assert.equal((await readUsage(usage.usage_id)).status, 'SETTLED');
  assert.equal((await verifyAuditChain({ tenantId: TENANT_A })).valid, true);

  const metrics = await getTenantMetrics({ tenantId: TENANT_A });
  assert.ok(metrics.tokens >= 100);
  assert.equal(JSON.stringify(metrics).includes('@example.invalid'), false);
  assert.equal(JSON.stringify(metrics).includes('owner-a'), false);
});

test('budget exhaustion blocks before the paid action and creates no reservation', options, async () => {
  await setBudgetInTenant({
    tenantId: TENANT_A,
    actorUserId: USER_A,
    ...budgetWindow(),
    maxTokens: 10,
    maxCost: 1,
  });
  let calls = 0;
  await assert.rejects(
    () =>
      runMeteredOperation({
        tenantId: TENANT_A,
        runId: RUN_A,
        provider: 'mock-ai',
        operation: 'ai.overspend',
        estimatedTokens: 11,
        estimatedCost: 0.5,
        action: async () => {
          calls += 1;
          return { tokens: 11, cost: 0.5 };
        },
      }),
    (error) => error.code === CONTROL_ERROR.BUDGET_EXCEEDED,
  );
  assert.equal(calls, 0);
  const count = await withTenant(TENANT_A, async (client) => {
    const result = await client.query(
      "SELECT count(*)::int AS total FROM usage_ledger WHERE operation = 'ai.overspend'",
    );
    return result.rows[0].total;
  });
  assert.equal(count, 0);
});

test('the kill switch blocks paid work and outbox claims until disarmed', options, async () => {
  await setKillSwitchInTenant({
    tenantId: TENANT_A,
    active: true,
    reason: 'synthetic drill',
    actorUserId: USER_A,
  });
  try {
    let calls = 0;
    await assert.rejects(
      () =>
        runMeteredOperation({
          tenantId: TENANT_A,
          runId: RUN_A,
          provider: 'mock-ai',
          operation: 'ai.blocked',
          estimatedTokens: 1,
          estimatedCost: 0.1,
          action: async () => {
            calls += 1;
            return { tokens: 1, cost: 0.1 };
          },
        }),
      (error) => error.code === CONTROL_ERROR.KILL_SWITCH_ACTIVE,
    );
    assert.equal(calls, 0);
    await assert.rejects(
      () => claimNextAction({ tenantId: TENANT_A, actionId: randomUUID() }),
      (error) => error.code === CONTROL_ERROR.KILL_SWITCH_ACTIVE,
    );
  } finally {
    await setKillSwitchInTenant({
      tenantId: TENANT_A,
      active: false,
      actorUserId: USER_A,
    });
  }
  const metrics = await getTenantMetrics({ tenantId: TENANT_A });
  assert.equal(metrics.kill_switch_active, false);
});

test('audit metadata is redacted and the chain verifies', options, async () => {
  const event = await withTenant(TENANT_A, (client) =>
    insertAuditEvent(client, {
      tenantId: TENANT_A,
      runId: RUN_A,
      action: 'SECRET_REDACTION_TEST',
      entity: 'test',
      entityId: RUN_A,
      metadata: {
        api_key: 'super-secret-value',
        nested: { password: 'also-secret', authorization: 'Bearer value' },
        safe: 'visible',
      },
    }),
  );
  assert.match(event.eventHash, /^[0-9a-f]{64}$/);
  assert.match(event.correlationId, /^[0-9a-f-]{36}$/);
  const row = await withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT * FROM audit_events WHERE event_id = $1', [event.eventId]);
    return result.rows[0];
  });
  assert.equal(row.metadata.api_key, '[REDACTED]');
  assert.equal(row.metadata.nested.password, '[REDACTED]');
  assert.equal(row.metadata.nested.authorization, '[REDACTED]');
  assert.equal(row.metadata.safe, 'visible');
  assert.equal(JSON.stringify(row.metadata).includes('super-secret-value'), false);
  assert.equal((await verifyAuditChain({ tenantId: TENANT_A })).valid, true);
});

test('retroactive audit alteration is detected by the hash chain', options, async () => {
  const event = await withTenant(TENANT_A, (client) =>
    insertAuditEvent(client, {
      tenantId: TENANT_A,
      runId: RUN_A,
      action: 'TAMPER_TEST',
      entity: 'test',
      entityId: RUN_A,
      metadata: { safe: 'original' },
    }),
  );
  psqlAsOwner(
    `UPDATE audit_events SET metadata = '{"safe":"tampered"}'::jsonb WHERE event_id = '${event.eventId}'`,
  );
  const verification = await verifyAuditChain({ tenantId: TENANT_A });
  assert.equal(verification.valid, false);
  assert.ok(verification.checked >= 1);
  assert.ok(verification.brokenAt !== null);
});
