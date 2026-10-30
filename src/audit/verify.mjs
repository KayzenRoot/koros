import { withTenant } from '../db.mjs';
import { auditEventHash } from './hash.mjs';

function payloadFor(row) {
  return {
    tenant_id: row.tenant_id,
    run_id: row.run_id,
    actor_user_id: row.actor_user_id,
    action: row.action,
    entity: row.entity,
    entity_id: row.entity_id,
    metadata: row.metadata,
    correlation_id: row.correlation_id,
    created_at: new Date(row.created_at).toISOString(),
  };
}

/** Recomputes every hashed event in tenant order; legacy NULL-hash rows are ignored. */
export async function verifyAuditChain({ tenantId }) {
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT audit_seq, tenant_id, run_id, actor_user_id, action, entity, entity_id,
              metadata, correlation_id, created_at, prev_hash, event_hash
         FROM audit_events
        WHERE tenant_id = $1 AND event_hash IS NOT NULL
        ORDER BY audit_seq`,
      [tenantId],
    );
    let previousHash = null;
    let checked = 0;
    for (const row of result.rows) {
      checked += 1;
      const expected = auditEventHash(previousHash, payloadFor(row));
      if (row.prev_hash !== previousHash || row.event_hash !== expected) {
        return { valid: false, checked, brokenAt: row.audit_seq };
      }
      previousHash = row.event_hash;
    }
    return { valid: true, checked, brokenAt: null };
  });
}
