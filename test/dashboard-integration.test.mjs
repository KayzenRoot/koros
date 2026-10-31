import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { startLocalServer } from '../src/app.mjs';
import { closePool, withTenant } from '../src/db.mjs';
import { hashPassword } from '../src/auth/password.mjs';
import { resetLoginRateLimit } from '../src/auth/service.mjs';
import { requestApprovalInTenant } from '../src/approval/index.mjs';
import { createRunInTenant, getRun, transitionRunInTenant } from '../src/workflow/index.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const LEAD_A = 'a0000000-0000-4000-8000-000000000004';
const WORKFLOW_VERSION_A = 'a0000000-0000-4000-8000-000000000002';
const PASSWORD_A = 'Synthetic-Owner-A-123!';
const PASSWORD_B = 'Synthetic-Viewer-B-123!';
const PSQL = process.env.PSQL_BIN || 'psql';
const RUN_ID = `${Date.now().toString(36)}-${process.pid}`;

let server;
let origin;

function cookieValue(response, prefix) {
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') || ''];
  const cookie = cookies.find((value) => value.startsWith(prefix));
  assert.ok(cookie, `expected ${prefix} cookie`);
  return cookie.split(';', 1)[0];
}

async function loginCookies(email, password) {
  const response = await fetch(`${origin}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const csrfCookie = cookieValue(response, 'koros_csrf=');
  return {
    session: cookieValue(response, 'koros_session='),
    csrf: csrfCookie.split('=', 2)[1],
    csrfCookie,
  };
}

async function login(email, password) {
  return (await loginCookies(email, password)).session;
}

async function summary(cookie, suffix = '', extraHeaders = {}) {
  const response = await fetch(`${origin}/v1/dashboard/summary${suffix}`, {
    headers: { cookie, ...extraHeaders },
  });
  return { response, body: await response.json() };
}

async function createPendingApproval(suffix) {
  const { run } = await createRunInTenant({
    tenantId: TENANT_A,
    leadId: LEAD_A,
    workflowVersionId: WORKFLOW_VERSION_A,
    idempotencyKey: `approval-ui-${RUN_ID}-${suffix}`,
  });
  await transitionRunInTenant({ tenantId: TENANT_A, runId: run.run_id, targetState: 'VALIDATED' });
  await transitionRunInTenant({ tenantId: TENANT_A, runId: run.run_id, targetState: 'PROPOSED' });
  await transitionRunInTenant({ tenantId: TENANT_A, runId: run.run_id, targetState: 'PENDING_APPROVAL' });
  const payload = {
    external_id: `approval-ui-${RUN_ID}-${suffix}`,
    email: `${suffix}@example.invalid`,
    name: `Synthetic ${suffix}`,
  };
  const requested = await requestApprovalInTenant({
    tenantId: TENANT_A,
    runId: run.run_id,
    actorUserId: USER_A,
    scope: 'crm.contact.upsert',
    payload,
    payloadVersion: 1,
    ttlSeconds: 300,
  });
  return { run, payload, approval: requested.approval };
}

async function decide(cookies, approvalId, decision) {
  return fetch(`${origin}/v1/approvals/${approvalId}/decision`, {
    method: 'POST',
    headers: {
      cookie: `${cookies.session}; ${cookies.csrfCookie}`,
      'content-type': 'application/json',
      'x-csrf-token': cookies.csrf,
    },
    body: JSON.stringify({ decision }),
  });
}

function psqlAsOwner(sql) {
  const result = spawnSync(PSQL, ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-tA', '-c', sql], {
    encoding: 'utf8',
    env: { ...process.env, PGUSER: process.env.PGUSER || 'postgres' },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

before(async () => {
  if (!enabled) return;
  const [hashA, hashB] = await Promise.all([hashPassword(PASSWORD_A), hashPassword(PASSWORD_B)]);
  await withTenant(TENANT_A, async (client) => {
    await client.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hashA, USER_A]);
    await client.query(
      `UPDATE memberships SET role = 'owner' WHERE tenant_id = $1 AND user_id = $2`,
      [TENANT_A, USER_A],
    );
  });
  await withTenant(TENANT_B, async (client) => {
    await client.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hashB, USER_B]);
    await client.query(
      `UPDATE memberships SET role = 'viewer' WHERE tenant_id = $1 AND user_id = $2`,
      [TENANT_B, USER_B],
    );
  });
  resetLoginRateLimit();
  server = await startLocalServer(0);
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  if (enabled) await closePool();
});

test('unauthenticated dashboard API returns 401', options, async () => {
  const response = await fetch(`${origin}/v1/dashboard/summary`);
  assert.equal(response.status, 401);
});

test('operator sees only its tenant even with cross-tenant query and headers', options, async () => {
  const cookie = await login('owner-a@example.invalid', PASSWORD_A);
  const { response, body } = await summary(cookie, `?tenant_id=${TENANT_B}`, {
    'x-koros-tenant': TENANT_B,
    'x-tenant-id': TENANT_B,
    'x-koros-account': 'source-b',
  });
  assert.equal(response.status, 200);
  assert.equal(body.tenant.id, TENANT_A);
  assert.equal(body.tenant.name, 'Synthetic Tenant A');
  assert.equal(body.role, 'owner');
  assert.ok(body.permissions.includes('approval:decide'));
  assert.ok(body.queue.some((run) => run.idempotency_key === 'run-a'));
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes(TENANT_B), false);
  assert.equal(serialized.includes('Synthetic Tenant B'), false);
  assert.equal(serialized.includes('run-b'), false);
});

test('viewer receives only session:read and sees its own tenant data', options, async () => {
  const cookie = await login('owner-b@example.invalid', PASSWORD_B);
  const { response, body } = await summary(cookie);
  assert.equal(response.status, 200);
  assert.equal(body.tenant.id, TENANT_B);
  assert.equal(body.role, 'viewer');
  assert.deepEqual(body.permissions, ['session:read']);
  assert.ok(body.queue.some((run) => run.idempotency_key === 'run-b'));
  assert.equal(JSON.stringify(body).includes('run-a'), false);
});

test('static pages and assets are served with a restrictive CSP', options, async () => {
  const root = await fetch(`${origin}/`, { redirect: 'manual' });
  assert.equal(root.status, 302);
  assert.equal(root.headers.get('location'), '/login');

  await Promise.all(
    [
      ['/login', 'text/html'],
      ['/dashboard', 'text/html'],
      ['/onboarding', 'text/html'],
      ['/assets/dashboard.css', 'text/css'],
      ['/assets/dashboard.js', 'text/javascript'],
      ['/assets/login.js', 'text/javascript'],
      ['/assets/onboarding.js', 'text/javascript'],
    ].map(async ([path, type]) => {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 200, path);
      assert.ok(response.headers.get('content-type').startsWith(type), path);
      assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
    }),
  );

  const loginHtml = await (await fetch(`${origin}/login`)).text();
  assert.match(loginHtml, /lang="pt-BR"/);
  assert.match(loginHtml, /aria-live|role="alert"/);
  const dashboardHtml = await (await fetch(`${origin}/dashboard`)).text();
  assert.match(dashboardHtml, /class="skip-link"/);
  assert.match(dashboardHtml, /aria-live="polite"/);
});

test('an invalid session is rejected by the dashboard API', options, async () => {
  const response = await fetch(`${origin}/v1/dashboard/summary`, {
    headers: { cookie: 'koros_session=invalid' },
  });
  assert.equal(response.status, 401);
});

test('an authorized approver can confirm an exact pending payload once', options, async () => {
  const { run, payload, approval } = await createPendingApproval('exact');
  const cookies = await loginCookies('owner-a@example.invalid', PASSWORD_A);

  const listed = await fetch(`${origin}/v1/approvals`, { headers: { cookie: cookies.session } });
  assert.equal(listed.status, 200);
  const listBody = await listed.json();
  const item = listBody.pending.find((entry) => entry.approval_id === approval.approval_id);
  assert.ok(item);
  assert.equal(item.proposed_operation.payload.name, payload.name);
  assert.equal(item.run_state, 'PENDING_APPROVAL');

  const response = await decide(cookies, approval.approval_id, 'APPROVED');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'APPROVED');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'APPROVED');

  const after = await (await fetch(`${origin}/v1/approvals`, { headers: { cookie: cookies.session } })).json();
  assert.equal(after.pending.some((entry) => entry.approval_id === approval.approval_id), false);
  assert.ok(after.history.some((entry) => entry.approval_id === approval.approval_id && entry.decision === 'APPROVED'));
});

test('double submission and replay are idempotent with one audit event', options, async () => {
  const { run, approval } = await createPendingApproval('double');
  const cookies = await loginCookies('owner-a@example.invalid', PASSWORD_A);
  const [first, second] = await Promise.all([
    decide(cookies, approval.approval_id, 'APPROVED'),
    decide(cookies, approval.approval_id, 'APPROVED'),
  ]);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  const statuses = [(await first.json()).status, (await second.json()).status].sort();
  assert.deepEqual(statuses, ['APPROVED', 'IDEMPOTENT']);
  const audit = await withTenant(TENANT_A, async (client) => {
    const result = await client.query(
      "SELECT count(*)::int AS total FROM audit_events WHERE run_id = $1 AND action = 'APPROVAL_APPROVED'",
      [run.run_id],
    );
    return result.rows[0].total;
  });
  assert.equal(audit, 1);
});

test('lost session and missing CSRF never decide an approval', options, async () => {
  const { run, approval } = await createPendingApproval('session');
  const noSession = await fetch(`${origin}/v1/approvals/${approval.approval_id}/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ decision: 'APPROVED' }),
  });
  assert.equal(noSession.status, 401);

  const cookies = await loginCookies('owner-a@example.invalid', PASSWORD_A);
  const noCsrf = await fetch(`${origin}/v1/approvals/${approval.approval_id}/decision`, {
    method: 'POST',
    headers: { cookie: cookies.session, 'content-type': 'application/json' },
    body: JSON.stringify({ decision: 'APPROVED' }),
  });
  assert.equal(noCsrf.status, 403);
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'PENDING_APPROVAL');
});

