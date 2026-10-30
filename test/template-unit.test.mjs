import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATE_ERROR,
  isBreakingTemplateChange,
  previewTemplateConfig,
  templateConfigHash,
  validateTemplateConfig,
} from '../src/templates/index.mjs';

const CONFIG = {
  schema_version: 1,
  name: 'Lead para CRM (sintético)',
  source: { provider: 'synthetic-webhook', account: 'source-a' },
  required_fields: ['external_id', 'email'],
  field_map: { external_id: 'external_id', email: 'email', name: 'name' },
  crm: { operation: 'crm.contact.upsert', target: 'crm:agendor' },
  approval: { required: true, scope: 'crm.contact.upsert', ttl_seconds: 900 },
  limits: { max_tokens: 1000, max_cost: 10 },
};

test('a valid config is normalized and hashed deterministically', () => {
  const normalized = validateTemplateConfig(CONFIG);
  assert.equal(normalized.name, CONFIG.name);
  assert.equal(normalized.limits.max_tokens, 1000);
  assert.match(templateConfigHash(normalized), /^[0-9a-f]{64}$/);
  assert.equal(templateConfigHash(normalized), templateConfigHash(validateTemplateConfig(CONFIG)));
});

test('unknown fields and secret-like keys are rejected', () => {
  assert.throws(
    () => validateTemplateConfig({ ...CONFIG, extra: true }),
    (error) => error.code === TEMPLATE_ERROR.UNKNOWN_FIELD,
  );
  assert.throws(
    () => validateTemplateConfig({ ...CONFIG, source: { ...CONFIG.source, api_key: 'x' } }),
    (error) => error.code === TEMPLATE_ERROR.SECRET_FIELD,
  );
  assert.throws(
    () => validateTemplateConfig({ ...CONFIG, approval: { ...CONFIG.approval, ttl_seconds: 1 } }),
    (error) => error.code === TEMPLATE_ERROR.INVALID_TEMPLATE,
  );
});

test('required fields must include external_id and email', () => {
  assert.throws(
    () => validateTemplateConfig({ ...CONFIG, required_fields: ['external_id'] }),
    (error) => error.code === TEMPLATE_ERROR.INVALID_TEMPLATE,
  );
});

test('dry-run maps a synthetic lead without writing', () => {
  const normalized = validateTemplateConfig(CONFIG);
  const preview = previewTemplateConfig(normalized, {
    external_id: 'lead-preview-1',
    email: 'Preview@Example.INVALID',
    name: 'Synthetic Preview',
    intent: 'demo',
  });
  assert.equal(preview.operation, 'crm.contact.upsert');
  assert.equal(preview.target, 'crm:agendor');
  assert.equal(preview.payload.external_id, 'lead-preview-1');
  assert.equal(preview.payload.email, 'preview@example.invalid');
  assert.equal(preview.approval_required, true);
  assert.deepEqual(preview.fields, ['email', 'external_id', 'name']);
});

test('dry-run rejects omitted required fields and invalid contact mapping', () => {
  const normalized = validateTemplateConfig(CONFIG);
  assert.throws(
    () => previewTemplateConfig(normalized, { external_id: 'lead-preview-2' }),
    (error) => error.code === TEMPLATE_ERROR.MISSING_REQUIRED_FIELD,
  );
  assert.throws(
    () => previewTemplateConfig(normalized, { external_id: 'lead-preview-2', email: 'invalid' }),
    (error) => error.code === TEMPLATE_ERROR.INVALID_FIELD,
  );
});

test('compatibility ignores limits/name but detects core changes', () => {
  const base = validateTemplateConfig(CONFIG);
  const renamed = validateTemplateConfig({ ...CONFIG, name: 'Renamed template' });
  assert.equal(isBreakingTemplateChange(base, renamed), false);

  const changedLimits = validateTemplateConfig({ ...CONFIG, limits: { max_tokens: 50, max_cost: 1 } });
  assert.equal(isBreakingTemplateChange(base, changedLimits), false);

  const changedTarget = validateTemplateConfig({
    ...CONFIG,
    crm: { operation: 'crm.contact.upsert', target: 'crm:hubspot' },
  });
  assert.equal(isBreakingTemplateChange(base, changedTarget), true);

  const changedFields = validateTemplateConfig({
    ...CONFIG,
    required_fields: ['external_id', 'email', 'name'],
  });
  assert.equal(isBreakingTemplateChange(base, changedFields), true);
});
