import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTenantEnvelopeShape } from '../src/tenant-envelope.mjs';

test('synthetic tenant envelope has an explicit, narrow shape', () => {
  assert.equal(validateTenantEnvelopeShape({ tenantId: 'tenant-a', subjectId: 'operator-1', role: 'operator' }), true);
});

test('invalid tenant envelopes cannot pass structural validation', () => {
  for (const candidate of [
    null, 'tenant-a', [], {},
    { tenantId: 'tenant-a', subjectId: 'u1' },
    { tenantId: '../other', subjectId: 'u1', role: 'owner' },
    { tenantId: 'tenant-a', subjectId: 'u1', role: 'superuser' },
    { tenantId: 'tenant-a', subjectId: 'u1', role: 'admin', privileged: true },
    { tenantId: 'tenant-a', subjectId: 5, role: 'operator' },
  ]) {
    assert.equal(validateTenantEnvelopeShape(candidate), false);
  }
});
