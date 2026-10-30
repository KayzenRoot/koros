import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPABILITIES,
  CRM_ERROR,
  CrmError,
  canonicalContact,
  contactPayloadHash,
} from '../src/crm/contract.mjs';
import {
  createAgendorMock,
  fromAgendorPerson,
  toAgendorPerson,
} from '../src/crm/mock-agendor.mjs';
import {
  createHubspotMock,
  fromHubspotContact,
  toHubspotContact,
} from '../src/crm/mock-hubspot.mjs';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const PROVIDERS = [
  { name: 'agendor', create: createAgendorMock },
  { name: 'hubspot', create: createHubspotMock },
];

function contactInput(overrides = {}) {
  return {
    external_id: 'synthetic-contact-1',
    email: 'Lead@Example.INVALID',
    name: 'Synthetic Lead',
    ...overrides,
  };
}

function approvalFor(contact, ttlMs = 60_000) {
  const canonical = canonicalContact(contact);
  return {
    approved: true,
    payloadHash: contactPayloadHash(canonical),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };
}

function errorCode(callback) {
  try {
    callback();
  } catch (error) {
    assert.ok(error instanceof CrmError, 'expected a CrmError');
    return error.code;
  }
  assert.fail('expected a CrmError');
}

for (const { name, create } of PROVIDERS) {
  test(`${name}: mock reports only synthetic capabilities`, () => {
    const adapter = create();
    assert.equal(adapter.provider, name);
    assert.equal(adapter.mode, 'mock');
    assert.deepEqual(adapter.capabilities, [
      CAPABILITIES.CONTACT_READ,
      CAPABILITIES.CONTACT_UPSERT,
    ]);
    const connection = adapter.verifyConnection({ tenantId: TENANT_A });
    assert.equal(connection.ok, true);
    assert.equal(connection.mode, 'mock');
    assert.equal(connection.provider, name);
    assert.ok(connection.apiVersion.includes('mock'));
  });

  test(`${name}: creates, reads and idempotently re-upserts a normalized contact`, () => {
    const adapter = create();
    const input = contactInput();
    const approval = approvalFor(input);

    const created = adapter.upsertPerson({ tenantId: TENANT_A, contact: input, approval });
    assert.equal(created.created, true);
    assert.equal(created.updated, false);
    assert.equal(created.version, 1);
    assert.equal(created.contact.email, 'lead@example.invalid');
    assert.ok(created.contactId);

    const read = adapter.getPerson({ tenantId: TENANT_A, externalId: input.external_id });
    assert.deepEqual(read.contact, canonicalContact(input));
    assert.equal(read.contactId, created.contactId);
    assert.equal(read.version, 1);

    const repeated = adapter.upsertPerson({ tenantId: TENANT_A, contact: input, approval });
    assert.equal(repeated.created, false);
    assert.equal(repeated.updated, false);
    assert.equal(repeated.version, 1);
    assert.equal(repeated.contactId, created.contactId);
  });

  test(`${name}: updates only with a new approval bound to the new payload`, () => {
    const adapter = create();
    const original = contactInput();
    const created = adapter.upsertPerson({
      tenantId: TENANT_A,
      contact: original,
      approval: approvalFor(original),
    });

    const changed = contactInput({ name: 'Updated Synthetic Lead' });
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({
          tenantId: TENANT_A,
          contact: changed,
          approval: approvalFor(original),
        }),
      ),
      CRM_ERROR.APPROVAL_MISMATCH,
    );
    assert.equal(
      adapter.getPerson({ tenantId: TENANT_A, externalId: original.external_id }).version,
      1,
    );

    const updated = adapter.upsertPerson({
      tenantId: TENANT_A,
      contact: changed,
      approval: approvalFor(changed),
    });
    assert.equal(updated.created, false);
    assert.equal(updated.updated, true);
    assert.equal(updated.version, 2);
    assert.equal(updated.contactId, created.contactId);
    assert.equal(updated.contact.name, 'Updated Synthetic Lead');
  });

  test(`${name}: rejects unauthorized fields, missing objects and invalid tenants`, () => {
    const adapter = create();
    const input = contactInput();

    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({
          tenantId: TENANT_A,
          contact: { ...input, ssn: 'synthetic-value' },
          approval: approvalFor(input),
        }),
      ),
      CRM_ERROR.UNAUTHORIZED_FIELD,
    );
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({
          tenantId: TENANT_A,
          contact: { email: input.email },
          approval: approvalFor(input),
        }),
      ),
      CRM_ERROR.INVALID_INPUT,
    );
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({ tenantId: 'tenant-a', contact: input, approval: approvalFor(input) }),
      ),
      CRM_ERROR.INVALID_TENANT,
    );
  });

  test(`${name}: denies a write without a valid approval`, () => {
    const adapter = create();
    const input = contactInput();

    assert.equal(
      errorCode(() => adapter.upsertPerson({ tenantId: TENANT_A, contact: input })),
      CRM_ERROR.APPROVAL_REQUIRED,
    );
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({
          tenantId: TENANT_A,
          contact: input,
          approval: { approved: true, payloadHash: '0'.repeat(64), expiresAt: new Date(Date.now() + 60_000).toISOString() },
        }),
      ),
      CRM_ERROR.APPROVAL_MISMATCH,
    );
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({
          tenantId: TENANT_A,
          contact: input,
          approval: approvalFor(input, -60_000),
        }),
      ),
      CRM_ERROR.APPROVAL_EXPIRED,
    );
  });

  test(`${name}: denies upsert when the tenant entitlement is read-only`, () => {
    const adapter = create({ readOnly: true });
    const input = contactInput();
    assert.deepEqual(adapter.capabilities, [CAPABILITIES.CONTACT_READ]);
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({ tenantId: TENANT_A, contact: input, approval: approvalFor(input) }),
      ),
      CRM_ERROR.ENTITLEMENT_DENIED,
    );
    assert.equal(
      errorCode(() => adapter.getPerson({ tenantId: TENANT_A, externalId: input.external_id })),
      CRM_ERROR.NOT_FOUND,
    );
    assert.equal(
      errorCode(() => adapter.getPerson({ tenantId: TENANT_A })),
      CRM_ERROR.INVALID_INPUT,
    );
    assert.deepEqual(adapter.verifyConnection({ tenantId: TENANT_A }).capabilities, [
      CAPABILITIES.CONTACT_READ,
    ]);
  });

  test(`${name}: isolates tenants and rejects a duplicate email within a tenant`, () => {
    const adapter = create();
    const first = contactInput();
    adapter.upsertPerson({ tenantId: TENANT_A, contact: first, approval: approvalFor(first) });

    assert.equal(
      errorCode(() => adapter.getPerson({ tenantId: TENANT_B, externalId: first.external_id })),
      CRM_ERROR.NOT_FOUND,
    );

    const tenantBContact = contactInput({ email: 'tenant-b@example.invalid' });
    const tenantB = adapter.upsertPerson({
      tenantId: TENANT_B,
      contact: tenantBContact,
      approval: approvalFor(tenantBContact),
    });
    assert.equal(tenantB.created, true);
    assert.notEqual(tenantB.contactId, adapter.getPerson({ tenantId: TENANT_A, externalId: first.external_id }).contactId);

    const duplicateEmail = contactInput({ external_id: 'synthetic-contact-2' });
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({
          tenantId: TENANT_A,
          contact: duplicateEmail,
          approval: approvalFor(duplicateEmail),
        }),
      ),
      CRM_ERROR.CONFLICT,
    );
  });

  test(`${name}: rejects a conflicting email on update without mutating the record`, () => {
    const adapter = create();
    const first = contactInput();
    const second = contactInput({ external_id: 'synthetic-contact-2', email: 'second@example.invalid' });
    adapter.upsertPerson({ tenantId: TENANT_A, contact: first, approval: approvalFor(first) });
    const secondCreated = adapter.upsertPerson({
      tenantId: TENANT_A,
      contact: second,
      approval: approvalFor(second),
    });

    const collision = contactInput({ external_id: second.external_id, email: first.email });
    assert.equal(
      errorCode(() =>
        adapter.upsertPerson({ tenantId: TENANT_A, contact: collision, approval: approvalFor(collision) }),
      ),
      CRM_ERROR.CONFLICT,
    );
    const unchanged = adapter.getPerson({ tenantId: TENANT_A, externalId: second.external_id });
    assert.equal(unchanged.version, secondCreated.version);
    assert.equal(unchanged.contact.email, 'second@example.invalid');
  });

  test(`${name}: mock performs no network I/O`, () => {
    const adapter = create();
    const input = contactInput();
    const originalFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = () => {
      fetchCalls += 1;
      throw new Error('network is disabled in the mock contract test');
    };
    try {
      adapter.upsertPerson({ tenantId: TENANT_A, contact: input, approval: approvalFor(input) });
      adapter.getPerson({ tenantId: TENANT_A, externalId: input.external_id });
    } finally {
      globalThis.fetch = originalFetch;
    }
    assert.equal(fetchCalls, 0);
  });
}

