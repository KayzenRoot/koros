/**
 * Contract shape only. It does NOT establish authentication or authorization.
 * The future auth layer must derive tenantId and subjectId from a verified
 * session, never from a request body, query or X-Tenant-Id header.
 * No tenant API routes are available in this Work Order.
 */
const OPAQUE_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const ROLES = new Set(['owner', 'admin', 'approver', 'operator', 'viewer']);

export function validateTenantEnvelopeShape(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value).sort();
  if (keys.length !== 3 || keys.join(',') !== 'role,subjectId,tenantId') {
    return false;
  }
  return typeof value.tenantId === 'string' && OPAQUE_ID.test(value.tenantId)
    && typeof value.subjectId === 'string' && OPAQUE_ID.test(value.subjectId)
    && ROLES.has(value.role);
}
