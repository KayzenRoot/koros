import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FAILURE_CLASS,
  OUTBOX_LIMITS,
  backoffSeconds,
  classifyDispatchError,
  nextAttemptAt,
  operationKey,
} from '../src/outbox/policy.mjs';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

test('operation key binds tenant, source, external id and payload version', () => {
  const base = { tenantId: TENANT_A, source: 'synthetic-crm', externalId: 'lead-1', payloadVersion: 1 };
  assert.match(operationKey(base), /^[0-9a-f]{64}$/);
  assert.equal(operationKey(base), operationKey({ ...base }));
  assert.notEqual(operationKey(base), operationKey({ ...base, tenantId: TENANT_B }));
  assert.notEqual(operationKey(base), operationKey({ ...base, source: 'other-crm' }));
  assert.notEqual(operationKey(base), operationKey({ ...base, externalId: 'lead-2' }));
  assert.notEqual(operationKey(base), operationKey({ ...base, payloadVersion: 2 }));
});

test('backoff grows exponentially and is capped', () => {
  assert.equal(backoffSeconds(1), 5);
  assert.equal(backoffSeconds(2), 10);
  assert.equal(backoffSeconds(3), 20);
  assert.equal(backoffSeconds(100), OUTBOX_LIMITS.MAX_BACKOFF_SECONDS);
  assert.equal(backoffSeconds(0), OUTBOX_LIMITS.BASE_BACKOFF_SECONDS);
});

test('next attempt is calculated from the supplied clock', () => {
  const now = new Date('2026-10-30T12:00:00.000Z');
  assert.equal(nextAttemptAt(now, 1).toISOString(), '2026-10-30T12:00:05.000Z');
  assert.equal(nextAttemptAt(now, 2).toISOString(), '2026-10-30T12:00:10.000Z');
});

test('timeouts are uncertain and never treated as a simple retry', () => {
  const timeout = new Error('synthetic timeout');
  timeout.code = 'ETIMEDOUT';
  assert.equal(classifyDispatchError(timeout), FAILURE_CLASS.UNCERTAIN);

  const namedTimeout = new Error('synthetic timeout');
  namedTimeout.name = 'TimeoutError';
  assert.equal(classifyDispatchError(namedTimeout), FAILURE_CLASS.UNCERTAIN);
});

test('429, 5xx and transient errors are retryable', () => {
  const rateLimited = new Error('synthetic rate limit');
  rateLimited.status = 429;
  assert.equal(classifyDispatchError(rateLimited), FAILURE_CLASS.RETRY);

  const unavailable = new Error('synthetic unavailable');
  unavailable.status = 503;
  assert.equal(classifyDispatchError(unavailable), FAILURE_CLASS.RETRY);

  const transient = new Error('synthetic transient');
  transient.code = 'TRANSIENT';
  assert.equal(classifyDispatchError(transient), FAILURE_CLASS.RETRY);
});

test('quota exhaustion pauses instead of retrying', () => {
  const quota = new Error('synthetic quota');
  quota.code = 'QUOTA_EXCEEDED';
  assert.equal(classifyDispatchError(quota), FAILURE_CLASS.PAUSE);
});

test('validation and authorization failures are terminal', () => {
  const unauthorized = new Error('synthetic unauthorized');
  unauthorized.code = 'UNAUTHORIZED_FIELD';
  assert.equal(classifyDispatchError(unauthorized), FAILURE_CLASS.TERMINAL);

  const approval = new Error('synthetic approval');
  approval.code = 'APPROVAL_MISMATCH';
  assert.equal(classifyDispatchError(approval), FAILURE_CLASS.TERMINAL);
});