test('Agendor mapping is lossless for allowlisted fields', () => {
  const canonical = canonicalContact({
    external_id: 'agendor-synthetic-1',
    email: 'Agendor@Example.INVALID',
    name: 'Synthetic  Lead',
    company_external_id: 'synthetic-company-1',
  });
  const native = toAgendorPerson(canonical);
  assert.equal(native.id, canonical.externalId);
  assert.equal(native.externalId, canonical.externalId);
  assert.equal(native.email, 'agendor@example.invalid');
  assert.deepEqual(fromAgendorPerson(native), canonical);
});

test('HubSpot mapping preserves standard fields and Koros custom properties', () => {
  const canonical = canonicalContact({
    external_id: 'hubspot-synthetic-1',
    email: 'Hubspot@Example.INVALID',
    name: 'Synthetic  Lead',
    company_external_id: 'synthetic-company-1',
  });
  const native = toHubspotContact(canonical);
  assert.equal(native.id, canonical.externalId);
  assert.equal(native.properties.koros_external_id, canonical.externalId);
  assert.equal(native.properties.email, 'hubspot@example.invalid');
  assert.equal(native.properties.koros_name, canonical.name);
  assert.equal(native.properties.firstname, 'Synthetic');
  assert.equal(native.properties.lastname, 'Lead');
  assert.deepEqual(fromHubspotContact(native), canonical);
});

test('payload hash binds the normalized contact and changes with the payload', () => {
  const first = canonicalContact(contactInput());
  const second = canonicalContact(contactInput({ name: 'Another Lead' }));
  assert.equal(contactPayloadHash(first), contactPayloadHash(canonicalContact(contactInput())));
  assert.equal(
    contactPayloadHash(first),
    contactPayloadHash(canonicalContact(contactInput({ email: 'LEAD@Example.INVALID' }))),
  );
  assert.notEqual(contactPayloadHash(first), contactPayloadHash(second));
});
