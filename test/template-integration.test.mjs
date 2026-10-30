import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { closePool, withTenant } from '../src/db.mjs';
import {
  TEMPLATE_ERROR,
  createTemplateInTenant,
  createTemplateVersionInTenant,
  listTemplates,
  previewTemplate,
} from '../src/templates/index.mjs';
import {
  decideApprovalInTenant,
  requestApprovalInTenant,
  verifyApprovalInTenant,
} from '../src/approval/index.mjs';
import { createRunInTenant, transitionRunInTenant } from '../src/workflow/index.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const LEAD_A = 'a0000000-0000-4000-8000-000000000004';
const WORKFLOW_VERSION_A = 'a0000000-0000-4000-8000-000000000002';
const RUN_ID = `${Date.now().toString(36)}-${process.pid}`;

function config(overrides = {}) {
  const { nameSuffix = 'base', ...rest } = overrides;
  return {
    schema_version: 1,
    name: `Template ${RUN_ID} ${nameSuffix}`,
    source: { provider: 'synthetic-webhook', account: 'source-a' },
    required_fields: ['external_id', 'email'],
    field_map: { external_id: 'external_id', email: 'email', name: 'name' },
    crm: { operation: 'crm.contact.upsert', target: 'crm:agendor' },
    approval: { required: true, scope: 'crm.contact.upsert', ttl_seconds: 900 },
    limits: { max_tokens: 1000, max_cost: 10 },
    ...rest,
  };
}

after(async () => {
  if (enabled) await closePool();
});

test('a tenant template is versioned, listed and previewed without writes', options, async () => {
  const created = await createTemplateInTenant({
    tenantId: TENANT_A,
    actorUserId: USER_A,
    config: config(),
  });
  const templates = await listTemplates({ tenantId: TENANT_A });
  const template = templates.find((item) => item.template_id === created.template.template_id);
  assert.ok(template);
  assert.equal(template.current_version, 1);
  assert.match(template.versions[0].config_hash, /^[0-9a-f]{64}$/);

  const preview = await previewTemplate({
    tenantId: TENANT_A,
    templateId: created.template.template_id,
    lead: { external_id: `preview-${RUN_ID}`, email: 'Preview@Example.INVALID', name: 'Preview' },
  });
  assert.equal(preview.preview.payload.email, 'preview@example.invalid');
  assert.equal(preview.preview.operation, 'crm.contact.upsert');
  assert.equal(await countRunRows(), 0);
});

test('missing required fields, secrets and unknown fields are rejected', options, async () => {
  await assert.rejects(
    () =>
      previewTemplate({
        tenantId: TENANT_A,
        templateId: 'a3000000-0000-4000-8000-000000000001',
        lead: { external_id: 'missing-email' },
      }),
    (error) => error.code === TEMPLATE_ERROR.MISSING_REQUIRED_FIELD,
  );
  await assert.rejects(
    () => createTemplateInTenant({ tenantId: TENANT_A, actorUserId: USER_A, config: config({ nameSuffix: 'secret', api_key: 'x' }) }),
    (error) => error.code === TEMPLATE_ERROR.SECRET_FIELD,
  );
  await assert.rejects(
    () => createTemplateInTenant({ tenantId: TENANT_A, actorUserId: USER_A, config: config({ nameSuffix: 'extra', extra: true }) }),
    (error) => error.code === TEMPLATE_ERROR.UNKNOWN_FIELD,
  );
});

test('a template from another tenant is not found', options, async () => {
  await assert.rejects(
    () =>
      previewTemplate({
        tenantId: TENANT_B,
        templateId: 'a3000000-0000-4000-8000-000000000001',
        lead: { external_id: 'cross', email: 'cross@example.invalid' },
      }),
    (error) => error.code === TEMPLATE_ERROR.NOT_FOUND,
  );
  const bTemplates = await listTemplates({ tenantId: TENANT_B });
  assert.equal(bTemplates.some((item) => item.template_id === 'a3000000-0000-4000-8000-000000000001'), false);
});

test('incompatible version revokes linked approvals; compatible version does not', options, async () => {
  const created = await createTemplateInTenant({
    tenantId: TENANT_A,
    actorUserId: USER_A,
    config: config({ nameSuffix: 'approval' }),
  });
  const { run } = await createRunInTenant({
    tenantId: TENANT_A,
    leadId: LEAD_A,
    workflowVersionId: WORKFLOW_VERSION_A,
    idempotencyKey: `template-approval-${RUN_ID}`,
  });
  await transitionRunInTenant({ tenantId: TENANT_A, runId: run.run_id, targetState: 'VALIDATED' });
  await transitionRunInTenant({ tenantId: TENANT_A, runId: run.run_id, targetState: 'PROPOSED' });
  await transitionRunInTenant({ tenantId: TENANT_A, runId: run.run_id, targetState: 'PENDING_APPROVAL' });
  const payload = { external_id: `template-${RUN_ID}`, email: 'template@example.invalid', name: 'Template' };
  const requested = await requestApprovalInTenant({
    tenantId: TENANT_A,
    runId: run.run_id,
    actorUserId: USER_A,
    scope: 'crm.contact.upsert',
    payload,
    payloadVersion: 1,
    ttlSeconds: 300,
    templateVersionId: created.version.template_version_id,
  });
  await decideApprovalInTenant({
    tenantId: TENANT_A,
    approvalId: requested.approval.approval_id,
    actorUserId: USER_A,
    token: requested.token,
    decision: 'APPROVED',
  });

  const incompatible = await createTemplateVersionInTenant({
    tenantId: TENANT_A,
    templateId: created.template.template_id,
    actorUserId: USER_A,
    config: config({
      nameSuffix: 'v2',
      required_fields: ['external_id', 'email', 'name'],
    }),
  });
  assert.equal(incompatible.breaking, true);
  assert.equal(incompatible.invalidatedApprovals, 1);

  await assert.rejects(
    () =>
      verifyApprovalInTenant({
        tenantId: TENANT_A,
        approvalId: requested.approval.approval_id,
        scope: 'crm.contact.upsert',
        payload,
        payloadVersion: 1,
      }),
    (error) => error.code === 'NOT_APPROVED',
  );

  const compatible = await createTemplateVersionInTenant({
    tenantId: TENANT_A,
    templateId: created.template.template_id,
    actorUserId: USER_A,
    config: config({
      nameSuffix: 'v3',
      required_fields: ['external_id', 'email', 'name'],
      limits: { max_tokens: 50, max_cost: 1 },
    }),
  });
  assert.equal(compatible.breaking, false);
  assert.equal(compatible.invalidatedApprovals, 0);
});

test('template versions are immutable for the app role', options, async () => {
  await assert.rejects(
    () =>
      withTenant(TENANT_A, (client) =>
        client.query("UPDATE workflow_template_versions SET config = config WHERE tenant_id = $1", [TENANT_A]),
      ),
    (error) => error.code === '42501',
  );
});

async function countRunRows() {
  return withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT count(*)::int AS total FROM runs WHERE idempotency_key LIKE $1', [
      `template-preview-${RUN_ID}%`,
    ]);
    return result.rows[0].total;
  });
}
