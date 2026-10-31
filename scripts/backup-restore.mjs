import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { BACKUP_FORMAT_VERSION, DEFAULT_RETENTION } from './backup-constants.mjs';
import {
  BackupError,
  assertSnapshotMatches,
  decryptSnapshot,
  encryptSnapshot,
  parseBackupKey,
  validateSnapshotMetadata,
} from './backup-format.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BACKUP_DIR = resolve(ROOT, process.env.KOROS_BACKUP_DIR || join('.koros', 'backups'));
const KEY = process.env.KOROS_BACKUP_KEY
  || (process.env.KOROS_BACKUP_KEY_FILE ? readFileSync(process.env.KOROS_BACKUP_KEY_FILE, 'utf8').trim() : '');
const RETENTION = Number(process.env.KOROS_BACKUP_RETENTION || DEFAULT_RETENTION);

function fail(error) {
  const code = error instanceof BackupError ? error.code : 'BACKUP_FAILED';
  console.error(`BACKUP_FAILED: ${code}`);
  process.exit(1);
}

function assertInsideWorkspace(path) {
  const rel = relative(ROOT, path);
  if (!rel || rel.startsWith('..') || resolve(ROOT, rel) !== path) {
    throw new BackupError('INVALID_INPUT');
  }
}

function pgBinaries() {
  const candidates = process.env.KOROS_PG_BIN
    ? [process.env.KOROS_PG_BIN]
    : process.platform === 'win32'
      ? [join(process.env.ProgramFiles || 'C:\\Program Files', 'PostgreSQL', '17', 'bin')]
      : ['/usr/lib/postgresql/17/bin', '/usr/bin'];
  for (const dir of candidates) {
    const paths = {
      pgDump: join(dir, 'pg_dump'),
      psql: join(dir, 'psql'),
      createdb: join(dir, 'createdb'),
      dropdb: join(dir, 'dropdb'),
    };
    if (Object.values(paths).every((path) => existsSync(path) || existsSync(`${path}.exe`))) {
      return paths;
    }
  }
  throw new BackupError('INVALID_INPUT');
}

function databaseEnv() {
  const raw = process.env.KOROS_BACKUP_DATABASE_URL;
  if (!raw) throw new BackupError('INVALID_INPUT');
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new BackupError('INVALID_INPUT');
  }
  if (url.protocol !== 'postgres:' || !url.hostname || !url.pathname || url.pathname === '/') {
    throw new BackupError('INVALID_INPUT');
  }
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username || 'postgres'),
    PGPASSWORD: decodeURIComponent(url.password || ''),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  };
}

