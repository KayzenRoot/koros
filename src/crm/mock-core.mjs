import {
  CAPABILITIES,
  CRM_ERROR,
  CrmError,
  assertAdapter,
  assertApproval,
  assertCapability,
  assertTenantId,
  canonicalContact,
} from './contract.mjs';

const MAX_RECORDS = 1000;

function copyContact(contact) {
  return { ...contact };
}

/**
 * In-memory implementation of the CRM adapter contract. It never performs I/O,
 * so every provider built on it is a synthetic mock until a reviewed adapter exists.
 */
export function createMockCrmAdapter({ provider, idPrefix, apiVersion, readOnly = false }) {
  if (typeof provider !== 'string' || !provider) throw new CrmError(CRM_ERROR.INVALID_ADAPTER);
  if (typeof idPrefix !== 'string' || !idPrefix) throw new CrmError(CRM_ERROR.INVALID_ADAPTER);

  const capabilities = Object.freeze(
    readOnly
      ? [CAPABILITIES.CONTACT_READ]
      : [CAPABILITIES.CONTACT_READ, CAPABILITIES.CONTACT_UPSERT],
  );
  const records = new Map();
  const emailIndex = new Map();
  let sequence = 0;

  function recordKey(tenantId, externalId) {
    return `${tenantId}|${externalId}`;
  }

  function emailKey(tenantId, email) {
    return `${tenantId}|${email}`;
  }

  function result(record, created, updated) {
    return {
      provider,
      created,
      updated,
      contactId: record.id,
      version: record.version,
      contact: copyContact(record.contact),
    };
  }

  const adapter = {
    provider,
    mode: 'mock',
    apiVersion: apiVersion ?? 'mock-v1',
    capabilities,

    verifyConnection({ tenantId } = {}) {
      assertTenantId(tenantId);
      return {
        ok: true,
        provider,
        mode: 'mock',
        apiVersion: adapter.apiVersion,
        capabilities: [...capabilities],
      };
    },

    upsertPerson({ tenantId, contact, approval } = {}) {
      assertTenantId(tenantId);
      assertCapability(adapter, CAPABILITIES.CONTACT_UPSERT);
      const canonical = canonicalContact(contact);
      assertApproval(approval, canonical);

      const key = recordKey(tenantId, canonical.externalId);
      const existing = records.get(key);
      if (!existing) {
        if (records.size >= MAX_RECORDS) throw new CrmError(CRM_ERROR.CAPACITY_EXCEEDED);
        if (canonical.email) {
          const owner = emailIndex.get(emailKey(tenantId, canonical.email));
          if (owner) throw new CrmError(CRM_ERROR.CONFLICT);
        }
        const record = {
          id: `${idPrefix}-${++sequence}`,
          contact: canonical,
          payloadHash: approval.payloadHash,
          version: 1,
        };
        records.set(key, record);
        if (canonical.email) emailIndex.set(emailKey(tenantId, canonical.email), canonical.externalId);
        return result(record, true, false);
      }

      if (existing.payloadHash === approval.payloadHash) {
        return result(existing, false, false);
      }

      if (canonical.email) {
        const owner = emailIndex.get(emailKey(tenantId, canonical.email));
        if (owner && owner !== canonical.externalId) throw new CrmError(CRM_ERROR.CONFLICT);
      }
      if (existing.contact.email && existing.contact.email !== canonical.email) {
        emailIndex.delete(emailKey(tenantId, existing.contact.email));
      }

      existing.contact = canonical;
      existing.payloadHash = approval.payloadHash;
      existing.version += 1;
      if (canonical.email) emailIndex.set(emailKey(tenantId, canonical.email), canonical.externalId);
      return result(existing, false, true);
    },

    getPerson({ tenantId, externalId } = {}) {
      assertTenantId(tenantId);
      assertCapability(adapter, CAPABILITIES.CONTACT_READ);
      const normalizedId = canonicalContact({ external_id: externalId }).externalId;
      const record = records.get(recordKey(tenantId, normalizedId));
      if (!record) throw new CrmError(CRM_ERROR.NOT_FOUND);
      return {
        provider,
        contactId: record.id,
        version: record.version,
        contact: copyContact(record.contact),
      };
    },

    reset() {
      records.clear();
      emailIndex.clear();
      sequence = 0;
    },
  };

  return assertAdapter(adapter);
}
