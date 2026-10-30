import { randomUUID } from 'node:crypto';
import { withTenant } from '../db.mjs';
import { insertAuditEvent } from '../audit/events.mjs';
import { CONTROL_ERROR, ControlError } from './errors.mjs';
import { requirePermission } from './authz.mjs';
import { assertOperationsAllowedWithClient } from './guard.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
  return value;
}

function requireText(value, maxLength) {
  if (typeof value !== 'string') throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
  return trimmed;
}

function requireAmount(value, { integer = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
  if (integer && !Number.isInteger(value)) throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  return value;
}

function assertNow(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
}

export async function setBudget({
  client,
  tenantId,
  periodStart,
  periodEnd,
  maxTokens,
  maxCost,
  actorUserId,
  now = new Date(),
}) {
  requireUuid(tenantId);
  const normalizedActor = requireUuid(actorUserId);
  assertNow(now);
  if (!(periodStart instanceof Date) || !(periodEnd instanceof Date)) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
  if (periodEnd <= periodStart) throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  requireAmount(maxTokens, { integer: true });
  requireAmount(maxCost);
  await requirePermission(client, tenantId, normalizedActor, 'tenant:configure');

  const result = await client.query(
    `INSERT INTO budget_policies
       (tenant_id, period_start, period_end, max_tokens, max_cost, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (tenant_id) DO UPDATE
       SET period_start = EXCLUDED.period_start,
           period_end = EXCLUDED.period_end,
           max_tokens = EXCLUDED.max_tokens,
           max_cost = EXCLUDED.max_cost,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by
     RETURNING *`,
    [tenantId, periodStart, periodEnd, maxTokens, maxCost, now, normalizedActor],
  );
  const policy = result.rows[0];
  await insertAuditEvent(client, {
    tenantId,
    actorUserId: normalizedActor,
    action: 'BUDGET_UPDATED',
    entity: 'budget_policy',
    entityId: tenantId,
    metadata: {
      maxTokens,
      maxCost,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    },
    createdAt: now,
  });
  return policy;
}

export async function setBudgetInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => setBudget({ client, tenantId, ...options }));
}

async function usedBudget(client, tenantId, periodStart, periodEnd) {
  const result = await client.query(
    `SELECT COALESCE(SUM(tokens), 0)::bigint AS tokens,
            COALESCE(SUM(cost_estimate), 0)::numeric AS cost
       FROM usage_ledger
      WHERE tenant_id = $1
        AND status IN ('RESERVED', 'SETTLED')
        AND created_at >= $2 AND created_at < $3`,
    [tenantId, periodStart, periodEnd],
  );
  return {
    tokens: Number(result.rows[0].tokens),
    cost: Number(result.rows[0].cost),
  };
}

/** Reserves budget before paid work; the budget row lock prevents concurrent overspend. */
export async function reserveUsage({
  client,
  tenantId,
  runId,
  provider,
  operation,
  estimatedTokens,
  estimatedCost,
  correlationId = null,
  now = new Date(),
}) {
  requireUuid(tenantId);
  const normalizedRunId = requireUuid(runId);
  const normalizedProvider = requireText(provider, 100);
  const normalizedOperation = requireText(operation, 100);
  requireAmount(estimatedTokens, { integer: true });
  requireAmount(estimatedCost);
  assertNow(now);
  const correlation = correlationId === null ? randomUUID() : requireUuid(correlationId);

  const budget = await client.query(
    'SELECT * FROM budget_policies WHERE tenant_id = $1 FOR UPDATE',
    [tenantId],
  );
  if (budget.rowCount !== 1) throw new ControlError(CONTROL_ERROR.BUDGET_NOT_CONFIGURED);
  const policy = budget.rows[0];
  const periodStart = new Date(policy.period_start);
  const periodEnd = new Date(policy.period_end);
  if (now < periodStart || now >= periodEnd) {
    throw new ControlError(CONTROL_ERROR.BUDGET_PERIOD_INVALID);
  }
  await assertOperationsAllowedWithClient(client, tenantId);

  const used = await usedBudget(client, tenantId, periodStart, periodEnd);
  if (
    used.tokens + estimatedTokens > Number(policy.max_tokens) ||
    used.cost + estimatedCost > Number(policy.max_cost)
  ) {
    throw new ControlError(CONTROL_ERROR.BUDGET_EXCEEDED);
  }

  const inserted = await client.query(
    `INSERT INTO usage_ledger
       (tenant_id, run_id, provider, tokens, cost_estimate, correlation_id, operation,
        status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'RESERVED', $8, $8)
     RETURNING *`,
    [
      tenantId,
      normalizedRunId,
      normalizedProvider,
      estimatedTokens,
      estimatedCost,
      correlation,
      normalizedOperation,
      now,
    ],
  );
  const usage = inserted.rows[0];
  await insertAuditEvent(client, {
    tenantId,
    runId: normalizedRunId,
    action: 'USAGE_RESERVED',
    entity: 'usage',
    entityId: usage.usage_id,
    metadata: {
      operation: normalizedOperation,
      provider: normalizedProvider,
      tokens: estimatedTokens,
      cost: estimatedCost,
    },
    correlationId: correlation,
    createdAt: now,
  });
  return usage;
}

