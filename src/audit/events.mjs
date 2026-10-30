/** Shared insert for the append-only audit trail used by workflow, approval and outbox. */
export async function insertAuditEvent(
  client,
  { tenantId, runId, actorUserId = null, action, entity, entityId, metadata = {} },
) {
  await client.query(
    `INSERT INTO audit_events
       (tenant_id, run_id, actor_user_id, action, entity, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [tenantId, runId, actorUserId, action, entity, String(entityId), JSON.stringify(metadata)],
  );
}
