import { normalizeEmail } from '../auth/password.mjs';
import { IngestionError } from './errors.mjs';

const TOP_LEVEL_FIELDS = new Set(['external_id', 'lead', 'schema_version']);
const LEAD_FIELDS = new Set(['email', 'name', 'intent', 'consent_status']);
const CONSENT_VALUES = new Set(['GRANTED', 'DENIED', 'UNKNOWN']);
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedString(value, maxLength) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) return '';
  return trimmed;
}

export function parseLeadPayload(rawBody) {
  let payload;
  try {
    payload = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody));
  } catch {
    throw new IngestionError(400, 'invalid_json');
  }
  if (!isPlainObject(payload)) throw new IngestionError(400, 'invalid_payload');
  for (const key of Object.keys(payload)) {
    if (!TOP_LEVEL_FIELDS.has(key)) throw new IngestionError(400, 'unknown_field');
  }
  if (payload.schema_version !== undefined && payload.schema_version !== 1) {
    throw new IngestionError(400, 'unsupported_schema_version');
  }
  const externalId = boundedString(payload.external_id, 200);
  if (!externalId) throw new IngestionError(400, 'invalid_external_id');

  const lead = payload.lead === undefined ? {} : payload.lead;
  if (!isPlainObject(lead)) throw new IngestionError(400, 'invalid_lead');
  for (const key of Object.keys(lead)) {
    if (!LEAD_FIELDS.has(key)) throw new IngestionError(400, 'unknown_lead_field');
  }

  const minimalFields = {};
  if (lead.email !== undefined) {
    const email = normalizeEmail(lead.email);
    if (!email) throw new IngestionError(400, 'invalid_email');
    minimalFields.email = email;
  }
  if (lead.name !== undefined) {
    const name = boundedString(lead.name, 200);
    if (!name) throw new IngestionError(400, 'invalid_name');
    minimalFields.name = name;
  }
  if (lead.intent !== undefined) {
    const intent = boundedString(lead.intent, 100);
    if (!intent) throw new IngestionError(400, 'invalid_intent');
    minimalFields.intent = intent;
  }
  const consentStatus = lead.consent_status ?? 'UNKNOWN';
  if (!CONSENT_VALUES.has(consentStatus)) throw new IngestionError(400, 'invalid_consent');

  return { externalId, minimalFields, consentStatus };
}
