import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startLocalServer } from '../src/app.mjs';
import { closePool, getPool, withTenant } from '../src/db.mjs';
import { hashPassword } from '../src/auth/password.mjs';
import { hashToken, parseCookies, SESSION_COOKIE, CSRF_COOKIE } from '../src/auth/session.mjs';
import { resetLoginRateLimit } from '../src/auth/service.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const USER_A = 'owner-a@example.invalid';
const USER_B = 'owner-b@example.invalid';
const PASSWORD = 'SyntheticPassw0rd!';

let server;
let origin;

function parseSetCookies(headers) {
  const cookies = new Map();
  for (const header of headers) {
    const pair = header.split(';', 1)[0];
    const separator = pair.indexOf('=');
    if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  return cookies;
}

function cookieHeader(cookies) {
  return [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
}

function authFetch(pathname, cookies, init = {}) {
  return fetch(`${origin}${pathname}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      cookie: cookieHeader(cookies),
    },
  });
}

async function login(email = USER_A, password = PASSWORD) {
  const res = await fetch(`${origin}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  const cookies = parseSetCookies(res.headers.getSetCookie());
  return { res, body, cookies };
}

before(async () => {
  if (!enabled) return;
  server = await startLocalServer(0);
  origin = `http://127.0.0.1:${server.address().port}`;
  const passwordHash = await hashPassword(PASSWORD);
  const pool = getPool();
  await pool.query('UPDATE users SET password_hash = $1 WHERE email_normalized IN ($2, $3)', [passwordHash, USER_A, USER_B]);
  resetLoginRateLimit();
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  if (enabled) await closePool();
});

beforeEach(() => {
  if (enabled) resetLoginRateLimit();
});

test('login returns a session, CSRF token and tenant A', options, async () => {
  const { res, body, cookies } = await login();
  assert.equal(res.status, 200);
  assert.equal(body.tenant.id, TENANT_A);
  assert.equal(body.role, 'owner');
  assert.equal(body.user.email, USER_A);
  assert.ok(cookies.get(SESSION_COOKIE));
  assert.ok(cookies.get(CSRF_COOKIE));
  assert.notEqual(cookies.get(SESSION_COOKIE), cookies.get(CSRF_COOKIE));
  const setCookies = res.headers.getSetCookie();
  assert(setCookies.some((value) => value.startsWith(`${SESSION_COOKIE}=`) && value.includes('HttpOnly')));
  assert(setCookies.some((value) => value.startsWith(`${CSRF_COOKIE}=`) && !value.includes('HttpOnly')));
});

test('session reads the authenticated tenant and role', options, async () => {
  const { cookies } = await login();
  const res = await authFetch('/v1/auth/session', cookies);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.tenant.id, TENANT_A);
  assert.equal(body.role, 'owner');
});

test('protected route ignores a client-supplied tenant header', options, async () => {
  const { cookies } = await login();
  const res = await authFetch('/v1/protected/ping', cookies, { headers: { 'x-tenant-id': TENANT_B } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.tenantId, TENANT_A);
});

test('owner can reach the approval permission probe', options, async () => {
  const { cookies } = await login();
  const res = await authFetch('/v1/protected/approval', cookies);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).permission, 'approval:decide');
});

test('wrong password is rejected without a session', options, async () => {
  const { res, body, cookies } = await login(USER_A, 'WrongPassword123!');
  assert.equal(res.status, 401);
  assert.equal(body.error, 'invalid_credentials');
  assert.equal(cookies.has(SESSION_COOKIE), false);
});

test('tampered session token is rejected', options, async () => {
  const res = await fetch(`${origin}/v1/auth/session`, {
    headers: { cookie: `${SESSION_COOKIE}=tampered-token` },
  });
  assert.equal(res.status, 401);
});

test('logout requires CSRF, revokes the session and clears cookies', options, async () => {
  const { body, cookies } = await login();
  const withoutCsrf = await authFetch('/v1/auth/logout', cookies, { method: 'POST' });
  assert.equal(withoutCsrf.status, 403);

  const logout = await authFetch('/v1/auth/logout', cookies, {
    method: 'POST',
    headers: { 'x-csrf-token': body.csrfToken },
  });
  assert.equal(logout.status, 200);
  const clear = logout.headers.getSetCookie().join('\n');
  assert.match(clear, /Max-Age=0/);

  const afterLogout = await authFetch('/v1/auth/session', cookies);
  assert.equal(afterLogout.status, 401);
});

test('expired sessions fail closed', options, async () => {
  const { cookies } = await login();
  const token = cookies.get(SESSION_COOKIE);
  await withTenant(TENANT_A, (client) =>
    client.query(
      "UPDATE sessions SET created_at = now() - interval '2 hours', expires_at = now() - interval '1 hour' WHERE token_hash = $1",
      [hashToken(token)],
    ),
  );
  const res = await authFetch('/v1/auth/session', cookies);
  assert.equal(res.status, 401);
});

test('viewer can read its session but cannot approve', options, async () => {
  await withTenant(TENANT_B, (client) =>
    client.query(
      "UPDATE memberships SET role = 'viewer' WHERE tenant_id = $1 AND user_id = (SELECT user_id FROM users WHERE email_normalized = $2)",
      [TENANT_B, USER_B],
    ),
  );
  const { body, cookies } = await login(USER_B);
  assert.equal(body.tenant.id, TENANT_B);
  assert.equal(body.role, 'viewer');

  const ping = await authFetch('/v1/protected/ping', cookies);
  assert.equal(ping.status, 200);
  const approval = await authFetch('/v1/protected/approval', cookies);
  assert.equal(approval.status, 403);
  assert.equal((await approval.json()).error, 'forbidden');
});

test('login rejects unsupported content types and malformed JSON', options, async () => {
  const wrongType = await fetch(`${origin}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: '{}',
  });
  assert.equal(wrongType.status, 415);

  const malformed = await fetch(`${origin}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
});

test('login writes an append-only auth audit event', options, async () => {
  await login();
  const count = await withTenant(TENANT_A, async (client) => {
    const result = await client.query("SELECT count(*)::int AS total FROM audit_events WHERE action = 'AUTH_LOGIN'");
    return result.rows[0].total;
  });
  assert.ok(count >= 1);
});
