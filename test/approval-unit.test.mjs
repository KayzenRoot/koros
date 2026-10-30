import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVAL_ERROR,
  approvalHash,
  fieldsForPayload,
  stableStringify,
} from '../src/approval/index.mjs';

const PAYLOAD = {
  external_id: 'synthetic-approval-1',
  email: 'approval@example.invalid',
  name: 'Synthetic Approval',
};

test('stable JSON is independent of object key order', () => {
  assert.equal(
    stableStringify({ b: 2, a: 1 }),
    stableStringify({ a: 1, b: 2 }),
  );
  assert.equal(
    approvalHash({
      scope: 'crm.contact.upsert',
      operation: 'crm.contact.upsert',
      payload: { b: 2, a: 1 },
      fields: ['a', 'b'],
      payloadVersion: 1,
    }),
    approvalHash({
      scope: 'crm.contact.upsert',
      operation: 'crm.contact.upsert',
      payload: { a: 1, b: 2 },
      fields: ['a', 'b'],
      payloadVersion: 1,
    }),
  );
});

test('approval hash binds scope, payload, fields and version', () => {
  const base = {
    scope: 'crm.contact.upsert',
    operation: 'crm.contact.upsert',
    payload: PAYLOAD,
    fields: fieldsForPayload(PAYLOAD),
    payloadVersion: 1,
  };
  const hash = approvalHash(base);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, approvalHash({ ...base, payload: { ...PAYLOAD, name: 'v2' } }));
  assert.notEqual(hash, approvalHash({ ...base, scope: 'other.scope' }));
  assert.notEqual(hash, approvalHash({ ...base, payloadVersion: 2 }));
});

test('field derivation rejects empty and nested payloads', () => {
  assert.deepEqual(fieldsForPayload({ b: 2, a: 1 }), ['a', 'b']);
  assert.throws(() => fieldsForPayload({}), (error) => error.code === APPROVAL_ERROR.INVALID_POLICY);
  assert.throws(
    () => fieldsForPayload({ nested: { value: 1 } }),
    (error) => error.code === APPROVAL_ERROR.INVALID_POLICY,
  );
  assert.throws(
    () => fieldsForPayload({ 'bad\u0000field': 1 }),
    (error) => error.code === APPROVAL_ERROR.INVALID_POLICY,
  );
});
