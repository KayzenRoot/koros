import { withTenant } from '../db.mjs';
import { insertAuditEvent } from '../audit/events.mjs';
import { requirePermission } from '../control/authz.mjs';
import { TEMPLATE_ERROR, TemplateError } from './errors.mjs';
import {
  isBreakingTemplateChange,
  previewTemplateConfig,
  templateConfigHash,
  validateTemplateConfig,
} from './schema.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  return value;
}

function assertNow(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
}

function validateStoredConfig(row) {
  let config;
  try {
    config = validateTemplateConfig(row.config);
  } catch {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  if (templateConfigHash(config) !== row.config_hash) {
    throw new TemplateError(TEMPLATE_ERROR.INVALID_TEMPLATE);
  }
  return config;
}

export async function createTemplate({
  client,
  tenantId,
  actorUserId,
  config,
  now = new Date(),
}) {
  requireUuid(tenantId);
  const normalizedActor = requireUuid(actorUserId);
  assertNow(now);
  const normalized = validateTemplateConfig(config);
  await requirePermission(client, tenantId, normalizedActor, 'tenant:configure');
  const configHash = templateConfigHash(normalized);

  let template;
  try {
    const inserted = await client.query(
      `INSERT INTO workflow_templates (tenant_id, name, status, created_at, created_by)
       VALUES ($1, $2, 'ACTIVE', $3, $4)
       RETURNING *`,
      [tenantId, normalized.name, now, normalizedActor],
    );
    template = inserted.rows[0];
  } catch (error) {
    if (error?.code === '23505') throw new TemplateError(TEMPLATE_ERROR.CONFLICT);
    throw error;
  }

  const version = await client.query(
    `INSERT INTO workflow_template_versions
       (template_id, tenant_id, version, config, config_hash, created_at, created_by)
     VALUES ($1, $2, 1, $3::jsonb, $4, $5, $6)
     RETURNING *`,
    [template.template_id, tenantId, JSON.stringify(normalized), configHash, now, normalizedActor],
  );
  await insertAuditEvent(client, {
    tenantId,
    actorUserId: normalizedActor,
    action: 'TEMPLATE_CREATED',
    entity: 'template',
    entityId: template.template_id,
    metadata: { version: 1, configHash },
    createdAt: now,
  });
  return { template, version: version.rows[0] };
}

export async function createTemplateVersion({
  client,
  tenantId,
  templateId,
  actorUserId,
  config,
  now = new Date(),
}) {
  requireUuid(tenantId);
  const normalizedTemplateId = requireUuid(templateId);
  const normalizedActor = requireUuid(actorUserId);
  assertNow(now);
  const normalized = validateTemplateConfig(config);
  await requirePermission(client, tenantId, normalizedActor, 'tenant:configure');

  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
    normalizedTemplateId,
  ]);
  const template = await client.query(
    'SELECT * FROM workflow_templates WHERE tenant_id = $1 AND template_id = $2',
    [tenantId, normalizedTemplateId],
  );
  if (template.rowCount !== 1) throw new TemplateError(TEMPLATE_ERROR.NOT_FOUND);

  const latest = await client.query(
    `SELECT * FROM workflow_template_versions
      WHERE tenant_id = $1 AND template_id = $2
      ORDER BY version DESC LIMIT 1`,
    [tenantId, normalizedTemplateId],
  );
  if (latest.rowCount !== 1) throw new TemplateError(TEMPLATE_ERROR.NOT_FOUND);
  const previous = latest.rows[0];
  const previousConfig = validateStoredConfig(previous);
  const breaking = isBreakingTemplateChange(previousConfig, normalized);
  const nextVersion = previous.version + 1;
  const configHash = templateConfigHash(normalized);

  const inserted = await client.query(
    `INSERT INTO workflow_template_versions
       (template_id, tenant_id, version, config, config_hash, created_at, created_by)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
     RETURNING *`,
    [
      normalizedTemplateId,
      tenantId,
      nextVersion,
      JSON.stringify(normalized),
      configHash,
      now,
      normalizedActor,
    ],
  );

  let invalidated = 0;
  if (breaking) {
    const revoked = await client.query(
      `UPDATE approvals
          SET decision = 'REVOKED', revoked_at = $3, revoked_by = $4,
              decided_at = COALESCE(decided_at, $3), token_hash = NULL
        WHERE tenant_id = $1
          AND template_version_id IN (
            SELECT template_version_id FROM workflow_template_versions
             WHERE tenant_id = $1 AND template_id = $2 AND version < $5
          )
          AND decision IN ('PENDING', 'APPROVED')
        RETURNING approval_id`,
      [tenantId, normalizedTemplateId, now, normalizedActor, nextVersion],
    );
    invalidated = revoked.rowCount;
  }

  await insertAuditEvent(client, {
    tenantId,
    actorUserId: normalizedActor,
    action: 'TEMPLATE_VERSION_CREATED',
    entity: 'template',
    entityId: normalizedTemplateId,
    metadata: { version: nextVersion, configHash, breaking },
    createdAt: now,
  });
  if (invalidated > 0) {
    await insertAuditEvent(client, {
      tenantId,
      actorUserId: normalizedActor,
      action: 'APPROVALS_INVALIDATED',
      entity: 'template',
      entityId: normalizedTemplateId,
      metadata: { previousVersion: previous.version, count: invalidated },
      createdAt: now,
    });
  }

  return {
    version: inserted.rows[0],
    breaking,
    invalidatedApprovals: invalidated,
  };
}

