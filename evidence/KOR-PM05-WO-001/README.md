# Evidence Bundle KOR-PM05-WO-001 — dashboard de operações

**Data:** 2026-10-30. **Issue:** [#55](https://github.com/KayzenRoot/koros/issues/55). **Módulo:** [PRODUCT-M05 #40](https://github.com/KayzenRoot/koros/issues/40). **PR:** [#83](https://github.com/KayzenRoot/koros/pull/83) (Draft, sem merge). **Base main:** `58a3299494ef4cc9dba13dc9d5dc800dd3461e14`. **HEAD de código:** `36c0113955a8ec299be734784d8b30c1b8b84aea`. **Branch:** `feat/KOR-PM05-WO-001-operations-dashboard`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PASS`.

## 1. Context Lock

- M02, M03 e M04 estão na main.
- Nenhum framework, dependência nova, CRM/LLM real, token real ou dado de cliente.
- UI apenas local com dados sintéticos.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `GET /v1/dashboard/summary`: leitura autenticada, tenant derivado da sessão, projeção de fila/runs/falhas/limites/permissões.
- `/login` e `/dashboard`: HTML pt-BR, CSS/JS externos, sem framework.
- `/assets/dashboard.css`, `/assets/dashboard.js`, `/assets/login.js`: assets fixos com CSP.
- `src/dashboard/service.mjs`, `pages.mjs`, `assets.mjs`.
- `permissionsForRole` em RBAC; `scripts/verify-syntax.mjs` também valida `public/`.
- `test/dashboard-unit.test.mjs` e `test/dashboard-integration.test.mjs`.

## 3. Segurança e RBAC

- A API usa `session.tenantId` e `withTenant`/RLS; `?tenant_id=` e headers não alteram o tenant.
- `session:read` é exigido; a resposta devolve exatamente as permissões do papel na sessão.
- Viewer recebe somente `session:read`; owner vê as permissões de decisão/configuração.
- HTML/JS/CSS usam CSP `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, `nosniff` e sem script inline.
- Nenhuma rota de escrita/aprovação nesta WO. O dashboard é read-only.

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Operador vê seu tenant | Login A → summary A; fila/runs de A; sem Tenant B/run-b |
| Tentativa cross-tenant | `?tenant_id=B` com sessão A permanece A; B não aparece no JSON |
| Permissões espelhando a API | Owner inclui `approval:decide`; viewer retorna apenas `session:read` |
| Erro de API | Sessão inválida → `401`; UI exibe erro e redireciona no `401` |
| Responsivo | Grid/flex, tabelas com overflow, breakpoint móvel e alvos de 44 px |
| Acessibilidade inicial | `lang=pt-BR`, skip link, landmarks, labels, captions, `scope`, `aria-live`, foco visível |
| Dados sintéticos | Nenhum e-mail/nome na projeção; sem PII |
| Sem escrita | Rotas apenas GET; nenhuma ação de aprovação/CRM |

## 5. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_test`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` (inclui `public/`) | PASS — 75 módulos JavaScript |
| `node --test test/dashboard-unit.test.mjs` | **PASS — 3/3** |
| `npm run test:db` | **PASS — 69/69** (16 schema + 11 auth + 7 ingestão + 8 outbox + 6 workflow + 11 approval + 5 control + 5 dashboard) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 69/69** |
| `npm run check` sem banco | PASS — 74 testes, 69 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 40 Markdown, 66 links, 0 findings |

**NOT_RUN:** Playwright/navegador real, auditoria WCAG automatizada, leitor de tela, regressão visual, testes de contraste instrumentados e ações de aprovação/edição. A acessibilidade foi implementada semanticamente, mas não certificada.

## 6. Limites

- Sem framework/SSR, sem build de frontend, sem portal de cobrança, templates ou marketplace.
- Sem WebSocket/refresh em tempo real; atualização manual.
- Sem paginação/detalhe de run; listas limitadas a 20.
- Sem rate limit específico de UI, CSP reporting ou telemetria de frontend.
- Sem aprovação/escrita pela UI; isso pertence à #56.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI

Consulta em 2026-10-30 para `36c0113955a8ec299be734784d8b30c1b8b84aea`; todos os checks concluíram com sucesso.

| Check | Resultado | Run |
|---|---|---|
| `m02-baseline` | SUCCESS | [job 124364173156](https://github.com/KayzenRoot/koros/actions/runs/41143839505/job/124364173156) |
| `m02-data` | SUCCESS | [job 124364173462](https://github.com/KayzenRoot/koros/actions/runs/41143839505/job/124364173462) |
| `governance-docs` | SUCCESS | [job 124364173112](https://github.com/KayzenRoot/koros/actions/runs/41143839508/job/124364173112) |
| `codeql-js` | SUCCESS | [job 124364173512](https://github.com/KayzenRoot/koros/actions/runs/41143839505/job/124364173512) |
| CodeQL | SUCCESS | [run 124364514705](https://github.com/KayzenRoot/koros/runs/124364514705) |
| SonarCloud Code Analysis | SUCCESS | [PR 83](https://sonarcloud.io/dashboard?id=KayzenRoot_koros&pullRequest=83) |
| Socket Security | SUCCESS | [PR alerts](https://socket.dev) |

Este arquivo é atualizado em um commit somente de evidência; o histórico corrente de checks, incluindo a reexecução no HEAD documental, deve ser lido em [PR #83 checks](https://github.com/KayzenRoot/koros/pull/83/checks). Nenhum resultado é extrapolado para além dos runs acima.
