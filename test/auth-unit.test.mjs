import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUMMY_HASH, hashPassword, normalizeEmail, verifyPassword } from '../src/auth/password.mjs';
import { hasPermission, isRole } from '../src/auth/rbac.mjs';
import {
  createSessionToken,
  hashToken,
  parseCookies,
  safeEqual,
  serializeCookie,
} from '../src/auth/session.mjs';

test('password hashes are scrypt and verify only the correct password', async () => {
  const hash = await hashPassword('SyntheticPassw0rd!');
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword('SyntheticPassw0rd!', hash), true);
  assert.equal(await verifyPassword('WrongPassword123!', hash), false);
  assert.equal(await verifyPassword('SyntheticPassw0rd!', DUMMY_HASH), false);
  assert.equal(await verifyPassword('SyntheticPassw0rd!', 'invalid-hash'), false);
  assert.equal(await verifyPassword('short', hash), false);
});

test('email normalization rejects malformed values', () => {
  assert.equal(normalizeEmail('  Owner-A@Example.INVALID '), 'owner-a@example.invalid');
  assert.equal(normalizeEmail('a@b'), 'a@b');
  for (const value of ['', 'no-at', '@example.com', 'a@', 'a@@b', 'a b@example.com', null, 42]) {
    assert.equal(normalizeEmail(value), '', String(value));
  }
});

test('RBAC is deny-by-default and keeps least privilege', () => {
  assert.equal(isRole('owner'), true);
  assert.equal(isRole('root'), false);
  assert.equal(hasPermission('owner', 'tenant:configure'), true);
  assert.equal(hasPermission('admin', 'tenant:configure'), false);
  assert.equal(hasPermission('approver', 'approval:decide'), true);
  assert.equal(hasPermission('approver', 'automation:run'), false);
  assert.equal(hasPermission('operator', 'automation:run'), true);
  assert.equal(hasPermission('operator', 'approval:decide'), false);
  assert.equal(hasPermission('viewer', 'session:read'), true);
  assert.equal(hasPermission('viewer', 'workflow:write'), false);
  assert.equal(hasPermission('unknown', 'session:read'), false);
  assert.equal(hasPermission('owner', 'unknown:permission'), false);
});

test('session tokens are opaque and stored as SHA-256', () => {
  const token = createSessionToken();
  assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
  assert.equal(token.includes('.'), false);
  assert.match(hashToken(token), /^[0-9a-f]{64}$/);
  assert.notEqual(hashToken(token), hashToken(createSessionToken()));
});

test('cookie parsing and serialization keep flags explicit', () => {
  const cookies = parseCookies('koros_session=abc; koros_csrf=def');
  assert.equal(cookies.get('koros_session'), 'abc');
  assert.equal(cookies.get('koros_csrf'), 'def');
  const serialized = serializeCookie('koros_session', 'abc', { httpOnly: true, secure: true, maxAge: 60 });
  assert.match(serialized, /^koros_session=abc; Path=\/; SameSite=Lax/);
  assert.match(serialized, /HttpOnly/);
  assert.match(serialized, /Secure/);
  assert.match(serialized, /Max-Age=60/);
});

test('CSRF comparison is constant-time safe', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'ab'), false);
  assert.equal(safeEqual(undefined, 'abc'), false);
});
