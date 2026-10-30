import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardPage, loginPage } from '../src/dashboard/pages.mjs';
import { permissionsForRole } from '../src/auth/rbac.mjs';

test('login page is pt-BR, labeled and uses external assets', () => {
  const html = loginPage();
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<label for="email">E-mail<\/label>/);
  assert.match(html, /<label for="password">Senha<\/label>/);
  assert.match(html, /autocomplete="username"/);
  assert.match(html, /autocomplete="current-password"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /<script src="\/assets\/login\.js" defer><\/script>/);
  assert.equal(/<script>[\s\S]*?<\/script>/.test(html), false);
});

test('dashboard page exposes queue, runs, failures, limits and accessible landmarks', () => {
  const html = dashboardPage();
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="main"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<caption class="visually-hidden">Runs na fila<\/caption>/);
  assert.match(html, /id="queue-body"/);
  assert.match(html, /id="failures-body"/);
  assert.match(html, /id="runs-body"/);
  assert.match(html, /id="limits"/);
  assert.match(html, /id="permissions"/);
  assert.match(html, /<script type="module" src="\/assets\/dashboard\.js"><\/script>/);
});

test('role permissions mirror the API RBAC surface', () => {
  assert.deepEqual(permissionsForRole('viewer'), ['session:read']);
  assert.ok(permissionsForRole('owner').includes('approval:decide'));
  assert.ok(permissionsForRole('operator').includes('automation:run'));
  assert.equal(permissionsForRole('operator').includes('approval:decide'), false);
  assert.deepEqual(permissionsForRole('unknown'), []);
});
