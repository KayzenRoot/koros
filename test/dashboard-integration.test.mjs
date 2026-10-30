import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startLocalServer } from '../src/app.mjs';
import { closePool, withTenant } from '../src/db.mjs';
import { hashPassword } from '../src/auth/password.mjs';
import { resetLoginRateLimit } from '../src/auth/service.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PASSWORD_A = 'Synthetic-Owner-A-123!';
const PASSWORD_B = 'Synthetic-Viewer-B-123!';

let server;
let origin;

function sessionCookie(response) {
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') || ''];
  const cookie = cookies.find((value) => value.startsWith('koros_session='));
  assert.ok(cookie, 'expected a session cookie');
  return cookie.split(';', 1)[0];
}

async function login(email, password) {
  const response = await fetch(`${origin}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return sessionCookie(response);
}

async function summary(cookie, suffix = '') {
  const response = await fetch(`${origin}/v1/dashboard/summary${suffix}`, {
    headers: { cookie },
  });
  return { response, body: await response.json() };
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

test('operator sees only its tenant even with a cross-tenant query parameter', options, async () => {
  const cookie = await login('owner-a@example.invalid', PASSWORD_A);
  const { response, body } = await summary(cookie, `?tenant_id=${TENANT_B}`);
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
      ['/assets/dashboard.css', 'text/css'],
      ['/assets/dashboard.js', 'text/javascript'],
      ['/assets/login.js', 'text/javascript'],
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
