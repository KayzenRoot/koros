import { createHash } from 'node:crypto';
import { compareStrings, stableStringify } from '../approval/hash.mjs';
import { canonicalContact } from '../crm/contract.mjs';
import { normalizeEmail } from '../auth/password.mjs';
import { TEMPLATE_ERROR, TemplateError } from './errors.mjs';

export const TEMPLATE_SCHEMA_VERSION = 1;
export const LEAD_FIELDS = Object.freeze(['external_id', 'email', 'name', 'intent', 'consent_status']);
export const CONTACT_FIELDS = Object.freeze(['external_id', 'email', 'name', 'company_external_id']);

const TOP_LEVEL_FIELDS = new Set([
  'schema_version',
  'name',
  'source',
  'required_fields',
  'field_map',
  'crm',
  'approval',
  'limits',
]);
const SOURCE_FIELDS = new Set(['provider', 'account']);
const CRM_FIELDS = new Set(['operation', 'target']);
const APPROVAL_FIELDS = new Set(['required', 'scope', 'ttl_seconds']);
const LIMIT_FIELDS = new Set(['max_tokens', 'max_cost']);
const SECRET_KEY = /(^|[_\-])(secret|token|password|authorization|cookie|credential)([_\-]|$)|api[_\-]?key/i;
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

function assertExactKeys(value, allowed, path) {
  if (!isPlainObject(value)) throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  for (const key of Object.keys(value)) {
    if (SECRET_KEY.test(key)) throw new TemplateError(TEMPLATE_ERROR.SECRET_FIELD);
    if (!allowed.has(key)) throw new TemplateError(TEMPLATE_ERROR.UNKNOWN_FIELD);
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
}

function assertNoSecretKeys(value) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoSecretKeys(item);
    return;
  }
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (SECRET_KEY.test(key)) throw new TemplateError(TEMPLATE_ERROR.SECRET_FIELD);
    assertNoSecretKeys(value[key]);
  }
}

function assertNonNegative(value, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  if (integer && !Number.isInteger(value)) throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
}

export function validateTemplateConfig(config) {
  assertNoSecretKeys(config);
  assertExactKeys(config, TOP_LEVEL_FIELDS, 'config');
  if (config.schema_version !== TEMPLATE_SCHEMA_VERSION) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  const name = boundedString(config.name, 100);
  if (!name) throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);

  assertExactKeys(config.source, SOURCE_FIELDS, 'source');
  const provider = boundedString(config.source.provider, 100);
  const account = boundedString(config.source.account, 100);
  if (!provider || !account) throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);

  if (!Array.isArray(config.required_fields) || config.required_fields.length === 0 || config.required_fields.length > 5) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  const requiredFields = [...new Set(config.required_fields)];
  if (requiredFields.length !== config.required_fields.length) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  for (const field of requiredFields) {
    if (!LEAD_FIELDS.includes(field)) throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  if (!requiredFields.includes('external_id') || !requiredFields.includes('email')) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }

  if (!isPlainObject(config.field_map)) throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  const fieldMap = {};
  for (const [target, source] of Object.entries(config.field_map)) {
    if (SECRET_KEY.test(target)) throw new TemplateError(TEMPLATE_ERROR.SECRET_FIELD);
    if (!CONTACT_FIELDS.includes(target) || !LEAD_FIELDS.includes(source)) {
      throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
    }
    fieldMap[target] = source;
  }
  if (!fieldMap.external_id || !fieldMap.email) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }

  assertExactKeys(config.crm, CRM_FIELDS, 'crm');
  if (
    config.crm.operation !== 'crm.contact.upsert' ||
    !['crm:agendor', 'crm:hubspot'].includes(config.crm.target)
  ) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }

  assertExactKeys(config.approval, APPROVAL_FIELDS, 'approval');
  if (
    config.approval.required !== true ||
    config.approval.scope !== 'crm.contact.upsert' ||
    !Number.isInteger(config.approval.ttl_seconds) ||
    config.approval.ttl_seconds < 30 ||
    config.approval.ttl_seconds > 3600
  ) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }

  assertExactKeys(config.limits, LIMIT_FIELDS, 'limits');
  assertNonNegative(config.limits.max_tokens, true);
  assertNonNegative(config.limits.max_cost);

  return {
    schema_version: TEMPLATE_SCHEMA_VERSION,
    name,
    source: { provider, account },
    required_fields: requiredFields,
    field_map: fieldMap,
    crm: { operation: config.crm.operation, target: config.crm.target },
    approval: {
      required: true,
      scope: config.approval.scope,
      ttl_seconds: config.approval.ttl_seconds,
    },
    limits: { max_tokens: config.limits.max_tokens, max_cost: config.limits.max_cost },
  };
}

export function templateConfigHash(config) {
  return createHash('sha256').update(stableStringify(config)).digest('hex');
}

export function isBreakingTemplateChange(previous, next) {
  const core = (config) => ({
    source: config.source,
    required_fields: config.required_fields,
    field_map: config.field_map,
    crm: config.crm,
    approval_scope: config.approval.scope,
  });
  return stableStringify(core(previous)) !== stableStringify(core(next));
}

export function previewTemplateConfig(config, lead) {
  if (!isPlainObject(lead)) throw new TemplateError(TEMPLATE_ERROR.INVALID_FIELD);
  for (const key of Object.keys(lead)) {
    if (!LEAD_FIELDS.includes(key)) throw new TemplateError(TEMPLATE_ERROR.INVALID_FIELD);
  }
  for (const field of config.required_fields) {
    const value = lead[field];
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
      throw new TemplateError(TEMPLATE_ERROR.MISSING_REQUIRED_FIELD);
    }
  }
  const contact = {};
  for (const [target, source] of Object.entries(config.field_map)) {
    const value = lead[source];
    if (value === undefined || value === null || value === '') continue;
    contact[target] = target === 'email' ? normalizeEmail(value) : boundedString(value, 200);
    if (!contact[target]) throw new TemplateError(TEMPLATE_ERROR.INVALID_FIELD);
  }
  try {
    const canonical = canonicalContact(contact);
    return {
      operation: config.crm.operation,
      target: config.crm.target,
      payload: {
        external_id: canonical.externalId,
        ...(canonical.email ? { email: canonical.email } : {}),
        ...(canonical.name ? { name: canonical.name } : {}),
        ...(canonical.companyExternalId ? { company_external_id: canonical.companyExternalId } : {}),
      },
      fields: Object.keys(contact).sort(compareStrings),
      approval_required: true,
      approval_scope: config.approval.scope,
      ttl_seconds: config.approval.ttl_seconds,
      limits: config.limits,
    };
  } catch {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_FIELD);
  }
}
