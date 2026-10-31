import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { closePool, withTenant } from '../src/db.mjs';
import {
  ONBOARDING_ERROR,
  advanceOnboardingInTenant,
  getOnboarding,
  provisionSyntheticTenant,
  startOnboardingInTenant,
} from '../src/onboarding/index.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const RUN_ID = `${Date.now().toString(36)}-${process.pid}`;
const OWNER_PASSWORD = 'Synthetic-Onboarding-123!';

let provisioned;
let sessionId;

before(async () => {
  if (!enabled) return;
  await withTenant(TENANT_B, (client) =>
    client.query("UPDATE memberships SET role = 'viewer' WHERE tenant_id = $1 AND user_id = $2", [
      TENANT_B,
      USER_B,
    ]),
  );
  process.env.KOROS_ALLOW_TENANT_PROVISIONING = '1';
  provisioned = await provisionSyntheticTenant({
    name: `Onboarding ${RUN_ID}`,
    ownerEmail: `onboarding-${RUN_ID}@example.invalid`,
    ownerPassword: OWNER_PASSWORD,
  });
  const started = await startOnboardingInTenant({
    tenantId: provisioned.tenantId,
    actorUserId: provisioned.userId,
  });
  sessionId = started.session.session_id;
});

after(async () => {
  delete process.env.KOROS_ALLOW_TENANT_PROVISIONING;
  if (enabled && provisioned) {
    await withTenant(provisioned.tenantId, (client) =>
      client.query('DELETE FROM organizations WHERE tenant_id = $1', [provisioned.tenantId]),
    );
  }
  if (enabled) await closePool();
});

test('a freshly provisioned tenant starts isolated with its own default template', options, async () => {
  assert.ok(provisioned.tenantId);
  assert.ok(provisioned.templateVersionId);
  assert.notEqual(provisioned.tenantId, TENANT_A);
  const onboarding = await getOnboarding({ tenantId: provisioned.tenantId });
  assert.equal(onboarding.session.current_step, 'TENANT');
  const outsider = await getOnboarding({ tenantId: TENANT_A });
  if (outsider.session) assert.notEqual(outsider.session.tenant_id, provisioned.tenantId);
});

test('the wizard resumes after a missing scope and completes a synthetic dry-run', options, async () => {
  const tenantId = provisioned.tenantId;
  const actorUserId = provisioned.userId;

  const tenant = await advanceOnboardingInTenant({
    tenantId,
    sessionId,
    actorUserId,
    step: 'TENANT',
    data: { name: `Onboarding ${RUN_ID}` },
  });
  assert.equal(tenant.session.current_step, 'CONNECTOR');

  await assert.rejects(
    () =>
      advanceOnboardingInTenant({
        tenantId,
        sessionId,
        actorUserId,
        step: 'CONNECTOR',
        data: { provider: 'synthetic-webhook', account: 'onboarding', scopes: [] },
      }),
    (error) => error.code === ONBOARDING_ERROR.MISSING_SCOPE,
  );
  const resumed = await getOnboarding({ tenantId });
  assert.equal(resumed.session.current_step, 'CONNECTOR');

  const connector = await advanceOnboardingInTenant({
    tenantId,
    sessionId,
    actorUserId,
    step: 'CONNECTOR',
    data: { provider: 'synthetic-webhook', account: 'onboarding', scopes: ['leads:read'] },
  });
  assert.equal(connector.session.current_step, 'TEMPLATE');

  const template = await advanceOnboardingInTenant({
    tenantId,
    sessionId,
    actorUserId,
    step: 'TEMPLATE',
    data: { template_version_id: provisioned.templateVersionId },
  });
  assert.equal(template.session.current_step, 'INVITE');

  const invite = await advanceOnboardingInTenant({
    tenantId,
    sessionId,
    actorUserId,
    step: 'INVITE',
    data: { email: `invitee-${RUN_ID}@example.invalid`, role: 'operator' },
  });
  assert.equal(invite.session.current_step, 'CONSENT');
  assert.ok(invite.invite_token);
  assert.ok(invite.session.invite_id);
  assert.equal(JSON.stringify(invite.session).includes(invite.invite_token), false);

  const consent = await advanceOnboardingInTenant({
    tenantId,
    sessionId,
    actorUserId,
    step: 'CONSENT',
    data: { future_use: 'GRANTED' },
  });
  assert.equal(consent.session.current_step, 'POLICY');

  const policy = await advanceOnboardingInTenant({
    tenantId,
    sessionId,
    actorUserId,
    step: 'POLICY',
    data: { accepted: true, version: 'local-v1' },
  });
  assert.equal(policy.session.current_step, 'DRY_RUN');

  const dryRun = await advanceOnboardingInTenant({
    tenantId,
    sessionId,
    actorUserId,
    step: 'DRY_RUN',
    data: {
      lead: { external_id: `onboarding-${RUN_ID}`, email: 'onboarding@example.invalid', name: 'Onboarding' },
    },
  });
  assert.equal(dryRun.session.status, 'COMPLETED');
  assert.equal(dryRun.session.current_step, 'COMPLETED');
  assert.equal(dryRun.session.dry_run.preview.payload.email, 'onboarding@example.invalid');

  const counts = await withTenant(tenantId, async (client) => {
    const runs = await client.query('SELECT count(*)::int AS total FROM runs');
    const outbox = await client.query('SELECT count(*)::int AS total FROM outbox_actions');
    return { runs: runs.rows[0].total, outbox: outbox.rows[0].total };
  });
  assert.deepEqual(counts, { runs: 0, outbox: 0 });
});

test('viewer cannot start onboarding and provisioning can be disabled', options, async () => {
  await assert.rejects(
    () => startOnboardingInTenant({ tenantId: TENANT_B, actorUserId: USER_B }),
    (error) => error.code === ONBOARDING_ERROR.FORBIDDEN,
  );
  delete process.env.KOROS_ALLOW_TENANT_PROVISIONING;
  await assert.rejects(
    () =>
      provisionSyntheticTenant({
        name: 'Disabled',
        ownerEmail: `disabled-${RUN_ID}@example.invalid`,
        ownerPassword: OWNER_PASSWORD,
      }),
    (error) => error.code === ONBOARDING_ERROR.PROVISIONING_DISABLED,
  );
  process.env.KOROS_ALLOW_TENANT_PROVISIONING = '1';
});

test('a wrong wizard step fails without mutating the session', options, async () => {
  const started = await startOnboardingInTenant({ tenantId: TENANT_A, actorUserId: USER_A });
  const beforeState = await getOnboarding({ tenantId: TENANT_A });
  await assert.rejects(
    () =>
      advanceOnboardingInTenant({
        tenantId: TENANT_A,
        sessionId: started.session.session_id,
        actorUserId: USER_A,
        step: 'CONNECTOR',
        data: { provider: 'synthetic-webhook', account: 'x', scopes: ['leads:read'] },
      }),
    (error) => error.code === ONBOARDING_ERROR.STEP_MISMATCH,
  );
  const afterState = await getOnboarding({ tenantId: TENANT_A });
  assert.equal(afterState.session.current_step, beforeState.session.current_step);
});
