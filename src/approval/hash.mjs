import { createHash } from 'node:crypto';
import { APPROVAL_ERROR, ApprovalError } from './errors.mjs';

const MAX_DEPTH = 20;

/** Code-unit comparator keeps hashes stable across locales. */
export function compareStrings(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function assertJsonValue(value, depth = 0) {
  if (depth > MAX_DEPTH) throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
  if (value === null) return;
  if (typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) assertJsonValue(item, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value)) assertJsonValue(value[key], depth + 1);
    return;
  }
  throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
}

/** Deterministic JSON used only for hashing; never for authorization decisions alone. */
export function stableStringify(value) {
  assertJsonValue(value);
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value)
    .sort(compareStrings)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

export function fieldsForPayload(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
  }
  const fields = Object.keys(payload).sort(compareStrings);
  if (fields.length === 0 || fields.length > 20) throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
  for (const field of fields) {
    if (field.length === 0 || field.length > 100 || /[\u0000-\u001f\u007f]/.test(field)) {
      throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
    }
    const value = payload[field];
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
      throw new ApprovalError(APPROVAL_ERROR.INVALID_POLICY);
    }
  }
  return fields;
}

export function approvalHash({ scope, operation, payload, fields, payloadVersion }) {
  return createHash('sha256')
    .update(stableStringify({ scope, operation, payload, fields, payloadVersion }))
    .digest('hex');
}
