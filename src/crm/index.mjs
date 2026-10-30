export {
  CAPABILITIES,
  CONTACT_FIELDS,
  CRM_ERROR,
  CrmError,
  assertAdapter,
  assertApproval,
  assertCanonicalContact,
  assertCapability,
  assertTenantId,
  canonicalContact,
  contactPayloadHash,
} from './contract.mjs';
export { AGENDOR_API_VERSION, AGENDOR_PROVIDER, createAgendorMock, fromAgendorPerson, toAgendorPerson } from './mock-agendor.mjs';
export { HUBSPOT_API_VERSION, HUBSPOT_PROVIDER, createHubspotMock, fromHubspotContact, toHubspotContact } from './mock-hubspot.mjs';
