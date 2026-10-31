import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { withTenant } from '../db.mjs';
import { insertAuditEvent } from '../audit/events.mjs';
import { hashPassword, normalizeEmail } from '../auth/password.mjs';
import { requirePermission } from '../control/authz.mjs';
import { createTemplate } from '../templates/service.mjs';
import { previewTemplateVersion } from '../templates/service.mjs';
import { ONBOARDING_ERROR, OnboardingError } from './errors.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const STEPS = Object.freeze(['TENANT', 'CONNECTOR', 'TEMPLATE', 'INVITE', 'CONSENT', 'POLICY', 'DRY_RUN']);
const NEXT_STEP = Object.freeze({
  TENANT: 'CONNECTOR',
  CONNECTOR: 'TEMPLATE',
  TEMPLATE: 'INVITE',
  INVITE: 'CONSENT',
  CONSENT: 'POLICY',
  POLICY: 'DRY_RUN',
  DRY_RUN: 'COMPLETED',
});
const INVITE_ROLES = new Set(['operator', 'approver', 'viewer']);

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  return value;
}

function requireString(value, maxLength) {
  if (typeof value !== 'string') throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  return trimmed;
}

function assertNow(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
}

function publicSession(row) {
  if (!row) return null;
  return {
    session_id: row.session_id,
    tenant_id: row.tenant_id,
    status: row.status,
    current_step: row.current_step,
    profile: row.profile,
    connector: row.connector,
    template_version_id: row.template_version_id,
    invite_id: row.invite_id,
    consent: row.consent,
    policy: row.policy,
    dry_run: row.dry_run,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
  };
}

export async function startOnboarding({ client, tenantId, actorUserId, now = new Date() }) {
  requireUuid(tenantId);
  const actor = requireUuid(actorUserId);
  assertNow(now);
  await requirePermission(client, tenantId, actor, 'tenant:configure');

  const active = await client.query(
    "SELECT * FROM onboarding_sessions WHERE tenant_id = $1 AND status = 'IN_PROGRESS'",
    [tenantId],
  );
  if (active.rowCount === 1) return { created: false, session: publicSession(active.rows[0]) };

  const inserted = await client.query(
    `INSERT INTO onboarding_sessions (tenant_id, status, current_step, created_by, correlation_id, created_at, updated_at)
     VALUES ($1, 'IN_PROGRESS', 'TENANT', $2, $3, $4, $4)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [tenantId, actor, randomUUID(), now],
  );
  if (inserted.rowCount === 0) {
    const raced = await client.query(
      "SELECT * FROM onboarding_sessions WHERE tenant_id = $1 AND status = 'IN_PROGRESS'",
      [tenantId],
    );
    if (raced.rowCount !== 1) throw new OnboardingError(ONBOARDING_ERROR.CONFLICT);
    return { created: false, session: publicSession(raced.rows[0]) };
  }
  await insertAuditEvent(client, {
    tenantId,
    actorUserId: actor,
    action: 'ONBOARDING_STARTED',
    entity: 'onboarding',
    entityId: inserted.rows[0].session_id,
    metadata: { step: 'TENANT' },
    correlationId: inserted.rows[0].correlation_id,
    createdAt: now,
  });
  return { created: true, session: publicSession(inserted.rows[0]) };
}

export async function getOnboarding({ tenantId }) {
  requireUuid(tenantId);
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT * FROM onboarding_sessions
        WHERE tenant_id = $1
        ORDER BY created_at DESC, session_id DESC
        LIMIT 1`,
      [tenantId],
    );
    return { session: publicSession(result.rows[0]) };
  });
}

async function tenantStep(client, session, data, now) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  const name = requireString(data.name, 100);
  await client.query(
    'UPDATE organizations SET name = $2 WHERE tenant_id = $1',
    [session.tenant_id, name],
  );
  return { profile: { name, locale: 'pt-BR' }, next: NEXT_STEP.TENANT };
}

function connectorStep(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  const provider = requireString(data.provider, 100);
  if (provider !== 'synthetic-webhook') throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  const account = requireString(data.account, 100);
  if (!Array.isArray(data.scopes) || !data.scopes.includes('leads:read')) {
    throw new OnboardingError(ONBOARDING_ERROR.MISSING_SCOPE);
  }
  const scopes = [...new Set(data.scopes)].filter((scope) => scope === 'leads:read');
  return { connector: { provider, account, scopes }, next: NEXT_STEP.CONNECTOR };
}

