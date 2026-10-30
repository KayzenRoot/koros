import { withTenant } from '../db.mjs';
import { permissionsForRole } from '../auth/rbac.mjs';

const QUEUE_STATES = Object.freeze(['PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'RECONCILING', 'PAUSED']);
const FAILURE_STATES = Object.freeze(['FAILED', 'REJECTED', 'EXPIRED']);
const RECENT_LIMIT = 20;

function toCounts(byState) {
  const total = Object.values(byState).reduce((sum, value) => sum + value, 0);
  return {
    total,
    queue: QUEUE_STATES.reduce((sum, state) => sum + (byState[state] ?? 0), 0),
    failures: FAILURE_STATES.reduce((sum, state) => sum + (byState[state] ?? 0), 0),
    completed: byState.COMPLETED ?? 0,
    paused: byState.PAUSED ?? 0,
  };
}

/** Read-only, tenant-scoped dashboard projection. No PII, no mutation. */
export async function getDashboardSummary({ tenantId, role }) {
  return withTenant(tenantId, async (client) => {
    const organization = await client.query(
      'SELECT tenant_id, name FROM organizations WHERE tenant_id = $1',
      [tenantId],
    );
    if (organization.rowCount !== 1) throw new Error('tenant_not_found');

    const countRows = await client.query(
      'SELECT state, count(*)::int AS total FROM runs WHERE tenant_id = $1 GROUP BY state',
      [tenantId],
    );
    const byState = {};
    for (const row of countRows.rows) byState[row.state] = row.total;

    const recent = await client.query(
      `SELECT run_id, state, idempotency_key, created_at, updated_at
         FROM runs WHERE tenant_id = $1
        ORDER BY updated_at DESC, run_id DESC
        LIMIT $2`,
      [tenantId, RECENT_LIMIT],
    );
    const queue = await client.query(
      `SELECT run_id, state, idempotency_key, created_at, updated_at
         FROM runs WHERE tenant_id = $1 AND state = ANY($2::text[])
        ORDER BY updated_at ASC, run_id ASC
        LIMIT $3`,
      [tenantId, QUEUE_STATES, RECENT_LIMIT],
    );
    const failures = await client.query(
      `SELECT run_id, state, idempotency_key, created_at, updated_at
         FROM runs WHERE tenant_id = $1 AND state = ANY($2::text[])
        ORDER BY updated_at DESC, run_id DESC
        LIMIT $3`,
      [tenantId, FAILURE_STATES, RECENT_LIMIT],
    );

    const budget = await client.query(
      `SELECT max_tokens, max_cost, period_start, period_end
         FROM budget_policies WHERE tenant_id = $1`,
      [tenantId],
    );
    const control = await client.query(
      'SELECT kill_switch_active, kill_switch_reason FROM tenant_controls WHERE tenant_id = $1',
      [tenantId],
    );

    let usage = { tokens: 0, cost: 0 };
    if (budget.rowCount === 1) {
      const result = await client.query(
        `SELECT COALESCE(SUM(tokens), 0)::bigint AS tokens,
                COALESCE(SUM(cost_estimate), 0)::numeric AS cost
           FROM usage_ledger
          WHERE tenant_id = $1
            AND status IN ('RESERVED', 'SETTLED')
            AND created_at >= $2 AND created_at < $3`,
        [tenantId, budget.rows[0].period_start, budget.rows[0].period_end],
      );
      usage = {
        tokens: Number(result.rows[0].tokens),
        cost: Number(result.rows[0].cost),
      };
    }

    return {
      tenant: {
        id: organization.rows[0].tenant_id,
        name: organization.rows[0].name,
      },
      role,
      permissions: permissionsForRole(role),
      counts: toCounts(byState),
      byState,
      queue: queue.rows,
      failures: failures.rows,
      runs: recent.rows,
      limits: {
        budgetMaxTokens: budget.rowCount === 1 ? Number(budget.rows[0].max_tokens) : null,
        budgetMaxCost: budget.rowCount === 1 ? Number(budget.rows[0].max_cost) : null,
        tokensUsed: usage.tokens,
        costUsed: usage.cost,
        periodStart: budget.rowCount === 1 ? budget.rows[0].period_start : null,
        periodEnd: budget.rowCount === 1 ? budget.rows[0].period_end : null,
        killSwitchActive: control.rowCount === 1 ? control.rows[0].kill_switch_active : true,
        killSwitchReason: control.rowCount === 1 ? control.rows[0].kill_switch_reason : null,
      },
      generatedAt: new Date().toISOString(),
    };
  });
}