export async function listTemplates({ tenantId }) {
  requireUuid(tenantId);
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT t.template_id, t.name, t.status, t.created_at,
              v.template_version_id, v.version, v.config, v.config_hash,
              v.created_at AS version_created_at
         FROM workflow_templates t
         JOIN workflow_template_versions v
           ON v.template_id = t.template_id AND v.tenant_id = t.tenant_id
        WHERE t.tenant_id = $1
        ORDER BY t.name, t.created_at, v.version`,
      [tenantId],
    );
    const templates = new Map();
    for (const row of result.rows) {
      const config = validateStoredConfig(row);
      if (!templates.has(row.template_id)) {
        templates.set(row.template_id, {
          template_id: row.template_id,
          name: row.name,
          status: row.status,
          current_version: row.version,
          versions: [],
        });
      }
      const template = templates.get(row.template_id);
      template.current_version = Math.max(template.current_version, row.version);
      template.versions.push({
        template_version_id: row.template_version_id,
        version: row.version,
        config,
        config_hash: row.config_hash,
        created_at: row.version_created_at,
      });
    }
    return [...templates.values()];
  });
}

export async function previewTemplate({ tenantId, templateId, lead }) {
  requireUuid(tenantId);
  const normalizedTemplateId = requireUuid(templateId);
  return withTenant(tenantId, async (client) => {
    const result = await client.query(
      `SELECT t.template_id, t.name, v.template_version_id, v.version, v.config, v.config_hash
         FROM workflow_templates t
         JOIN LATERAL (
           SELECT template_version_id, version, config, config_hash
             FROM workflow_template_versions
            WHERE tenant_id = t.tenant_id AND template_id = t.template_id
            ORDER BY version DESC LIMIT 1
         ) v ON true
        WHERE t.tenant_id = $1 AND t.template_id = $2`,
      [tenantId, normalizedTemplateId],
    );
    if (result.rowCount !== 1) throw new TemplateError(TEMPLATE_ERROR.NOT_FOUND);
    const row = result.rows[0];
    const config = validateStoredConfig(row);
    const preview = previewTemplateConfig(config, lead);
    return {
      template_id: row.template_id,
      template_version_id: row.template_version_id,
      version: row.version,
      config_hash: row.config_hash,
      preview,
    };
  });
}

export async function createTemplateInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => createTemplate({ client, tenantId, ...options }));
}

export async function createTemplateVersionInTenant({ tenantId, ...options }) {
  return withTenant(tenantId, (client) => createTemplateVersion({ client, tenantId, ...options }));
}