async function templateStep(client, session, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  const templateVersionId = requireUuid(data.template_version_id);
  const result = await client.query(
    `SELECT 1 FROM workflow_template_versions
      WHERE tenant_id = $1 AND template_version_id = $2`,
    [session.tenant_id, templateVersionId],
  );
  if (result.rowCount !== 1) throw new OnboardingError(ONBOARDING_ERROR.TEMPLATE_NOT_FOUND);
  return { template_version_id: templateVersionId, next: NEXT_STEP.TEMPLATE };
}

async function inviteStep(client, session, data, actor, now) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  const email = normalizeEmail(data.email);
  if (!email) throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  const role = typeof data.role === 'string' ? data.role : '';
  if (!INVITE_ROLES.has(role)) throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const invite = await client.query(
    `INSERT INTO onboarding_invites
       (tenant_id, session_id, email_normalized, role, token_hash, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING invite_id`,
    [session.tenant_id, session.session_id, email, role, tokenHash, expiresAt, actor],
  );
  return {
    invite_id: invite.rows[0].invite_id,
    invite_token: token,
    next: NEXT_STEP.INVITE,
  };
}

function consentStep(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  if (data.future_use !== 'GRANTED' && data.future_use !== 'DENIED') {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  return { consent: data.future_use, next: NEXT_STEP.CONSENT };
}

function policyStep(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  if (data.accepted !== true || data.version !== 'local-v1') {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  return { policy: { accepted: true, version: 'local-v1' }, next: NEXT_STEP.POLICY };
}

async function dryRunStep(client, session, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  }
  if (!session.template_version_id || !session.connector || !session.consent || !session.policy) {
    throw new OnboardingError(ONBOARDING_ERROR.INVALID_STATE);
  }
  try {
    const preview = await previewTemplateVersion({
      tenantId: session.tenant_id,
      templateVersionId: session.template_version_id,
      lead: data.lead,
    });
    return { dry_run: preview, next: 'COMPLETED' };
  } catch (error) {
    throw new OnboardingError(ONBOARDING_ERROR.DRY_RUN_FAILED, error.code);
  }
}

export async function advanceOnboarding({
  client,
  tenantId,
  sessionId,
  actorUserId,
  step,
  data,
  now = new Date(),
}) {
  requireUuid(tenantId);
  const normalizedSessionId = requireUuid(sessionId);
  const actor = requireUuid(actorUserId);
  assertNow(now);
  if (!STEPS.includes(step)) throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  await requirePermission(client, tenantId, actor, 'tenant:configure');

  const selected = await client.query(
    'SELECT * FROM onboarding_sessions WHERE tenant_id = $1 AND session_id = $2 FOR UPDATE',
    [tenantId, normalizedSessionId],
  );
  if (selected.rowCount !== 1) throw new OnboardingError(ONBOARDING_ERROR.NOT_FOUND);
  const session = selected.rows[0];
  if (session.status !== 'IN_PROGRESS') throw new OnboardingError(ONBOARDING_ERROR.INVALID_STATE);
  if (session.current_step !== step) throw new OnboardingError(ONBOARDING_ERROR.STEP_MISMATCH);

  let update;
  if (step === 'TENANT') update = await tenantStep(client, session, data, now);
  else if (step === 'CONNECTOR') update = connectorStep(data);
  else if (step === 'TEMPLATE') update = await templateStep(client, session, data);
  else if (step === 'INVITE') update = await inviteStep(client, session, data, actor, now);
  else if (step === 'CONSENT') update = consentStep(data);
  else if (step === 'POLICY') update = policyStep(data);
  else update = await dryRunStep(client, session, data);

  const completed = update.next === 'COMPLETED';
  const updated = await client.query(
    `UPDATE onboarding_sessions
        SET current_step = $3,
            status = $4,
            profile = COALESCE($5::jsonb, profile),
            connector = COALESCE($6::jsonb, connector),
            template_version_id = COALESCE($7, template_version_id),
            invite_id = COALESCE($8, invite_id),
            consent = COALESCE($9, consent),
            policy = COALESCE($10::jsonb, policy),
            dry_run = COALESCE($11::jsonb, dry_run),
            updated_at = $12,
            completed_at = CASE WHEN $4 = 'COMPLETED' THEN $12 ELSE completed_at END
      WHERE tenant_id = $1 AND session_id = $2
      RETURNING *`,
    [
      tenantId,
      normalizedSessionId,
      update.next,
      completed ? 'COMPLETED' : 'IN_PROGRESS',
      update.profile ? JSON.stringify(update.profile) : null,
      update.connector ? JSON.stringify(update.connector) : null,
      update.template_version_id ?? null,
      update.invite_id ?? null,
      update.consent ?? null,
      update.policy ? JSON.stringify(update.policy) : null,
      update.dry_run ? JSON.stringify(update.dry_run) : null,
      now,
    ],
  );
  await insertAuditEvent(client, {
    tenantId,
    actorUserId: actor,
    action: completed ? 'ONBOARDING_COMPLETED' : 'ONBOARDING_STEP',
    entity: 'onboarding',
    entityId: normalizedSessionId,
    metadata: { step, next: update.next },
    correlationId: session.correlation_id,
    createdAt: now,
  });
  return {
    session: publicSession(updated.rows[0]),
    invite_token: update.invite_token ?? null,
  };
}

export async function startOnboardingInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => startOnboarding({ client, tenantId, ...options }));
}

