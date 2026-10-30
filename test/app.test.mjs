import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startLocalServer } from '../src/app.mjs';
import { PUBLIC_CONFIG, VERSION, parsePort } from '../src/config.mjs';

let server;
let origin;
before(async () => {
  server = await startLocalServer(0);
  assert.equal(server.address().address, '127.0.0.1');
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
});

test('health responds with local readiness signal', async () => {
  const res = await fetch(`${origin}/healthz`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('version is sourced from the baseline contract', async () => {
  const res = await fetch(`${origin}/version`);
  assert.deepEqual(await res.json(), { version: VERSION });
});

test('public config advertises session-bound tenant access and no external writes', async () => {
  const res = await fetch(`${origin}/config`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), PUBLIC_CONFIG);
  assert.equal(PUBLIC_CONFIG.tenantAccess, 'authenticated-session-only');
  assert.equal(PUBLIC_CONFIG.externalWrites, false);
  assert.equal(PUBLIC_CONFIG.authentication, 'session-rbac');
  assert.doesNotMatch(JSON.stringify(PUBLIC_CONFIG), /password|secret|token|api[_-]?key/i);
});

test('unknown paths and future tenant routes are not available', async () => {
  for (const pathname of ['/v1/tenants', '/v1/approvals/test/decision', '/v1/connections/crm/verify', '/missing']) {
    const res = await fetch(`${origin}${pathname}`);
    assert.equal(res.status, 404, pathname);
    assert.deepEqual(await res.json(), { error: 'not_found' });
  }
});

test('tenant header cannot grant access or influence public config', async () => {
  const res = await fetch(`${origin}/config`, { headers: { 'X-Tenant-Id': 'tenant-admin', Authorization: 'Bearer fake' } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), PUBLIC_CONFIG);
  const protectedRes = await fetch(`${origin}/v1/tenants`, { headers: { 'X-Tenant-Id': 'tenant-admin' } });
  assert.equal(protectedRes.status, 404);
});

test('no method can mutate resources in this baseline', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
    const res = await fetch(`${origin}/config`, { method });
    assert.equal(res.status, 405);
    assert.deepEqual(await res.json(), { error: 'method_not_allowed' });
  }
});

test('unrecognized path and absolute request target never grant privileges', async () => {
  const res = await fetch(`${origin}/healthz/`);
  assert.equal(res.status, 404);
  const encoded = await fetch(`${origin}/v1%2Ftenants`);
  assert.equal(encoded.status, 404);
});

test('invalid local server ports fail closed', () => {
  for (const value of ['', '-1', '65536', '1.0', '1e3', 'NaN', null, undefined, 5.5]) {
    assert.throws(() => parsePort(value));
  }
  assert.equal(parsePort('0'), 0);
  assert.equal(parsePort(3030), 3030);
  assert.equal(parsePort('65535'), 65535);
});
