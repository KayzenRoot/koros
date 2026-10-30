import { createHash } from 'node:crypto';

const SENSITIVE_KEY = /(secret|token|password|authorization|cookie|api[_-]?key|credential)/i;
const MAX_STRING = 300;
const MAX_ARRAY = 20;
const MAX_KEYS = 50;
const MAX_DEPTH = 5;

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value)
    .sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

/** Masks credential-like keys and bounds the metadata before it is hashed/stored. */
export function redactMetadata(value, depth = 0) {
  if (depth > MAX_DEPTH) return '[TRUNCATED]';
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}...[TRUNCATED]` : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map((item) => redactMetadata(item, depth + 1));
  }
  if (typeof value === 'object') {
    const output = {};
    for (const key of Object.keys(value).slice(0, MAX_KEYS)) {
      output[key] = SENSITIVE_KEY.test(key)
        ? '[REDACTED]'
        : redactMetadata(value[key], depth + 1);
    }
    return output;
  }
  return '[TRUNCATED]';
}

export function auditEventHash(prevHash, payload) {
  return createHash('sha256')
    .update(stableStringify({ prev_hash: prevHash, payload }))
    .digest('hex');
}
