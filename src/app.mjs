import { createServer } from 'node:http';
import { PUBLIC_CONFIG, VERSION, parsePort } from './config.mjs';
import { AuthError, getSession, getTenantContext, login, logout, requirePermission } from './auth/service.mjs';
import { IngestionError } from './ingestion/errors.mjs';
import { ingestLead } from './ingestion/service.mjs';
import { ApprovalError } from './approval/errors.mjs';
import { decideApprovalByActorInTenant, listApprovals } from './approval/service.mjs';
import { TemplateError } from './templates/errors.mjs';
import {
  createTemplateVersionInTenant,
  listTemplates,
  previewTemplate,
} from './templates/service.mjs';
import { DASHBOARD_ASSETS } from './dashboard/assets.mjs';
import { dashboardPage, loginPage } from './dashboard/pages.mjs';
import { getDashboardSummary } from './dashboard/service.mjs';
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

const HTML_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

function sendHtml(res, body) {
  res.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': HTML_CSP,
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendAsset(res, asset) {
  res.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': asset.contentType,
    'Content-Security-Policy': "default-src 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(asset.body),
  });
  res.end(asset.body);
}

function redirect(res, location) {
  res.writeHead(302, {
    Location: location,
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'",
    'X-Content-Type-Options': 'nosniff',
  });
  res.end();
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

async function readRawBody(req, limit = 16 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new IngestionError(413, 'payload_too_large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function headerValue(req, name) {
  const value = req.headers[name];
  return typeof value === 'string' ? value : '';
}

async function handleWebhook(req, res) {
  const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new IngestionError(415, 'unsupported_media_type');
  const rawBody = await readRawBody(req);
  const result = await ingestLead({
    tenantId: headerValue(req, 'x-koros-tenant'),
    provider: headerValue(req, 'x-koros-provider'),
    account: headerValue(req, 'x-koros-account'),
    timestamp: headerValue(req, 'x-koros-timestamp'),
    signature: headerValue(req, 'x-koros-signature'),
    rawBody,
  });
  reply(res, result.status === 'accepted' ? 202 : 200, {
    status: result.status,
    eventId: result.eventId,
    leadId: result.leadId,
    tenantId: result.tenantId,
  });
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

const APPROVAL_HTTP_STATUS = Object.freeze({
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  FORGED_APPROVAL: 403,
  NOT_FOUND: 404,
  INVALID_STATE: 409,
  ALREADY_DECIDED: 409,
  NOT_APPROVED: 409,
  NOT_REVOCABLE: 409,
  APPROVAL_IN_USE: 409,
  PAYLOAD_MISMATCH: 409,
  IDEMPOTENCY_CONFLICT: 409,
  APPROVAL_EXPIRED: 410,
});

function approvalHttpStatus(code) {
  return APPROVAL_HTTP_STATUS[code] ?? 500;
}

const TEMPLATE_HTTP_STATUS = Object.freeze({
  INVALID_TEMPLATE: 400,
  UNKNOWN_FIELD: 400,
  SECRET_FIELD: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_FIELD: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
});

function templateHttpStatus(code) {
  return TEMPLATE_HTTP_STATUS[code] ?? 500;
}

async function handleDashboardSummary(req, res) {
  const { session } = await getSessionOrThrow(req);
  requirePermission(session, 'session:read');
  const summary = await getDashboardSummary({
    tenantId: session.tenantId,
    role: session.role,
  });
  reply(res, 200, summary);
}

async function handleApprovals(req, res) {
  const { session } = await getSessionOrThrow(req);
  requirePermission(session, 'approval:decide');
  const result = await listApprovals({ tenantId: session.tenantId });
  reply(res, 200, result);
}

async function handleApprovalDecision(req, res, approvalId) {
  const { session, cookies } = await getSessionOrThrow(req);
  requireCsrf(req, cookies);
  requirePermission(session, 'approval:decide');
  const body = await readJson(req);
  const result = await decideApprovalByActorInTenant({
    tenantId: session.tenantId,
    approvalId,
    actorUserId: session.userId,
    decision: body.decision,
  });
  reply(res, 200, {
    status: result.status,
    approvalId,
    decision: result.approval.decision,
  });
}

async function handleTemplates(req, res) {
  const { session } = await getSessionOrThrow(req);
  requirePermission(session, 'session:read');
  const templates = await listTemplates({ tenantId: session.tenantId });
  reply(res, 200, { templates });
}

async function handleTemplatePreview(req, res, templateId) {
  const { session, cookies } = await getSessionOrThrow(req);
  requireCsrf(req, cookies);
  requirePermission(session, 'session:read');
  const body = await readJson(req);
  const result = await previewTemplate({
    tenantId: session.tenantId,
    templateId,
    lead: body.lead,
  });
  reply(res, 200, result);
}

async function handleTemplateVersion(req, res, templateId) {
  const { session, cookies } = await getSessionOrThrow(req);
  requireCsrf(req, cookies);
  requirePermission(session, 'tenant:configure');
  const body = await readJson(req);
  const result = await createTemplateVersionInTenant({
    tenantId: session.tenantId,
    templateId,
    actorUserId: session.userId,
    config: body.config,
  });
  reply(res, 201, {
    template_version_id: result.version.template_version_id,
    version: result.version.version,
    breaking: result.breaking,
    invalidatedApprovals: result.invalidatedApprovals,
  });
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
    if (req.method === 'POST' && pathname === '/v1/webhooks/leads') {
      await handleWebhook(req, res);
      return;
    }
    const approvalDecisionPath = pathname.match(/^\/v1\/approvals\/([0-9a-fA-F-]{36})\/decision$/);
    if (req.method === 'POST' && approvalDecisionPath) {
      await handleApprovalDecision(req, res, approvalDecisionPath[1]);
      return;
    }
    const templatePreviewPath = pathname.match(/^\/v1\/templates\/([0-9a-fA-F-]{36})\/preview$/);
    if (req.method === 'POST' && templatePreviewPath) {
      await handleTemplatePreview(req, res, templatePreviewPath[1]);
      return;
    }
    const templateVersionPath = pathname.match(/^\/v1\/templates\/([0-9a-fA-F-]{36})\/versions$/);
    if (req.method === 'POST' && templateVersionPath) {
      await handleTemplateVersion(req, res, templateVersionPath[1]);
      return;
    }
    if (req.method === 'GET' && pathname === '/v1/auth/session') {
      await handleSession(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/v1/templates') {
      await handleTemplates(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/v1/approvals') {
      await handleApprovals(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/v1/dashboard/summary') {
      await handleDashboardSummary(req, res);
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
    if (req.method === 'GET' && pathname === '/') {
      redirect(res, '/login');
      return;
    }
    if (req.method === 'GET' && pathname === '/login') {
      sendHtml(res, loginPage());
      return;
    }
    if (req.method === 'GET' && pathname === '/dashboard') {
      sendHtml(res, dashboardPage());
      return;
    }
    if (req.method === 'GET' && Object.hasOwn(DASHBOARD_ASSETS, pathname)) {
      sendAsset(res, DASHBOARD_ASSETS[pathname]);
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
    if (error instanceof AuthError || error instanceof IngestionError) {
      reply(res, error.status, { error: error.code });
      return;
    }
    if (error instanceof ApprovalError) {
      reply(res, approvalHttpStatus(error.code), { error: error.code });
      return;
    }
    if (error instanceof TemplateError) {
      reply(res, templateHttpStatus(error.code), { error: error.code });
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
