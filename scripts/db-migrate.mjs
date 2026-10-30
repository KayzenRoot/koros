import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, 'db', 'migrations');
const SEED_FILE = join(ROOT, 'db', 'seeds', 'synthetic.sql');

// Fixed, absolute client path. The CI job installs postgresql-client at /usr/bin/psql;
// the supported local Windows installation uses the PostgreSQL 17 path below.
const PSQL = process.platform === 'win32'
  ? 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe'
  : '/usr/bin/psql';
const PSQL_ARGS = Object.freeze(['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-tA']);

// Static allowlist: adding a migration requires a code review and a new entry here.
const MIGRATIONS = Object.freeze([
  Object.freeze({
    version: '0001_init',
    up: join(MIGRATIONS_DIR, '0001_init.sql'),
    down: join(MIGRATIONS_DIR, '0001_init.down.sql'),
  }),
  Object.freeze({
    version: '0002_auth',
    up: join(MIGRATIONS_DIR, '0002_auth.sql'),
    down: join(MIGRATIONS_DIR, '0002_auth.down.sql'),
  }),
]);

function fail(message) {
  console.error(`DB_MIGRATE_FAIL: ${message}`);
  process.exitCode = 1;
  process.exit(1);
}

function runPsql(input) {
  const result = spawnSync(PSQL, PSQL_ARGS, { input, encoding: 'utf8' });
  if (result.error) fail(`${PSQL} could not start: ${result.error.message}`);
  if (result.status !== 0) fail((result.stderr || result.stdout || 'psql failed').trim());
  return (result.stdout || '').trim();
}

function runSql(sql) {
  return runPsql(sql);
}

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

function ensureMigrationsTable() {
  runSql(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  );`);
}

function applied() {
  const output = runSql('SELECT version, checksum FROM schema_migrations ORDER BY version;');
  const map = new Map();
  if (!output) return map;
  for (const line of output.split(/\r?\n/)) {
    const [version, sum] = line.split('|');
    if (version) map.set(version, sum);
  }
  return map;
}

function up() {
  ensureMigrationsTable();
  const done = applied();
  for (const migration of MIGRATIONS) {
    if (!existsSync(migration.up)) fail(`missing migration: ${migration.up}`);
    const sql = readFileSync(migration.up, 'utf8');
    const sum = checksum(sql);
    if (done.has(migration.version)) {
      if (done.get(migration.version) !== sum) fail(`checksum mismatch for applied migration ${migration.version}`);
      console.info(`SKIP ${migration.version} (already applied)`);
      continue;
    }
    console.info(`APPLY ${migration.version}`);
    runPsql(sql);
    runSql(`INSERT INTO schema_migrations (version, checksum) VALUES ('${migration.version}', '${sum}');`);
  }
}

function down(version) {
  const migration = MIGRATIONS.find((item) => item.version === version);
  if (!migration) fail(`unknown migration: ${version ?? '<empty>'}`);
  if (!existsSync(migration.down)) fail(`missing down migration: ${migration.down}`);
  const done = applied();
  if (!done.has(migration.version)) fail(`migration not applied: ${migration.version}`);
  console.info(`ROLLBACK ${migration.version}`);
  runPsql(readFileSync(migration.down, 'utf8'));
  runSql(`DELETE FROM schema_migrations WHERE version = '${migration.version}';`);
}

function downLatest() {
  const done = applied();
  const migration = [...MIGRATIONS].reverse().find((item) => done.has(item.version));
  if (!migration) fail('no applied migration to roll back');
  down(migration.version);
}

function downAll() {
  const done = applied();
  for (const migration of [...MIGRATIONS].reverse()) {
    if (done.has(migration.version)) down(migration.version);
  }
}

function seed() {
  if (!existsSync(SEED_FILE)) fail(`missing seed: ${SEED_FILE}`);
  console.info('SEED synthetic data');
  runPsql(readFileSync(SEED_FILE, 'utf8'));
}

function status() {
  ensureMigrationsTable();
  const done = applied();
  if (done.size === 0) {
    console.info('No migrations applied.');
    return;
  }
  for (const [version, sum] of done) console.info(`${version} ${sum}`);
}

const command = process.argv[2] || 'up';
try {
  if (command === 'up') up();
  else if (command === 'down') down(process.argv[3]);
  else if (command === 'down-latest') downLatest();
  else if (command === 'down-all') downAll();
  else if (command === 'seed') seed();
  else if (command === 'status') status();
  else fail(`unknown command: ${command}`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
