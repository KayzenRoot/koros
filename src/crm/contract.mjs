import { createHash } from 'node:crypto';
import { normalizeEmail } from '../auth/password.mjs';

export const CRM_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED_FIELD: 'UNAUTHORIZED_FIELD',
  INVALID_TENANT: 'INVALID_TENANT',
  INVALID_ADAPTER: 'INVALID_ADAPTER',
  NOT_FOUND: 'NOT_FOUND',
  ENTITLEMENT_DENIED: 'ENTITLEMENT_DENIED',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  APPROVAL_MISMATCH: 'APPROVAL_MISMATCH',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
  CONFLICT: 'CONFLICT',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
});

export const CAPABILITIES = Object.freeze({
  CONTACT_READ: 'contact.read',
  CONTACT_UPSERT: 'contact.upsert',
});

export const CONTACT_FIELDS = Object.freeze([
  'external_id',
  'email',
  'name',
  'company_external_id',
]);

const CANONICAL_FIELDS = new Set(['externalId', 'email', 'name', 'companyExternalId']);
const TENANT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const MAX_EXTERNAL_ID_LENGTH = 200;
const MAX_NAME_LENGTH = 200;

export class CrmError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'CrmError';
    this.code = code;
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedString(value, maxLength) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) return '';
  return trimmed;
}

export function assertTenantId(tenantId) {
  if (typeof tenantId !== 'string' || !TENANT_ID.test(tenantId)) {
    throw new CrmError(CRM_ERROR.INVALID_TENANT);
  }
  return tenantId;
}

/**
 * Accepts only the documented contact surface and returns the canonical shape.
 * Unknown fields are rejected before any provider mapping happens.
 */
export function canonicalContact(input) {
  if (!isPlainObject(input)) throw new CrmError(CRM_ERROR.INVALID_INPUT);
  for (const key of Object.keys(input)) {
    if (!CONTACT_FIELDS.includes(key)) throw new CrmError(CRM_ERROR.UNAUTHORIZED_FIELD);
  }

  const externalId = boundedString(input.external_id, MAX_EXTERNAL_ID_LENGTH);
  if (!externalId) throw new CrmError(CRM_ERROR.INVALID_INPUT);

  const contact = { externalId };
  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);
    if (!email) throw new CrmError(CRM_ERROR.INVALID_INPUT);
    contact.email = email;
  }
  if (input.name !== undefined) {
    const name = boundedString(input.name, MAX_NAME_LENGTH);
    if (!name) throw new CrmError(CRM_ERROR.INVALID_INPUT);
    contact.name = name;
  }
  if (input.company_external_id !== undefined) {
    const companyExternalId = boundedString(input.company_external_id, MAX_EXTERNAL_ID_LENGTH);
    if (!companyExternalId) throw new CrmError(CRM_ERROR.INVALID_INPUT);
    contact.companyExternalId = companyExternalId;
  }
  return contact;
}

/** Validates an already-canonical contact without accepting snake_case aliases. */
export function assertCanonicalContact(value) {
  if (!isPlainObject(value)) throw new CrmError(CRM_ERROR.INVALID_INPUT);
  for (const key of Object.keys(value)) {
    if (!CANONICAL_FIELDS.has(key)) throw new CrmError(CRM_ERROR.UNAUTHORIZED_FIELD);
  }
  const externalId = boundedString(value.externalId, MAX_EXTERNAL_ID_LENGTH);
  if (!externalId) throw new CrmError(CRM_ERROR.INVALID_INPUT);

  const contact = { externalId };
  if (value.email !== undefined) {
    const email = normalizeEmail(value.email);
    if (!email) throw new CrmError(CRM_ERROR.INVALID_INPUT);
    contact.email = email;
  }
  if (value.name !== undefined) {
    const name = boundedString(value.name, MAX_NAME_LENGTH);
    if (!name) throw new CrmError(CRM_ERROR.INVALID_INPUT);
    contact.name = name;
  }
  if (value.companyExternalId !== undefined) {
    const companyExternalId = boundedString(value.companyExternalId, MAX_EXTERNAL_ID_LENGTH);
    if (!companyExternalId) throw new CrmError(CRM_ERROR.INVALID_INPUT);
    contact.companyExternalId = companyExternalId;
  }
  return contact;
}

/** Approval is bound to the exact normalized payload, not to a raw request body. */
export function contactPayloadHash(contact) {
  const canonical = assertCanonicalContact(contact);
  const ordered = {
    externalId: canonical.externalId,
    email: canonical.email ?? null,
    name: canonical.name ?? null,
    companyExternalId: canonical.companyExternalId ?? null,
  };
  return createHash('sha256').update(JSON.stringify(ordered)).digest('hex');
}

export function assertCapability(adapter, capability) {
  if (!adapter || !Array.isArray(adapter.capabilities) || !adapter.capabilities.includes(capability)) {
    throw new CrmError(CRM_ERROR.ENTITLEMENT_DENIED);
  }
}

export function assertApproval(approval, contact) {
  if (!isPlainObject(approval) || approval.approved !== true) {
    throw new CrmError(CRM_ERROR.APPROVAL_REQUIRED);
  }
  if (approval.payloadHash !== contactPayloadHash(contact)) {
    throw new CrmError(CRM_ERROR.APPROVAL_MISMATCH);
  }
  const expiresAt = typeof approval.expiresAt === 'string' ? Date.parse(approval.expiresAt) : Number.NaN;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new CrmError(CRM_ERROR.APPROVAL_EXPIRED);
  }
}

export function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') throw new CrmError(CRM_ERROR.INVALID_ADAPTER);
  for (const method of ['verifyConnection', 'upsertPerson', 'getPerson']) {
    if (typeof adapter[method] !== 'function') throw new CrmError(CRM_ERROR.INVALID_ADAPTER);
  }
  if (typeof adapter.provider !== 'string' || !adapter.provider) {
    throw new CrmError(CRM_ERROR.INVALID_ADAPTER);
  }
  if (!Array.isArray(adapter.capabilities)) throw new CrmError(CRM_ERROR.INVALID_ADAPTER);
  return adapter;
}
