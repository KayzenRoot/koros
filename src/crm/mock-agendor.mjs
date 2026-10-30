import { CRM_ERROR, CrmError, assertCanonicalContact, canonicalContact } from './contract.mjs';
import { createMockCrmAdapter } from './mock-core.mjs';

export const AGENDOR_PROVIDER = 'agendor';
export const AGENDOR_API_VERSION = 'v3-mock';

/**
 * Synthetic shape based on the Agendor person resource. Only allowlisted fields
 * leave the canonical contract; the provider mock never calls the real API.
 */
export function toAgendorPerson(contact) {
  const canonical = assertCanonicalContact(contact);
  const person = {
    id: canonical.externalId,
    externalId: canonical.externalId,
  };
  if (canonical.name !== undefined) person.name = canonical.name;
  if (canonical.email !== undefined) person.email = canonical.email;
  if (canonical.companyExternalId !== undefined) person.companyExternalId = canonical.companyExternalId;
  return person;
}

export function fromAgendorPerson(person) {
  if (!person || typeof person !== 'object' || Array.isArray(person)) {
    throw new CrmError(CRM_ERROR.INVALID_INPUT);
  }
  return canonicalContact({
    external_id: person.externalId ?? person.id,
    email: person.email,
    name: person.name,
    company_external_id: person.companyExternalId,
  });
}

export function createAgendorMock({ readOnly = false } = {}) {
  return createMockCrmAdapter({
    provider: AGENDOR_PROVIDER,
    idPrefix: 'ag',
    apiVersion: AGENDOR_API_VERSION,
    readOnly,
  });
}
