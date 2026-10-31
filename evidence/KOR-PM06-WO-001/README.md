# Evidence Bundle KOR-PM06-WO-001 — onboarding guiado e dry-run sintético

**Data:** 2026-10-30. **Issue:** [#58](https://github.com/KayzenRoot/koros/issues/58). **Módulo:** [PRODUCT-M06 #41](https://github.com/KayzenRoot/koros/issues/41). **Base main:** `1e56842faafe42c4232acd0b279494a3ad6a724d`. **Branch:** `feat/KOR-PM06-WO-001-onboarding`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- M02–M05 e M06-WO-002 estão na main.
- Nenhum signup público, e-mail, conta externa, CRM/LLM real ou dado de cliente.
- Tenant novo é sintético/local e provisionado apenas por função ops.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `db/migrations/0008_onboarding.sql` e `.down.sql`: sessões retomáveis e convites.
- `src/onboarding/service.mjs`: start/get/advance, convite one-time, consentimento, política, dry-run e provisionamento local.
- `src/onboarding/errors.mjs` e `index.mjs`.
- `GET /v1/onboarding`, `POST /v1/onboarding/start`, `POST /v1/onboarding/step`.
- `/onboarding` + `onboarding.js`: wizard pt-BR de sete passos.
- Link condicionado a `tenant:configure` no dashboard.
- Testes, docs e este Bundle.

## 3. Fluxo e segurança

1. `TENANT`: nome do tenant; atualiza organização.
2. `CONNECTOR`: provedor `synthetic-webhook`, conta e escopo `leads:read`; ausência de escopo → `MISSING_SCOPE`.
3. `TEMPLATE`: versão existente do próprio tenant.
4. `INVITE`: e-mail/papel; token one-time, apenas SHA-256 persistido; sem envio externo.
5. `CONSENT`: `GRANTED`/`DENIED` para uso futuro.
6. `POLICY`: aceite fixo `local-v1`; sem edição arbitrária.
7. `DRY_RUN`: preview do template versionado; zero run/outbox/adapter.

Sessão única ativa por tenant, row lock, retomada pelo `current_step`; passo errado → `STEP_MISMATCH` sem mutação. Todas as operações usam `withTenant`/RLS e `tenant:configure`. O tenant novo é provisionado por função local protegida por `KOROS_ALLOW_TENANT_PROVISIONING=1`, sem rota HTTP; plano/API real permanece UNKNOWN.

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Novo tenant isolado | Provisionamento cria org/owner/membership/control/template próprios; leitura por outro tenant não vê a sessão |
| Sem instalação local/conta externa | Provisionamento é server-side/local-ops; nenhum e-mail, signup ou provider |
| Wizard do zero | Sessão → 7 passos → COMPLETED |
| Dry-run | Preview do payload normalizado; runs=0, outbox=0 |
| Ausência de scope | `MISSING_SCOPE`; sessão permanece `CONNECTOR` |
| Erro de auth/papel | viewer → `FORBIDDEN` |
| Falha de provisionamento | flag ausente → `PROVISIONING_DISABLED` |
| Retomada/erro | passo errado → `STEP_MISMATCH`; estado inalterado |
| Política/consentimento | política fixa local-v1; consentimento registrado |

## 5. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_local`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` (inclui `public/`) | PASS — 89 módulos JavaScript |
| Testes unitários de dashboard/onboarding page | **4/4 PASS** |
| `npm run test:onboarding` | **4/4 PASS** |
| `npm run test:db` | **PASS — 86/86** (18 schema + 11 auth + 7 ingestão + 8 outbox + 6 workflow + 11 approval + 5 control + 11 dashboard + 5 templates + 4 onboarding) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 86/86** |
| `npm run check` sem banco | PASS — 85 testes, 86 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 45 Markdown, 77 links, 0 findings |

**NOT_RUN:** signup público, envio real de convite/e-mail, billing, provider/CRM real, Playwright/navegador, WCAG automatizada e deploy gerenciado.

## 6. Limites

- Provisionamento é local/ops-only, não é signup público; não há plano real nem cobrança.
- Token de convite é exibido uma vez e não há entrega por e-mail.
- Sem editor de template, provider real, integração de identidade externa ou MFA.
- Sem Playwright/visual regression; a UI é semanticamente acessível, não certificada.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI esperado

- `m02-baseline`, `m02-data` (inclui onboarding), `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- O resultado do HEAD final deve ser consultado no PR; nenhum `SUCCESS` é presumido.
