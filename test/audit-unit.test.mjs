import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditEventHash, redactMetadata } from '../src/audit/index.mjs';

test('audit hash is stable across object key order', () => {
  const payloadA = { b: 2, a: 1, nested: { z: true, y: null } };
  const payloadB = { nested: { y: null, z: true }, a: 1, b: 2 };
  assert.equal(auditEventHash(null, payloadA), auditEventHash(null, payloadB));
  assert.notEqual(auditEventHash('a'.repeat(64), payloadA), auditEventHash(null, payloadA));
});

test('metadata redaction masks secret-like keys and bounds values', () => {
  const redacted = redactMetadata({
    api_key: 'super-secret',
    nested: { password: 'also-secret', authorization: 'Bearer token' },
    safe: 'visible',
    long: 'x'.repeat(400),
  });
  assert.equal(redacted.api_key, '[REDACTED]');
  assert.equal(redacted.nested.password, '[REDACTED]');
  assert.equal(redacted.nested.authorization, '[REDACTED]');
  assert.equal(redacted.safe, 'visible');
  assert.ok(redacted.long.endsWith('...[TRUNCATED]'));
  assert.equal(JSON.stringify(redacted).includes('super-secret'), false);
});
