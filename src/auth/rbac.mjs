export const ROLES = Object.freeze(['owner', 'admin', 'approver', 'operator', 'viewer']);

const PERMISSIONS = Object.freeze({
  owner: Object.freeze([
    'session:read',
    'workflow:write',
    'approval:decide',
    'automation:run',
    'membership:manage',
    'session:revoke',
    'audit:read',
    'tenant:configure',
  ]),
  admin: Object.freeze([
    'session:read',
    'workflow:write',
    'approval:decide',
    'automation:run',
    'membership:manage',
    'session:revoke',
    'audit:read',
  ]),
  approver: Object.freeze(['session:read', 'approval:decide', 'audit:read']),
  operator: Object.freeze(['session:read', 'automation:run']),
  viewer: Object.freeze(['session:read']),
});

export function isRole(role) {
  return typeof role === 'string' && ROLES.includes(role);
}

export function hasPermission(role, permission) {
  if (!isRole(role) || typeof permission !== 'string') return false;
  return PERMISSIONS[role].includes(permission);
}

export function permissionsForRole(role) {
  if (!isRole(role)) return [];
  return [...PERMISSIONS[role]];
}
