# Evidence Bundle KOR-PM02-WO-002 — auth, RBAC e isolamento

**Data:** 2026-10-30. **Issue:** [#46](https://github.com/KayzenRoot/koros/issues/46). **Módulo:** [PRODUCT-M02 #37](https://github.com/KayzenRoot/koros/issues/37). **Base:** branch `feat/KOR-PM02-WO-003-data-migrations` @ `5e10542` (PR #74 Draft). **Branch:** `feat/KOR-PM02-WO-002-auth-rbac`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock e autorização

- Decisão [#73](https://github.com/KayzenRoot/koros/issues/73) aprovada; D-M02-03/04/05 aplicadas.
- A #46 é empilhada sobre a #47 (PR #74), pois usa o schema, RLS e funções de banco. Nenhum merge foi feito.
- `main` de referência: `e25082ab029a04211a1379c518f61d13c9934e25`.
- ADR-018 continua `PROPOSED_IN_PR`; ADR-006/009 seguem `PENDING`.

## 2. Dependência revisada

| Item | Valor |
|---|---|
| Pacote | `pg@8.23.1` (exato) |
| Licença | MIT |
| Transitivos | 14 pacotes; MIT/ISC; nenhuma licença desconhecida |
| `npm audit --omit=dev` | **0 vulnerabilidades** |
| Lockfile | `package-lock.json` com integrity SHA-512 |
| Guard | `ci-integrity` permite somente `pg@8.23.1` e lockfile correspondente |

Nenhuma outra dependência npm foi adicionada.

## 3. Escopo entregue

- `db/migrations/0002_auth.sql` e `0002_auth.down.sql`: funções `auth_lookup` e `auth_session_lookup` `SECURITY DEFINER`, com `search_path` fixo e execute apenas para `koros_app`.
- `src/auth/password.mjs`: `scrypt` (N=16384, r=8, p=1), salt por usuário, comparação `timingSafeEqual`, normalização de e-mail.
- `src/auth/session.mjs`: token opaco, hash SHA-256, cookies `HttpOnly`/`SameSite=Lax`/`Secure` opcional, CSRF e comparação constante.
- `src/auth/rbac.mjs`: papéis owner/admin/approver/operator/viewer e matriz deny-by-default.
- `src/auth/service.mjs`: login, logout, sessão, tenant da sessão, rate limit em memória e auditoria.
- `src/db.mjs`: pool `pg`, `withTenant` com `set_config('app.tenant_id', ..., true)`.
- `src/app.mjs`: rotas `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/session`, `GET /v1/protected/ping` e `GET /v1/protected/approval`.
- `src/config.mjs`: `authentication=session-rbac`, `tenantAccess=authenticated-session-only`.
- `test/auth-unit.test.mjs` e `test/auth-integration.test.mjs`.
- `scripts/ci-integrity.mjs` e `test/ci-integrity.test.mjs`: allowlist exata de `pg`.
- `.github/workflows/koros-baseline.yml`: `npm ci`, `npm audit`, URL do banco, testes de auth e rollback/reapply.
- `docs/04-security.md`: nota de implementação e limites.

## 4. Testes locais

| Prova | Resultado |
|---|---|
| PostgreSQL 17.10 temporário, porta 55432 | PASS |
| `db:migrate` (0001 + 0002) | PASS |
| `db:seed` | PASS |
| `test:db` (schema/RLS) | **12/12 PASS** |
| `test:auth` (login/sessão/RBAC) | **11/11 PASS** |
| `npm run check` sem banco | PASS — 20 testes, 23 skips |
| `npm run smoke` | PASS |
| `npm run ci:integrity` | PASS |
| `npm audit --omit=dev` | 0 vulnerabilidades |

Cobertura de auth: login correto/errado, sessão, cookie HttpOnly, CSRF obrigatório, logout/revogação, token adulterado, sessão expirada, tenant spoof via header, owner aprovando, viewer negado, content-type/JSON inválidos e auditoria de login.

## 5. Segurança e invariantes

- Tenant é derivado da sessão (`sessions.tenant_id`) e aplicado por `SET LOCAL app.tenant_id`; header `X-Tenant-Id` é ignorado.
- O papel `koros_app` não tem `BYPASSRLS`; as funções de lookup são `SECURITY DEFINER`, com `search_path = public, pg_temp` e execute mínimo.
- Token de sessão só é armazenado como SHA-256; cookie de sessão é HttpOnly; CSRF é double-submit.
- Senha nunca é logada/retornada; hash `scrypt` com salt por usuário.
- Auditoria de login/logout grava `audit_events` append-only; a app não pode alterar/apagar audit.
- Rate limit é **em memória e por processo**; não é distribuído. MFA, reset de senha, cadastro público e seleção de múltiplas memberships ficam fora desta WO.
- `users` é global; a autorização de leitura é feita pela sessão/membership, não por RLS em `users`.

## 6. CI esperado

- `m02-baseline`: `npm ci`, auditoria, integridade, lint, unitários e smoke.
- `m02-data`: Postgres 17, migrations 0001+0002, seed, `test:db` (inclui auth) e rollback/reapply.
- `governance-docs`, CodeQL, Sonar e Socket no HEAD.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- CI do HEAD final deve ser consultado após o push; nenhum `SUCCESS` é presumido.

## 7. Limitações e STOP

- A #46 não implementa dashboard, CRM, LLM, worker/outbox, MFA, OAuth, reset de senha ou cadastro público.
- Se RLS, CSRF, cross-tenant ou CI falharem, Correction Delta no mesmo PR; não avançar para M03.
- Sem merge, deploy, dados reais, conta, gasto ou alteração da main.