export async function settleUsage({
  client,
  tenantId,
  usageId,
  actualTokens,
  actualCost,
  now = new Date(),
}) {
  requireUuid(tenantId);
  const normalizedUsageId = requireUuid(usageId);
  requireAmount(actualTokens, { integer: true });
  requireAmount(actualCost);
  assertNow(now);
  const current = await client.query(
    'SELECT * FROM usage_ledger WHERE tenant_id = $1 AND usage_id = $2 FOR UPDATE',
    [tenantId, normalizedUsageId],
  );
  if (current.rowCount !== 1) throw new ControlError(CONTROL_ERROR.NOT_FOUND);
  const usage = current.rows[0];
  if (usage.status !== 'RESERVED') throw new ControlError(CONTROL_ERROR.INVALID_STATE);
  if (actualTokens > Number(usage.tokens) || actualCost > Number(usage.cost_estimate)) {
    throw new ControlError(CONTROL_ERROR.SETTLEMENT_EXCEEDS_RESERVATION);
  }
  const updated = await client.query(
    `UPDATE usage_ledger
        SET tokens = $3, cost_estimate = $4, status = 'SETTLED', updated_at = $5
      WHERE tenant_id = $1 AND usage_id = $2
      RETURNING *`,
    [tenantId, normalizedUsageId, actualTokens, actualCost, now],
  );
  await insertAuditEvent(client, {
    tenantId,
    runId: usage.run_id,
    action: 'USAGE_SETTLED',
    entity: 'usage',
    entityId: normalizedUsageId,
    metadata: { operation: usage.operation, provider: usage.provider, tokens: actualTokens, cost: actualCost },
    correlationId: usage.correlation_id,
    createdAt: now,
  });
  return updated.rows[0];
}

export async function releaseUsage({ client, tenantId, usageId, now = new Date() }) {
  requireUuid(tenantId);
  const normalizedUsageId = requireUuid(usageId);
  assertNow(now);
  const updated = await client.query(
    `UPDATE usage_ledger
        SET status = 'RELEASED', updated_at = $3
      WHERE tenant_id = $1 AND usage_id = $2 AND status = 'RESERVED'
      RETURNING *`,
    [tenantId, normalizedUsageId, now],
  );
  if (updated.rowCount !== 1) throw new ControlError(CONTROL_ERROR.INVALID_STATE);
  const usage = updated.rows[0];
  await insertAuditEvent(client, {
    tenantId,
    runId: usage.run_id,
    action: 'USAGE_RELEASED',
    entity: 'usage',
    entityId: normalizedUsageId,
    metadata: { operation: usage.operation, provider: usage.provider },
    correlationId: usage.correlation_id,
    createdAt: now,
  });
  return usage;
}

/**
 * Reserves before the callback and settles after success. The callback is never
 * called when budget or kill switch denies the operation.
 */
export async function runMeteredOperation({
  tenantId,
  runId,
  provider,
  operation,
  estimatedTokens,
  estimatedCost,
  action,
  now = new Date(),
}) {
  if (typeof action !== 'function') throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  const reservation = await withTenant(tenantId, (client) =>
    reserveUsage({
      client,
      tenantId,
      runId,
      provider,
      operation,
      estimatedTokens,
      estimatedCost,
      now,
    }),
  );

  let result;
  try {
    result = await action();
  } catch (error) {
    await withTenant(tenantId, (client) =>
      releaseUsage({ client, tenantId, usageId: reservation.usage_id, now: new Date() }),
    );
    throw error;
  }

  const settled = await withTenant(tenantId, (client) =>
    settleUsage({
      client,
      tenantId,
      usageId: reservation.usage_id,
      actualTokens: result?.tokens ?? estimatedTokens,
      actualCost: result?.cost ?? estimatedCost,
      now: new Date(),
    }),
  );
  return { result, usage: settled };
}

export async function getTenantMetrics({ tenantId }) {
  requireUuid(tenantId);
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT
         (SELECT count(*)::int FROM audit_events WHERE tenant_id = $1) AS audit_events,
         (SELECT count(*)::int FROM runs WHERE tenant_id = $1) AS runs,
         (SELECT count(*)::int FROM runs WHERE tenant_id = $1 AND state = 'COMPLETED') AS completed_runs,
         (SELECT COALESCE(SUM(tokens), 0)::bigint FROM usage_ledger
           WHERE tenant_id = $1 AND status = 'SETTLED') AS tokens,
         (SELECT COALESCE(SUM(cost_estimate), 0)::numeric FROM usage_ledger
           WHERE tenant_id = $1 AND status = 'SETTLED') AS cost,
         (SELECT max_tokens FROM budget_policies WHERE tenant_id = $1) AS budget_max_tokens,
         (SELECT max_cost FROM budget_policies WHERE tenant_id = $1) AS budget_max_cost,
         (SELECT kill_switch_active FROM tenant_controls WHERE tenant_id = $1) AS kill_switch_active`,
      [tenantId],
    );
    const row = result.rows[0];
    return {
      audit_events: Number(row.audit_events),
      runs: Number(row.runs),
      completed_runs: Number(row.completed_runs),
      tokens: Number(row.tokens),
      cost: Number(row.cost),
      budget_max_tokens: row.budget_max_tokens === null ? null : Number(row.budget_max_tokens),
      budget_max_cost: row.budget_max_cost === null ? null : Number(row.budget_max_cost),
      kill_switch_active: Boolean(row.kill_switch_active),
    };
  });
}
