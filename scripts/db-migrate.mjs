import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { basename, join, resolve } from 'node:path';

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, 'db', 'migrations');
const SEED_FILE = join(ROOT, 'db', 'seeds', 'synthetic.sql');
const PSQL = process.env.PSQL_BIN || 'psql';
const VERSION_RE = /^[0-9]{4}_[a-z0-9_]+$/;

function fail(message) {
  console.error(`DB_MIGRATE_FAIL: ${message}`);
  process.exitCode = 1;
  process.exit(1);
}

function psqlArgs(extra) {
  return ['-X', '-w', '-v', 'ON_ERROR_STOP=1', ...extra];
}

function runSql(sql) {
  const result = spawnSync(PSQL, psqlArgs(['-tA', '-c', sql]), { encoding: 'utf8' });
  if (result.error) fail(`${PSQL} could not start: ${result.error.message}`);
  if (result.status !== 0) fail((result.stderr || result.stdout || 'psql failed').trim());
  return (result.stdout || '').trim();
}

function runFile(file) {
  const result = spawnSync(PSQL, psqlArgs(['-f', file]), { encoding: 'utf8' });
  if (result.error) fail(`${PSQL} could not start: ${result.error.message}`);
  if (result.status !== 0) fail(`${file}: ${(result.stderr || result.stdout || 'psql failed').trim()}`);
}

function checksum(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
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

function migrationFiles() {
  if (!existsSync(MIGRATIONS_DIR)) fail(`missing ${MIGRATIONS_DIR}`);
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql') && !name.endsWith('.down.sql'))
    .sort();
}

function versionOf(file) {
  const version = basename(file, '.sql');
  if (!VERSION_RE.test(version)) fail(`invalid migration name: ${file}`);
  return version;
}

function up() {
  ensureMigrationsTable();
  const done = applied();
  for (const name of migrationFiles()) {
    const version = versionOf(name);
    const file = join(MIGRATIONS_DIR, name);
    const sum = checksum(file);
    if (done.has(version)) {
      if (done.get(version) !== sum) fail(`checksum mismatch for applied migration ${version}`);
      console.info(`SKIP ${version} (already applied)`);
      continue;
    }
    console.info(`APPLY ${version}`);
    runFile(file);
    runSql(`INSERT INTO schema_migrations (version, checksum) VALUES ('${version}', '${sum}');`);
  }
}

function down(version) {
  if (!version || !VERSION_RE.test(version)) fail('usage: db-migrate down <version>');
  const file = join(MIGRATIONS_DIR, `${version}.down.sql`);
  if (!existsSync(file)) fail(`missing down migration: ${file}`);
  const done = applied();
  if (!done.has(version)) fail(`migration not applied: ${version}`);
  console.info(`ROLLBACK ${version}`);
  runFile(file);
  runSql(`DELETE FROM schema_migrations WHERE version = '${version}';`);
}

function seed() {
  if (!existsSync(SEED_FILE)) fail(`missing seed: ${SEED_FILE}`);
  console.info('SEED synthetic data');
  runFile(SEED_FILE);
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
  else if (command === 'seed') seed();
  else if (command === 'status') status();
  else fail(`unknown command: ${command}`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
