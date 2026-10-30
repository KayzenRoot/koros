import { getPool, withTenant } from '../db.mjs';
import { DUMMY_HASH, normalizeEmail, verifyPassword } from './password.mjs';
import { createSessionToken, hashToken } from './session.mjs';
import { hasPermission } from './rbac.mjs';

export class AuthError extends Error {
  constructor(status, code) {
    super(code);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

const SESSION_TTL_HOURS = 8;
const MAX_LOGIN_FAILURES = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map();

function databaseUnavailable() {
  return new AuthError(503, 'auth_unavailable');
}

export function resetLoginRateLimit() {
  failures.clear();
}

function rateKey(email, ip) {
  return `${email}|${ip}`;
}

function isAllowed(key) {
  const entry = failures.get(key);
  if (!entry) return true;
  if (Date.now() >= entry.resetAt) {
    failures.delete(key);
    return true;
  }
  return entry.count < MAX_LOGIN_FAILURES;
}

function recordFailure(key) {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || now >= entry.resetAt) {
    failures.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function login(email, password, ip = 'unknown') {
  const normalized = normalizeEmail(email);
  const key = rateKey(normalized || 'invalid', ip);
  if (!normalized || typeof password !== 'string' || password.length < 12 || password.length > 200 || !isAllowed(key)) {
    throw new AuthError(401, 'invalid_credentials');
  }

  const pool = getPool();
  if (!pool) throw databaseUnavailable();

  let row;
  try {
    const result = await pool.query('SELECT * FROM auth_lookup($1)', [normalized]);
    row = result.rows[0];
  } catch {
    throw databaseUnavailable();
  }

  const valid = row
    ? await verifyPassword(password, row.password_hash)
    : await verifyPassword(password, DUMMY_HASH);
  if (!row || !valid) {
    recordFailure(key);
    throw new AuthError(401, 'invalid_credentials');
  }
  failures.delete(key);

  const token = createSessionToken();
  const csrfToken = createSessionToken();
  try {
    const sessionId = await withTenant(row.tenant_id, async (client) => {
      const result = await client.query(
        "INSERT INTO sessions (tenant_id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, now() + ($4 * interval '1 hour')) RETURNING session_id",
        [row.tenant_id, row.user_id, hashToken(token), SESSION_TTL_HOURS],
      );
      const id = result.rows[0].session_id;
      await client.query(
        'INSERT INTO audit_events (tenant_id, actor_user_id, action, entity, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
        [row.tenant_id, row.user_id, 'AUTH_LOGIN', 'session', id, { role: row.role }],
      );
      return id;
    });
    return { sessionId, token, csrfToken, userId: row.user_id, tenantId: row.tenant_id, role: row.role, email: normalized };
  } catch {
    throw databaseUnavailable();
  }
}

export async function getSession(token) {
  if (typeof token !== 'string' || token.length === 0) return null;
  const pool = getPool();
  if (!pool) throw databaseUnavailable();
  let row;
  try {
    const result = await pool.query('SELECT * FROM auth_session_lookup($1)', [hashToken(token)]);
    row = result.rows[0];
  } catch {
    throw databaseUnavailable();
  }
  if (!row) return null;
  if (row.revoked_at !== null) return null;
  if (row.user_status !== 'ACTIVE' || row.membership_status !== 'ACTIVE') return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  return {
    sessionId: row.session_id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    role: row.role,
  };
}

export async function logout(token) {
  const session = await getSession(token);
  if (!session) return false;
  try {
    await withTenant(session.tenantId, async (client) => {
      await client.query('UPDATE sessions SET revoked_at = now() WHERE session_id = $1 AND revoked_at IS NULL', [session.sessionId]);
      await client.query(
        'INSERT INTO audit_events (tenant_id, actor_user_id, action, entity, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
        [session.tenantId, session.userId, 'AUTH_LOGOUT', 'session', session.sessionId, {}],
      );
    });
  } catch {
    throw databaseUnavailable();
  }
  return true;
}

export function requirePermission(session, permission) {
  if (!session) throw new AuthError(401, 'unauthorized');
  if (!hasPermission(session.role, permission)) throw new AuthError(403, 'forbidden');
}

export async function getTenantContext(session) {
  return withTenant(session.tenantId, async (client) => {
    const result = await client.query("SELECT current_setting('app.tenant_id', true) AS tenant_id");
    return result.rows[0].tenant_id;
  });
}
