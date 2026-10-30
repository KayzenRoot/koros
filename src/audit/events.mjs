import { randomUUID } from 'node:crypto';
import { auditEventHash, redactMetadata } from './hash.mjs';

/**
 * Appends a redacted, hash-chained audit event. The caller must already be in a
 * tenant transaction; the advisory lock serializes the chain for that tenant.
 */
export async function insertAuditEvent(
  client,
  {
    tenantId,
    runId = null,
    actorUserId = null,
    action,
    entity,
    entityId,
    metadata = {},
    correlationId = null,
    createdAt = new Date(),
  },
) {
  if (!(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) {
    throw new Error('invalid_audit_timestamp');
  }
  const correlation = correlationId ?? randomUUID();
  const safeMetadata = redactMetadata(metadata);

  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [tenantId]);
  const previous = await client.query(
    `SELECT event_hash FROM audit_events
      WHERE tenant_id = $1 AND event_hash IS NOT NULL
      ORDER BY audit_seq DESC
      LIMIT 1`,
    [tenantId],
  );
  const prevHash = previous.rows[0]?.event_hash ?? null;
  const payload = {
    tenant_id: tenantId,
    run_id: runId,
    actor_user_id: actorUserId,
    action,
    entity,
    entity_id: String(entityId),
    metadata: safeMetadata,
    correlation_id: correlation,
    created_at: createdAt.toISOString(),
  };
  const eventHash = auditEventHash(prevHash, payload);

  const inserted = await client.query(
    `INSERT INTO audit_events
       (tenant_id, run_id, actor_user_id, action, entity, entity_id, metadata,
        correlation_id, prev_hash, event_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
     RETURNING event_id`,
    [
      tenantId,
      runId,
      actorUserId,
      action,
      entity,
      String(entityId),
      JSON.stringify(safeMetadata),
      correlation,
      prevHash,
      eventHash,
      createdAt,
    ],
  );
  return {
    eventId: inserted.rows[0].event_id,
    correlationId: correlation,
    eventHash,
    prevHash,
  };
}
