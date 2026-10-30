import { createServer } from 'node:http';
import { PUBLIC_CONFIG, VERSION, parsePort } from './config.mjs';
import { AuthError, getSession, getTenantContext, login, logout, requirePermission } from './auth/service.mjs';
import {
  clearCookie,
  csrfCookie,
  CSRF_COOKIE,
  parseCookies,
  safeEqual,
  sessionCookie,
  SESSION_COOKIE,
} from './auth/session.mjs';

const HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'",
  'X-Content-Type-Options': 'nosniff',
});

function reply(res, status, object, extraHeaders = {}) {
  const body = JSON.stringify(object);
  res.writeHead(status, {
    ...HEADERS,
    ...extraHeaders,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function secureCookies() {
  return process.env.KOROS_SECURE_COOKIES === '1';
}

async function readJson(req, limit = 8192) {
  const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new AuthError(415, 'unsupported_media_type');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new AuthError(413, 'payload_too_large');
    chunks.push(chunk);
  }
  if (size === 0) throw new AuthError(400, 'invalid_json');
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not_object');
    return parsed;
  } catch {
    throw new AuthError(400, 'invalid_json');
  }
}

function requireCsrf(req, cookies) {
  const header = req.headers['x-csrf-token'];
  const cookie = cookies.get(CSRF_COOKIE);
  if (typeof header !== 'string' || !safeEqual(header, cookie)) throw new AuthError(403, 'csrf_failed');
}

async function getSessionOrThrow(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.get(SESSION_COOKIE);
  if (!token) throw new AuthError(401, 'unauthorized');
  const session = await getSession(token);
  if (!session) throw new AuthError(401, 'unauthorized');
  return { session, cookies, token };
}

async function handleLogin(req, res) {
  const body = await readJson(req);
  const result = await login(body.email, body.password, req.socket.remoteAddress || 'unknown');
  const secure = secureCookies();
  reply(
    res,
    200,
    {
      user: { id: result.userId, email: result.email },
      tenant: { id: result.tenantId },
      role: result.role,
      csrfToken: result.csrfToken,
    },
    {
      'Set-Cookie': [
        sessionCookie(result.token, { secure }),
        csrfCookie(result.csrfToken, { secure }),
      ],
    },
  );
}

async function handleLogout(req, res) {
  const { cookies } = await getSessionOrThrow(req);
  requireCsrf(req, cookies);
  await logout(cookies.get(SESSION_COOKIE));
  const secure = secureCookies();
  reply(res, 200, { ok: true }, {
    'Set-Cookie': [
      clearCookie(SESSION_COOKIE, { httpOnly: true, secure }),
      clearCookie(CSRF_COOKIE, { httpOnly: false, secure }),
    ],
  });
}

async function handleSession(req, res) {
  const { session } = await getSessionOrThrow(req);
  reply(res, 200, {
    user: { id: session.userId },
    tenant: { id: session.tenantId },
    role: session.role,
  });
}

async function handleProtected(req, res, permission) {
  const { session } = await getSessionOrThrow(req);
  requirePermission(session, permission);
  const tenantId = await getTenantContext(session);
  reply(res, 200, { ok: true, tenantId, role: session.role, permission });
}

export async function handleRequest(req, res) {
  const target = typeof req.url === 'string' ? req.url : '';
  const pathname = target.split('?', 1)[0];
  try {
    if (req.method === 'POST' && pathname === '/v1/auth/login') {
      await handleLogin(req, res);
      return;
    }
    if (req.method === 'POST' && pathname === '/v1/auth/logout') {
      await handleLogout(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/v1/auth/session') {
      await handleSession(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/v1/protected/ping') {
      await handleProtected(req, res, 'session:read');
      return;
    }
    if (req.method === 'GET' && pathname === '/v1/protected/approval') {
      await handleProtected(req, res, 'approval:decide');
      return;
    }
    if (req.method !== 'GET') {
      reply(res, 405, { error: 'method_not_allowed' });
      return;
    }
    if (pathname === '/healthz') {
      reply(res, 200, { status: 'ok' });
      return;
    }
    if (pathname === '/version') {
      reply(res, 200, { version: VERSION });
      return;
    }
    if (pathname === '/config') {
      reply(res, 200, PUBLIC_CONFIG);
      return;
    }
    reply(res, 404, { error: 'not_found' });
  } catch (error) {
    if (error instanceof AuthError) {
      reply(res, error.status, { error: error.code });
      return;
    }
    reply(res, 500, { error: 'internal_error' });
  }
}

/** Always binds loopback. Caller cannot provide another host. */
export function startLocalServer(port = 0) {
  const validPort = parsePort(port);
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      handleRequest(req, res).catch(() => {
        if (!res.headersSent) reply(res, 500, { error: 'internal_error' });
        else res.destroy();
      });
    });
    const onStartupError = (error) => reject(error);
    server.once('error', onStartupError);
    server.listen(validPort, '127.0.0.1', () => {
      server.off('error', onStartupError);
      resolve(server);
    });
  });
}
