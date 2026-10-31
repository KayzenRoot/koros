import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { hashPassword } from '../src/auth/password.mjs';
import { validateLocalEnvironment } from './local-env-policy.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA_ROOT = resolve(ROOT, process.env.KOROS_LOCAL_DATA_DIR || join('.koros', 'local'));
const PGDATA = join(DATA_ROOT, 'pg');
const LOG_FILE = join(DATA_ROOT, 'postgres.log');
const STATE_FILE = join(DATA_ROOT, 'state.json');
const CREDENTIALS_FILE = join(DATA_ROOT, 'credentials.json');
const DB_NAME = 'koros_local';

function fail(message) {
  console.error(`LOCAL_ENV_FAIL: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function assertInsideWorkspace() {
  const rel = relative(ROOT, DATA_ROOT);
  if (!rel || rel.startsWith('..') || resolve(ROOT, rel) !== DATA_ROOT) {
    fail('data directory must stay inside the workspace');
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
      initdb: join(dir, 'initdb'),
      pgCtl: join(dir, 'pg_ctl'),
      createdb: join(dir, 'createdb'),
      psql: join(dir, 'psql'),
      pgIsReady: join(dir, 'pg_isready'),
    };
    if (Object.values(paths).every((path) => existsSync(path) || existsSync(`${path}.exe`))) {
      return paths;
    }
  }
  fail('PostgreSQL 17 binaries not found; set KOROS_PG_BIN');
}

function run(bin, args, env, allowAlreadyExists = false, stdio = ['ignore', 'pipe', 'pipe']) {
  const result = spawnSync(bin, args, {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    stdio,
  });
  if (result.error) fail(`${bin} could not start: ${result.error.message}`);
  if (result.status !== 0) {
    const output = `${result.stderr || result.stdout || ''}`.trim();
    if (allowAlreadyExists && /already exists/i.test(output)) return;
    fail(`${bin} failed: ${output || `exit ${result.status}`}`);
  }
}

function runNode(script, args, env) {
  run(process.execPath, [join(ROOT, 'scripts', script), ...args], env);
}

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function saveState(state) {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function databaseEnv(port, pgBin) {
  return {
    ...process.env,
    PGHOST: '127.0.0.1',
    PGPORT: String(port),
    PGUSER: 'postgres',
    PGDATABASE: DB_NAME,
    PSQL_BIN: pgBin.psql,
  };
}

function appEnv(port, databasePort) {
  const inherited = {};
  for (const key of ['PATH', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'ComSpec']) {
    if (process.env[key]) inherited[key] = process.env[key];
  }
  return {
    ...inherited,
    NODE_ENV: 'development',
    KOROS_LOCAL_ENV: '1',
    KOROS_PORT: String(port),
    KOROS_DATABASE_URL: `postgres://koros_app@127.0.0.1:${databasePort}/${DB_NAME}`,
    KOROS_WEBHOOK_SECRET_A: 'local-webhook-fixture-a',
    KOROS_WEBHOOK_SECRET_B: 'local-webhook-fixture-b',
  };
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForDatabase(pgBin, port) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = spawnSync(pgBin.pgIsReady, ['-h', '127.0.0.1', '-p', String(port)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status === 0) return;
    sleep(100);
  }
  fail('PostgreSQL did not become ready');
}

async function waitForApp(port, attempt = 0) {
  if (attempt >= 150) fail('local app did not become healthy');
  try {
    const response = await fetch(`http://127.0.0.1:${port}/healthz`);
    if (response.ok) {
      const body = await response.json();
      if (body.status === 'ok') return;
    }
  } catch {
    // Keep polling until the timeout.
  }
  sleep(100);
  await waitForApp(port, attempt + 1);
}

async function provisionCredentials(databaseUrl) {
  if (existsSync(CREDENTIALS_FILE)) return;
  const password = randomBytes(18).toString('base64url');
  const passwordHash = await hashPassword(password);
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      `UPDATE users SET password_hash = $1
        WHERE email_normalized IN ('owner-a@example.invalid', 'owner-b@example.invalid')`,
      [passwordHash],
    );
  } finally {
    await client.end();
  }
  writeFileSync(
    CREDENTIALS_FILE,
    `${JSON.stringify({
      emailA: 'owner-a@example.invalid',
      emailB: 'owner-b@example.invalid',
      password,
      note: 'Synthetic local-only credential; never use outside this workspace.',
    }, null, 2)}\n`,
    { mode: 0o600 },
  );
}

