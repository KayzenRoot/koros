import { hasPermission } from '../auth/rbac.mjs';
import { CONTROL_ERROR, ControlError } from './errors.mjs';

export async function requirePermission(client, tenantId, userId, permission) {
  const result = await client.query(
    `SELECT role FROM memberships
      WHERE tenant_id = $1 AND user_id = $2 AND status = 'ACTIVE'`,
    [tenantId, userId],
  );
  if (result.rowCount !== 1 || !hasPermission(result.rows[0].role, permission)) {
    throw new ControlError(CONTROL_ERROR.FORBIDDEN);
  }
}
