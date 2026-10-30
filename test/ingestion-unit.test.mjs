import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IngestionError } from '../src/ingestion/errors.mjs';
import { isValidTimestamp, signPayload, verifySignature } from '../src/ingestion/signature.mjs';
import { parseLeadPayload } from '../src/ingestion/validate.mjs';

const SECRET = 'synthetic-webhook-secret-a';
const TIMESTAMP = '1790000000';

test('HMAC signatures verify only the exact timestamp and body', () => {
  const body = Buffer.from('{"external_id":"evt-1"}');
  const signature = signPayload(SECRET, TIMESTAMP, body);
  assert.match(signature, /^[0-9a-f]{64}$/);
  assert.equal(verifySignature(SECRET, TIMESTAMP, body, signature), true);
  assert.equal(verifySignature(SECRET, TIMESTAMP, Buffer.from('{"external_id":"evt-2"}'), signature), false);
  assert.equal(verifySignature(SECRET, '1790000001', body, signature), false);
  assert.equal(verifySignature('wrong-secret-value', TIMESTAMP, body, signature), false);
  assert.equal(verifySignature(SECRET, TIMESTAMP, body, 'not-hex'), false);
  assert.equal(verifySignature('short', TIMESTAMP, body, signature), false);
});

test('timestamp freshness rejects stale and future values', () => {
  const now = Date.now();
  const current = String(Math.floor(now / 1000));
  assert.equal(isValidTimestamp(current, now), true);
  assert.equal(isValidTimestamp(String(Math.floor(now / 1000) - 301), now), false);
  assert.equal(isValidTimestamp(String(Math.floor(now / 1000) + 301), now), false);
  for (const value of ['', 'abc', '0', '-1', '1.5', '9999999999999']) {
    assert.equal(isValidTimestamp(value, now), false, value);
  }
});

test('lead payload validation accepts only the narrow contract', () => {
  const valid = parseLeadPayload(
    Buffer.from(JSON.stringify({
      external_id: 'evt-1',
      lead: { email: '  Lead@Example.INVALID ', name: 'Synthetic', intent: 'demo', consent_status: 'GRANTED' },
    })),
  );
  assert.equal(valid.externalId, 'evt-1');
  assert.equal(valid.consentStatus, 'GRANTED');
  assert.deepEqual(valid.minimalFields, {
    email: 'lead@example.invalid',
    name: 'Synthetic',
    intent: 'demo',
  });

  const cases = [
    ['{', 'invalid_json'],
    ['[]', 'invalid_payload'],
    [JSON.stringify({ lead: {} }), 'invalid_external_id'],
    [JSON.stringify({ external_id: 'x', unknown: true }), 'unknown_field'],
    [JSON.stringify({ external_id: 'x', lead: { unknown: true } }), 'unknown_lead_field'],
    [JSON.stringify({ external_id: 'x', lead: { email: 'bad' } }), 'invalid_email'],
    [JSON.stringify({ external_id: 'x', lead: { consent_status: 'MAYBE' } }), 'invalid_consent'],
    [JSON.stringify({ external_id: 'x', schema_version: 2 }), 'unsupported_schema_version'],
  ];
  for (const [body, code] of cases) {
    assert.throws(
      () => parseLeadPayload(Buffer.from(body)),
      (error) => error instanceof IngestionError && error.code === code,
      code,
    );
  }
});