test('viewer cannot list or decide approvals', options, async () => {
  const { run, approval } = await createPendingApproval('viewer');
  const cookies = await loginCookies('owner-b@example.invalid', PASSWORD_B);
  const list = await fetch(`${origin}/v1/approvals`, { headers: { cookie: cookies.session } });
  assert.equal(list.status, 403);
  const decision = await decide(cookies, approval.approval_id, 'APPROVED');
  assert.equal(decision.status, 403);
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'PENDING_APPROVAL');
});

test('a tampered payload is rejected by the server hash check', options, async () => {
  const { run, approval } = await createPendingApproval('tampered');
  psqlAsOwner(
    `UPDATE approvals
        SET proposed_operation = jsonb_set(proposed_operation, '{payload,name}', '"Tampered"'::jsonb)
      WHERE approval_id = '${approval.approval_id}'`,
  );
  const cookies = await loginCookies('owner-a@example.invalid', PASSWORD_A);
  const response = await decide(cookies, approval.approval_id, 'APPROVED');
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'PAYLOAD_MISMATCH');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'PENDING_APPROVAL');
});

test('an invalid decision is rejected without mutation', options, async () => {
  const { run, approval } = await createPendingApproval('invalid');
  const cookies = await loginCookies('owner-a@example.invalid', PASSWORD_A);
  const response = await decide(cookies, approval.approval_id, 'MAYBE');
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'INVALID_INPUT');
  assert.equal((await getRun({ tenantId: TENANT_A, runId: run.run_id })).state, 'PENDING_APPROVAL');
});
