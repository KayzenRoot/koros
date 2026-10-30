import { CRM_ERROR, CrmError, assertCanonicalContact, canonicalContact } from './contract.mjs';
import { createMockCrmAdapter } from './mock-core.mjs';

export const HUBSPOT_PROVIDER = 'hubspot';
export const HUBSPOT_API_VERSION = 'dbv-mock';

function splitName(name) {
  const normalized = name.replace(/\s+/g, ' ').trim();
  if (!normalized) return { firstname: '', lastname: '' };
  const separator = normalized.indexOf(' ');
  if (separator === -1) return { firstname: normalized, lastname: '' };
  return {
    firstname: normalized.slice(0, separator),
    lastname: normalized.slice(separator + 1),
  };
}

function joinName(firstname, lastname) {
  return [firstname, lastname]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => part.trim())
    .join(' ');
}

/**
 * Synthetic HubSpot CRM v3 object mapping. `koros_name` and
 * `koros_external_id` are custom properties that make the mapping lossless;
 * the standard firstname/lastname pair is also populated for portability.
 */
export function toHubspotContact(contact) {
  const canonical = assertCanonicalContact(contact);
  const properties = {
    koros_external_id: canonical.externalId,
  };
  if (canonical.name !== undefined) {
    const { firstname, lastname } = splitName(canonical.name);
    properties.koros_name = canonical.name;
    properties.firstname = firstname;
    properties.lastname = lastname;
  }
  if (canonical.email !== undefined) properties.email = canonical.email;
  if (canonical.companyExternalId !== undefined) {
    properties.koros_company_external_id = canonical.companyExternalId;
  }
  return { id: canonical.externalId, properties };
}

export function fromHubspotContact(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new CrmError(CRM_ERROR.INVALID_INPUT);
  }
  const properties = record.properties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    throw new CrmError(CRM_ERROR.INVALID_INPUT);
  }
  const name =
    typeof properties.koros_name === 'string' && properties.koros_name.trim()
      ? properties.koros_name
      : joinName(properties.firstname, properties.lastname);
  return canonicalContact({
    external_id: properties.koros_external_id ?? record.id,
    email: properties.email,
    name: name || undefined,
    company_external_id: properties.koros_company_external_id,
  });
}

export function createHubspotMock({ readOnly = false } = {}) {
  return createMockCrmAdapter({
    provider: HUBSPOT_PROVIDER,
    idPrefix: 'hs',
    apiVersion: HUBSPOT_API_VERSION,
    readOnly,
  });
}
