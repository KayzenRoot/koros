import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLocalEnvironment } from '../scripts/local-env-policy.mjs';

test('default local environment is loopback-only and valid', () => {
  const result = validateLocalEnvironment({});
  assert.equal(result.ok, true);
  assert.equal(result.databaseHost, '127.0.0.1');
  assert.equal(result.appHost, '127.0.0.1');
  assert.notEqual(result.databasePort, result.appPort);
});

test('production, non-loopback and Docker socket settings fail closed', () => {
  assert.equal(validateLocalEnvironment({ NODE_ENV: 'production' }).ok, false);
  assert.equal(validateLocalEnvironment({ KOROS_LOCAL_DB_HOST: '0.0.0.0' }).ok, false);
  assert.equal(validateLocalEnvironment({ KOROS_LOCAL_APP_HOST: '192.168.1.10' }).ok, false);
  assert.equal(validateLocalEnvironment({ KOROS_DOCKER_SOCKET: '/var/run/docker.sock' }).ok, false);
  assert.equal(validateLocalEnvironment({ KOROS_ALLOW_NON_LOOPBACK: '1' }).ok, false);
  assert.equal(validateLocalEnvironment({ KOROS_SECURE_COOKIES: '1' }).ok, false);
});

test('ports and database URL are validated', () => {
  assert.equal(validateLocalEnvironment({ KOROS_LOCAL_DB_PORT: '0' }).ok, false);
  assert.equal(validateLocalEnvironment({ KOROS_LOCAL_APP_PORT: '70000' }).ok, false);
  assert.equal(
    validateLocalEnvironment({ KOROS_LOCAL_DB_PORT: '3030', KOROS_LOCAL_APP_PORT: '3030' }).ok,
    false,
  );
  assert.equal(
    validateLocalEnvironment({ KOROS_DATABASE_URL: 'postgres://koros_app@10.0.0.5:5432/koros' }).ok,
    false,
  );
  assert.equal(
    validateLocalEnvironment({ KOROS_DATABASE_URL: 'postgres://koros_app@127.0.0.1:55432/koros' }).ok,
    true,
  );
});

test('the local manifest contains no external bind or Docker socket', () => {
  const example = readFileSync(new URL('../deploy/local/env.example', import.meta.url), 'utf8');
  assert.equal(example.includes('0.0.0.0'), false);
  assert.equal(example.includes('/var/run/docker.sock'), false);
  assert.equal(example.includes('NODE_ENV=production'), false);
  assert.equal(example.includes('KOROS_SECURE_COOKIES=1'), false);
});