function run(bin, args, env, input = undefined) {
  const result = spawnSync(bin, args, {
    cwd: ROOT,
    env,
    input,
    encoding: input === undefined ? 'utf8' : undefined,
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.error) throw new BackupError('BACKUP_FAILED');
  if (result.status !== 0) throw new BackupError('BACKUP_FAILED');
  return result.stdout;
}

function psqlLines(psql, env, database, sql) {
  const output = run(
    psql,
    ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-h', env.PGHOST, '-p', env.PGPORT, '-U', env.PGUSER, '-d', database, '-tA', '-c', sql],
    env,
  );
  return `${output}`.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function metadataFor(psql, env, database, createdAt) {
  const migrations = psqlLines(
    psql,
    env,
    database,
    'SELECT version || \'|\' || checksum FROM schema_migrations ORDER BY version;',
  ).map((line) => {
    const [version, checksum] = line.split('|');
    return { version, checksum };
  });
  const tenantIds = psqlLines(psql, env, database, 'SELECT tenant_id FROM organizations ORDER BY tenant_id;');
  const countsLine = psqlLines(
    psql,
    env,
    database,
    `SELECT json_build_object(
       'organizations', (SELECT count(*) FROM organizations),
       'users', (SELECT count(*) FROM users),
       'memberships', (SELECT count(*) FROM memberships),
       'runs', (SELECT count(*) FROM runs),
       'approvals', (SELECT count(*) FROM approvals),
       'workflow_templates', (SELECT count(*) FROM workflow_templates),
       'onboarding_sessions', (SELECT count(*) FROM onboarding_sessions)
     )::text;`,
  )[0];
  return validateSnapshotMetadata({
    format_version: BACKUP_FORMAT_VERSION,
    created_at: createdAt,
    database,
    tenant_ids: tenantIds,
    migrations,
    row_counts: JSON.parse(countsLine),
  });
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (item.startsWith('--') && args[index + 1]) {
      parsed[item.slice(2)] = args[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function snapshotFiles() {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR)
    .filter((name) => name.endsWith('.korosbackup'))
    .map((name) => {
      const path = join(BACKUP_DIR, name);
      const stat = statSync(path);
      return { path, name, size: stat.size, modified: stat.mtimeMs };
    })
    .sort((a, b) => b.modified - a.modified);
}

function backup() {
  assertInsideWorkspace(BACKUP_DIR);
  if (!Number.isInteger(RETENTION) || RETENTION < 1 || RETENTION > 100) {
    throw new BackupError('INVALID_INPUT');
  }
  const key = parseBackupKey(KEY);
  const pgBin = pgBinaries();
  const env = databaseEnv();
  const createdAt = new Date().toISOString();
  const metadata = metadataFor(pgBin.psql, env, env.PGDATABASE, createdAt);
  const dump = run(
    pgBin.pgDump,
    ['--format=plain', '--no-owner', '--no-privileges', '--clean', '--if-exists'],
    env,
  );
  const encrypted = encryptSnapshot({ metadata, sql: `${dump}`, key });
  mkdirSync(BACKUP_DIR, { recursive: true });
  const filename = `koros-${createdAt.replace(/[:.]/g, '-')}-${randomBytes(4).toString('hex')}.korosbackup`;
  const path = join(BACKUP_DIR, filename);
  writeFileSync(path, encrypted, { mode: 0o600 });
  for (const old of snapshotFiles().slice(RETENTION)) rmSync(old.path, { force: true });
  console.info(JSON.stringify({
    status: 'backed_up',
    snapshot: path,
    format_version: metadata.format_version,
    tenants: metadata.tenant_ids.length,
    migrations: metadata.migrations.length,
    row_counts: metadata.row_counts,
    retention: RETENTION,
  }, null, 2));
}

function loadSnapshot(path) {
  const key = parseBackupKey(KEY);
  const snapshot = decryptSnapshot(readFileSync(path), key);
  return { key, snapshot };
}

function verify() {
  const args = parseArgs(process.argv.slice(3));
  if (!args.snapshot) throw new BackupError('INVALID_INPUT');
  const { snapshot } = loadSnapshot(args.snapshot);
  console.info(JSON.stringify({
    status: 'verified',
    format_version: snapshot.metadata.format_version,
    created_at: snapshot.metadata.created_at,
    tenants: snapshot.metadata.tenant_ids.length,
    migrations: snapshot.metadata.migrations.length,
    row_counts: snapshot.metadata.row_counts,
  }, null, 2));
}

function restore() {
  if (process.env.KOROS_ALLOW_RESTORE !== '1') throw new BackupError('RESTORE_DISABLED');
  assertInsideWorkspace(BACKUP_DIR);
  const args = parseArgs(process.argv.slice(3));
  if (!args.snapshot || !args['target-db']) throw new BackupError('INVALID_INPUT');
  if (!/^koros_restore_[a-z0-9_]{1,40}$/.test(args['target-db'])) throw new BackupError('INVALID_INPUT');
  const expectTenant = args['expect-tenant'];
  const { snapshot } = loadSnapshot(args.snapshot);
  if (expectTenant && !snapshot.metadata.tenant_ids.includes(expectTenant)) {
    throw new BackupError('TENANT_MISMATCH');
  }
  const pgBin = pgBinaries();
  const env = databaseEnv();
  const target = args['target-db'];
  let created = false;
  try {
    run(pgBin.createdb, ['-h', env.PGHOST, '-p', env.PGPORT, '-U', env.PGUSER, target], env);
    created = true;
    run(
      pgBin.psql,
      ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-h', env.PGHOST, '-p', env.PGPORT, '-U', env.PGUSER, '-d', target, '-f', '-'],
      env,
      snapshot.sql,
    );
    const restoredMetadata = metadataFor(pgBin.psql, env, target, snapshot.metadata.created_at);
    assertSnapshotMatches({ metadata: snapshot.metadata, current: restoredMetadata });
    console.info(JSON.stringify({
      status: 'restored',
      target_db: target,
      tenants: restoredMetadata.tenant_ids.length,
      migrations: restoredMetadata.migrations.length,
      row_counts: restoredMetadata.row_counts,
    }, null, 2));
  } catch (error) {
    if (created) {
      spawnSync(pgBin.dropdb, ['-h', env.PGHOST, '-p', env.PGPORT, '-U', env.PGUSER, '--if-exists', target], {
        env,
        stdio: 'ignore',
      });
    }
    throw error;
  }
}

function list() {
  assertInsideWorkspace(BACKUP_DIR);
  console.info(JSON.stringify({
    backup_dir: BACKUP_DIR,
    snapshots: snapshotFiles().map((item) => ({ name: item.name, size: item.size, modified: new Date(item.modified).toISOString() })),
  }, null, 2));
}

try {
  switch (process.argv[2]) {
    case 'backup':
      backup();
      break;
    case 'verify':
      verify();
      break;
    case 'restore':
      restore();
      break;
    case 'list':
      list();
      break;
    default:
      throw new BackupError('INVALID_INPUT');
  }
} catch (error) {
  fail(error);
}
