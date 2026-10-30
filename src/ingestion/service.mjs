import { createHash } from 'node:crypto';
import { withTenant } from '../db.mjs';
import { IngestionError } from './errors.mjs';
import { isValidTimestamp, verifySignature } from './signature.mjs';
import { parseLeadPayload } from './validate.mjs';

const TENANT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECRET_REF_RE = /^[A-Z][A-Z0-9_]{2,100}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const buckets = new Map();

export function resetIngestionRateLimit() {
  buckets.clear();
}

function rateLimited(key) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function boundedHeader(value, maxLength) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) return '';
  return trimmed;
}

function hashBody(rawBody) {
  return createHash('sha256').update(rawBody).digest('hex');
}

export async function ingestLead({ tenantId, provider, account, timestamp, signature, rawBody }) {
  if (typeof tenantId !== 'string' || !TENANT_RE.test(tenantId)) {
    throw new IngestionError(400, 'invalid_tenant');
  }
  const providerValue = boundedHeader(provider, 80);
  const accountValue = boundedHeader(account, 80);
  if (!providerValue || !accountValue) throw new IngestionError(400, 'invalid_source');
  if (!isValidTimestamp(timestamp)) throw new IngestionError(401, 'stale_timestamp');
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) throw new IngestionError(400, 'invalid_body');

  const key = `${tenantId}|${providerValue}|${accountValue}`;
  if (rateLimited(key)) throw new IngestionError(429, 'rate_limited');

  let connection;
  try {
    const result = await withTenant(tenantId, (client) =>
      client.query(
        "SELECT secret_ref FROM connections WHERE tenant_id = $1 AND provider = $2 AND external_account = $3 AND status = 'ACTIVE'",
        [tenantId, providerValue, accountValue],
      ),
    );
    connection = result.rows[0];
  } catch {
    throw new IngestionError(503, 'ingestion_unavailable');
  }
  if (!connection) throw new IngestionError(401, 'unauthorized_source');

  if (!SECRET_REF_RE.test(connection.secret_ref)) {
    throw new IngestionError(503, 'source_secret_unavailable');
  }
  const secret = process.env[connection.secret_ref];
  if (typeof secret !== 'string' || secret.length < 16) {
    throw new IngestionError(503, 'source_secret_unavailable');
  }
  if (!verifySignature(secret, timestamp, rawBody, signature)) {
    throw new IngestionError(401, 'invalid_signature');
  }

  const payload = parseLeadPayload(rawBody);
  const bodyHash = hashBody(rawBody);
  try {
    return await withTenant(tenantId, async (client) => {
      const event = await client.query(
        `INSERT INTO inbound_events (tenant_id, provider, external_id, body_hash, signature_status)
         VALUES ($1, $2, $3, $4, 'VALID')
         ON CONFLICT (tenant_id, provider, external_id) DO NOTHING
         RETURNING event_id`,
        [tenantId, providerValue, payload.externalId, bodyHash],
      );
      if (event.rowCount === 0) {
        const existing = await client.query(
          'SELECT event_id FROM inbound_events WHERE tenant_id = $1 AND provider = $2 AND external_id = $3',
          [tenantId, providerValue, payload.externalId],
        );
        const eventId = existing.rows[0]?.event_id;
        if (!eventId) throw new IngestionError(503, 'ingestion_unavailable');
        await client.query(
          'INSERT INTO audit_events (tenant_id, action, entity, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
          [tenantId, 'WEBHOOK_DUPLICATE', 'inbound_event', eventId, { provider: providerValue }],
        );
        return { status: 'duplicate', eventId, leadId: null, tenantId };
      }

      const eventId = event.rows[0].event_id;
      const lead = await client.query(
        `INSERT INTO leads (tenant_id, event_id, external_id, source, status, minimal_fields, consent_status)
         VALUES ($1, $2, $3, $4, 'RECEIVED', $5, $6)
         ON CONFLICT (tenant_id, source, external_id) DO NOTHING
         RETURNING lead_id`,
        [tenantId, eventId, payload.externalId, providerValue, payload.minimalFields, payload.consentStatus],
      );
      if (lead.rowCount === 0) {
        await client.query(
          'INSERT INTO audit_events (tenant_id, action, entity, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
          [tenantId, 'WEBHOOK_DUPLICATE', 'inbound_event', eventId, { provider: providerValue }],
        );
        return { status: 'duplicate', eventId, leadId: null, tenantId };
      }

      const leadId = lead.rows[0].lead_id;
      await client.query(
        'INSERT INTO audit_events (tenant_id, action, entity, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)',
        [tenantId, 'WEBHOOK_ACCEPTED', 'lead', leadId, { provider: providerValue }],
      );
      return { status: 'accepted', eventId, leadId, tenantId };
    });
  } catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError(503, 'ingestion_unavailable');
  }
}