export async function advanceOnboardingInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => advanceOnboarding({ client, tenantId, ...options }));
}

/**
 * Local/ops-only tenant provisioning. It is not exposed over HTTP; the caller
 * must opt in explicitly. The real API plan remains UNKNOWN.
 */
export async function provisionSyntheticTenant({ name, ownerEmail, ownerPassword }) {
  if (process.env.KOROS_ALLOW_TENANT_PROVISIONING !== '1') {
    throw new OnboardingError(ONBOARDING_ERROR.PROVISIONING_DISABLED);
  }
  const normalizedName = requireString(name, 100);
  const email = normalizeEmail(ownerEmail);
  if (!email) throw new OnboardingError(ONBOARDING_ERROR.INVALID_INPUT);
  const tenantId = randomUUID();
  const userId = randomUUID();
  const membershipId = randomUUID();
  const passwordHash = await hashPassword(ownerPassword);
  const now = new Date();

  return withTenant(tenantId, async (client) => {
    await client.query(
      `INSERT INTO organizations (tenant_id, name, status)
       VALUES ($1, $2, 'ACTIVE')`,
      [tenantId, normalizedName],
    );
    await client.query(
      `INSERT INTO users (user_id, email, email_normalized, password_hash, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')`,
      [userId, email, email, passwordHash],
    );
    await client.query(
      `INSERT INTO memberships (membership_id, tenant_id, user_id, role, status)
       VALUES ($1, $2, $3, 'owner', 'ACTIVE')`,
      [membershipId, tenantId, userId],
    );
    await client.query(
      `INSERT INTO tenant_controls (tenant_id, kill_switch_active, updated_by)
       VALUES ($1, false, $2)`,
      [tenantId, userId],
    );
    await insertAuditEvent(client, {
      tenantId,
      actorUserId: userId,
      action: 'TENANT_PROVISIONED',
      entity: 'tenant',
      entityId: tenantId,
      metadata: { source: 'local-synthetic' },
      createdAt: now,
    });
    const template = await createTemplate({
      client,
      tenantId,
      actorUserId: userId,
      config: {
        schema_version: 1,
        name: 'Lead para CRM (onboarding)',
        source: { provider: 'synthetic-webhook', account: 'onboarding-default' },
        required_fields: ['external_id', 'email'],
        field_map: { external_id: 'external_id', email: 'email', name: 'name' },
        crm: { operation: 'crm.contact.upsert', target: 'crm:agendor' },
        approval: { required: true, scope: 'crm.contact.upsert', ttl_seconds: 900 },
        limits: { max_tokens: 1000, max_cost: 10 },
      },
      now,
    });
    return {
      tenantId,
      userId,
      email,
      templateId: template.template.template_id,
      templateVersionId: template.version.template_version_id,
    };
  });
}
