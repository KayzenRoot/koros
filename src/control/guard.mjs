import { withTenant } from '../db.mjs';
import { insertAuditEvent } from '../audit/events.mjs';
import { CONTROL_ERROR, ControlError } from './errors.mjs';
import { requirePermission } from './authz.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
  return value;
}

function requireReason(reason) {
  if (typeof reason !== 'string') throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  const trimmed = reason.trim();
  if (!trimmed || trimmed.length > 500 || CONTROL_CHARS.test(trimmed)) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
  return trimmed;
}

/** Fail closed: missing control state is not permission to operate. */
export async function assertOperationsAllowedWithClient(client, tenantId) {
  requireUuid(tenantId);
  const result = await client.query(
    'SELECT kill_switch_active FROM tenant_controls WHERE tenant_id = $1',
    [tenantId],
  );
  if (result.rowCount !== 1) throw new ControlError(CONTROL_ERROR.CONTROL_NOT_CONFIGURED);
  if (result.rows[0].kill_switch_active) throw new ControlError(CONTROL_ERROR.KILL_SWITCH_ACTIVE);
}

export async function assertOperationsAllowed({ tenantId }) {
  requireUuid(tenantId);
  return withTenant(tenantId, (client) => assertOperationsAllowedWithClient(client, tenantId));
}

export async function setKillSwitch({
  client,
  tenantId,
  active,
  reason = null,
  actorUserId,
  now = new Date(),
}) {
  if (typeof active !== 'boolean') throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  requireUuid(tenantId);
  const normalizedActor = requireUuid(actorUserId);
  const normalizedReason = active ? requireReason(reason) : null;
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new ControlError(CONTROL_ERROR.INVALID_INPUT);
  }
  await requirePermission(client, tenantId, normalizedActor, 'tenant:configure');

  const result = await client.query(
    `INSERT INTO tenant_controls
       (tenant_id, kill_switch_active, kill_switch_reason, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenant_id) DO UPDATE
       SET kill_switch_active = EXCLUDED.kill_switch_active,
           kill_switch_reason = EXCLUDED.kill_switch_reason,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by
     RETURNING *`,
    [tenantId, active, normalizedReason, now, normalizedActor],
  );
  const control = result.rows[0];
  await insertAuditEvent(client, {
    tenantId,
    actorUserId: normalizedActor,
    action: active ? 'KILL_SWITCH_ARMED' : 'KILL_SWITCH_DISARMED',
    entity: 'tenant_control',
    entityId: tenantId,
    metadata: { active },
    createdAt: now,
  });
  return control;
}

export async function setKillSwitchInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => setKillSwitch({ client, tenantId, ...options }));
}

export async function getControlState({ tenantId }) {
  requireUuid(tenantId);
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      'SELECT tenant_id, kill_switch_active, kill_switch_reason, updated_at FROM tenant_controls WHERE tenant_id = $1',
      [tenantId],
    );
    if (result.rowCount !== 1) throw new ControlError(CONTROL_ERROR.CONTROL_NOT_CONFIGURED);
    return result.rows[0];
  });
}
