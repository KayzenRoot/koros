import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const enabled = process.env.KOROS_DB_TESTS === '1';
const PSQL = process.env.PSQL_BIN || 'psql';
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const EVENT_A = 'a0000000-0000-4000-8000-000000000003';
const EVENT_B = 'b0000000-0000-4000-8000-000000000003';
const APP_USER = 'koros_app';
const APP_PASSWORD = process.env.KOROS_TEST_APP_PASSWORD || 'koros_test_only_password';

function psql(sql, { user, password, database } = {}) {
  const env = { ...process.env };
  if (user) env.PGUSER = user;
  if (password !== undefined) env.PGPASSWORD = password;
  if (database) env.PGDATABASE = database;
  const result = spawnSync(PSQL, ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-tA', '-c', sql], {
    encoding: 'utf8',
    env,
  });
  if (result.error) throw new Error(`${PSQL} could not start: ${result.error.message}`);
  return result;
}

function query(sql, options) {
  const result = psql(sql, options);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const tags = new Set(['BEGIN', 'SET', 'COMMIT', 'ROLLBACK', 'RESET']);
  const lines = (result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !tags.has(line));
  return lines.join('\n').trim();
}

function expectFailure(sql, options) {
  const result = psql(sql, options);
  assert.notEqual(result.status, 0, `expected database rejection: ${sql}`);
  return result;
}

const asApp = (sql) => query(sql, { user: APP_USER, password: APP_PASSWORD });
const failAsApp = (sql) => expectFailure(sql, { user: APP_USER, password: APP_PASSWORD });
const withTenant = (tenant, sql) => `BEGIN; SET LOCAL app.tenant_id = '${tenant}'; ${sql}; COMMIT;`;

test('migration 0001_init is applied with a SHA-256 checksum', { skip: !enabled }, () => {
  assert.equal(query("SELECT count(*) FROM schema_migrations WHERE version = '0001_init'"), '1');
  assert.match(query("SELECT checksum FROM schema_migrations WHERE version = '0001_init'"), /^[0-9a-f]{64}$/);
});

test('synthetic seed creates exactly two isolated tenants', { skip: !enabled }, () => {
  assert.equal(query('SELECT count(*) FROM organizations'), '2');
  assert.equal(query("SELECT count(*) FROM leads WHERE external_id IN ('lead-a', 'lead-b')"), '2');
  assert.equal(query('SELECT count(*) FROM users'), '2');
});

test('RLS returns only the current tenant rows', { skip: !enabled }, () => {
  assert.equal(asApp(withTenant(TENANT_A, "SELECT count(*) FROM leads WHERE external_id = 'lead-a'")), '1');
  assert.equal(asApp(withTenant(TENANT_B, "SELECT count(*) FROM leads WHERE external_id = 'lead-b'")), '1');
  assert.equal(asApp(withTenant(TENANT_A, `SELECT count(*) FROM leads WHERE external_id = 'lead-b'`)), '0');
});

test('RLS fails closed when app.tenant_id is not set', { skip: !enabled }, () => {
  assert.equal(asApp('SELECT count(*) FROM organizations'), '0');
  assert.equal(asApp('SELECT count(*) FROM leads'), '0');
  assert.equal(asApp('SELECT count(*) FROM audit_events'), '0');
});

test('cross-tenant INSERT is rejected by RLS WITH CHECK', { skip: !enabled }, () => {
  failAsApp(
    withTenant(
      TENANT_A,
      `INSERT INTO leads (tenant_id, event_id, external_id, source, status)
       VALUES ('${TENANT_B}', '${EVENT_B}', 'cross-insert', 'synthetic', 'RECEIVED')`,
    ),
  );
});

test('cross-tenant UPDATE affects zero rows and leaves tenant B intact', { skip: !enabled }, () => {
  asApp(
    withTenant(
      TENANT_A,
      `UPDATE leads SET status = 'ARCHIVED' WHERE tenant_id = '${TENANT_B}'`,
    ),
  );
  assert.equal(
    query(`SELECT count(*) FROM leads WHERE tenant_id = '${TENANT_B}' AND status = 'VALIDATED'`),
    '1',
  );
});

test('audit_events is append-only for the app role', { skip: !enabled }, () => {
  failAsApp(withTenant(TENANT_A, "UPDATE audit_events SET action = 'TAMPER'"));
  failAsApp(withTenant(TENANT_A, 'DELETE FROM audit_events'));
  const count = Number(asApp(withTenant(TENANT_A, 'SELECT count(*) FROM audit_events')));
  assert.ok(count >= 1, `expected at least one audit row, got ${count}`);
});

test('unique tenant/source/external_id blocks a duplicate lead', { skip: !enabled }, () => {
  failAsApp(
    withTenant(
      TENANT_A,
      `INSERT INTO leads (tenant_id, event_id, external_id, source, status)
       VALUES ('${TENANT_A}', '${EVENT_A}', 'lead-a', 'synthetic', 'RECEIVED')`,
    ),
  );
});

test('composite tenant FK blocks an event from another tenant', { skip: !enabled }, () => {
  failAsApp(
    withTenant(
      TENANT_A,
      `INSERT INTO leads (tenant_id, event_id, external_id, source, status)
       VALUES ('${TENANT_A}', '${EVENT_B}', 'fk-cross-tenant', 'synthetic', 'RECEIVED')`,
    ),
  );
});

test('app role cannot read migration bookkeeping', { skip: !enabled }, () => {
  failAsApp('SELECT count(*) FROM schema_migrations');
});

test('audit rows are tenant-scoped', { skip: !enabled }, () => {
  const count = Number(asApp(withTenant(TENANT_A, 'SELECT count(*) FROM audit_events')));
  assert.ok(count >= 1, `expected at least one tenant A audit row, got ${count}`);
  assert.equal(
    asApp(withTenant(TENANT_A, `SELECT count(*) FROM audit_events WHERE tenant_id = '${TENANT_B}'`)),
    '0',
  );
});

test('users are global by design; access control is deferred to WO46', { skip: !enabled }, () => {
  // This is an explicit limitation of the data layer, not an authorization claim.
  // WO46 must bind the authenticated user to a tenant membership before any user query.
  assert.equal(asApp('SELECT count(*) FROM users'), '2');
});
