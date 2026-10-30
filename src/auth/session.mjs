import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'koros_session';
export const CSRF_COOKIE = 'koros_csrf';
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function parseCookies(header) {
  const cookies = new Map();
  if (typeof header !== 'string' || header.length === 0) return cookies;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name && value) cookies.set(name, value);
  }
  return cookies;
}

export function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`, 'Path=/', 'SameSite=Lax'];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (Number.isInteger(options.maxAge)) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

export function sessionCookie(token, options = {}) {
  return serializeCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: Boolean(options.secure),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function csrfCookie(token, options = {}) {
  return serializeCookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: Boolean(options.secure),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearCookie(name, options = {}) {
  return serializeCookie(name, '', {
    httpOnly: Boolean(options.httpOnly),
    secure: Boolean(options.secure),
    maxAge: 0,
  });
}

export function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