async function start() {
  assertInsideWorkspace();
  const policy = validateLocalEnvironment(process.env);
  if (!policy.ok) fail(`unsafe local environment: ${policy.errors.join(', ')}`);
  const pgBin = pgBinaries();
  const state = readState();
  if (state) {
    try {
      await waitForApp(state.appPort);
      console.info(`LOCAL_ENV_RUNNING app=http://127.0.0.1:${state.appPort} db=127.0.0.1:${state.databasePort}`);
      return;
    } catch {
      fail('stale local state; run npm run local:stop before starting again');
    }
  }

  mkdirSync(DATA_ROOT, { recursive: true });
  mkdirSync(PGDATA, { recursive: true });
  if (!existsSync(join(PGDATA, 'PG_VERSION'))) {
    console.info('LOCAL_ENV_STAGE initdb');
    run(pgBin.initdb, ['-D', PGDATA, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], process.env);
  }
  console.info('LOCAL_ENV_STAGE postgres');
  run(
    pgBin.pgCtl,
    ['-D', PGDATA, '-l', LOG_FILE, '-o', `-p ${policy.databasePort} -h 127.0.0.1`, '-w', 'start'],
    process.env,
    false,
    'ignore',
  );
  waitForDatabase(pgBin, policy.databasePort);

  const env = databaseEnv(policy.databasePort, pgBin);
  console.info('LOCAL_ENV_STAGE database');
  run(pgBin.createdb, ['-h', '127.0.0.1', '-p', String(policy.databasePort), '-U', 'postgres', DB_NAME], env, true);
  run(
    pgBin.psql,
    ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', String(policy.databasePort), '-U', 'postgres', '-d', DB_NAME, '-f', join(ROOT, 'db', 'bootstrap', 'test-role.sql')],
    env,
  );
  console.info('LOCAL_ENV_STAGE migrations');
  runNode('db-migrate.mjs', ['up'], env);
  runNode('db-migrate.mjs', ['seed'], env);

  const databaseUrl = `postgres://koros_app@127.0.0.1:${policy.databasePort}/${DB_NAME}`;
  console.info('LOCAL_ENV_STAGE credentials');
  await provisionCredentials(databaseUrl);

  console.info('LOCAL_ENV_STAGE app');
  const child = spawn(process.execPath, [join(ROOT, 'src', 'main.mjs')], {
    cwd: ROOT,
    env: appEnv(policy.appPort, policy.databasePort),
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  await waitForApp(policy.appPort);
  saveState({
    databasePort: policy.databasePort,
    appPort: policy.appPort,
    appPid: child.pid,
    dataDir: DATA_ROOT,
    startedAt: new Date().toISOString(),
  });
  console.info(`LOCAL_ENV_STARTED app=http://127.0.0.1:${policy.appPort} db=127.0.0.1:${policy.databasePort}`);
  console.info(`LOCAL_ENV_CREDENTIALS ${CREDENTIALS_FILE}`);
}

function stop() {
  assertInsideWorkspace();
  const state = readState();
  const pgBin = pgBinaries();
  if (state?.appPid) {
    try {
      process.kill(state.appPid);
    } catch {
      // Already exited.
    }
  }
  if (existsSync(join(PGDATA, 'PG_VERSION'))) {
    spawnSync(pgBin.pgCtl, ['-D', PGDATA, '-m', 'fast', '-w', 'stop'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  if (existsSync(STATE_FILE)) rmSync(STATE_FILE, { force: true });
  console.info('LOCAL_ENV_STOPPED');
}

async function status() {
  const state = readState();
  if (!state) {
    console.info('LOCAL_ENV_STATUS stopped');
    process.exitCode = 1;
    return;
  }
  let healthy = false;
  try {
    await waitForApp(state.appPort);
    healthy = true;
  } catch {
    healthy = false;
  }
  console.info(JSON.stringify({
    status: healthy ? 'running' : 'degraded',
    app: `http://127.0.0.1:${state.appPort}`,
    database: `127.0.0.1:${state.databasePort}`,
    credentials: CREDENTIALS_FILE,
    healthy,
  }));
  if (!healthy) process.exitCode = 1;
}

async function main() {
  switch (process.argv[2]) {
    case 'start':
      await start();
      break;
    case 'stop':
      stop();
      break;
    case 'restart':
      stop();
      await start();
      break;
    case 'status':
      await status();
      break;
    default:
      fail('usage: node scripts/local-env.mjs start|stop|restart|status');
  }
}

try {
  await main();
} catch {
  process.exitCode = process.exitCode || 1;
}
