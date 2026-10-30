import pg from 'pg';

const { Pool } = pg;
let pool = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.KOROS_DATABASE_URL);
}

export function getPool() {
  if (!isDatabaseConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.KOROS_DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on('error', () => {
      // A background pool error must never crash the local server; callers
      // receive a normal query failure and fail closed.
    });
  }
  return pool;
}

export async function closePool() {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}

function databaseUnavailable() {
  const error = new Error('database_unavailable');
  error.code = 'DATABASE_UNAVAILABLE';
  return error;
}

export async function queryAsApp(text, params = []) {
  const current = getPool();
  if (!current) throw databaseUnavailable();
  return current.query(text, params);
}

export async function withTenant(tenantId, callback) {
  const current = getPool();
  if (!current) throw databaseUnavailable();
  const client = await current.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original failure.
    }
    throw error;
  } finally {
    client.release();
  }
}
