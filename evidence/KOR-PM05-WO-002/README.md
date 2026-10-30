# Evidence Bundle KOR-PM05-WO-002 — fila e confirmação humana de aprovação

**Data:** 2026-10-30. **Issue:** [#56](https://github.com/KayzenRoot/koros/issues/56). **Módulo:** [PRODUCT-M05 #40](https://github.com/KayzenRoot/koros/issues/40). **PR:** [#84](https://github.com/KayzenRoot/koros/pull/84) (Draft, sem merge). **Base main:** `2c4ec7e74f099fb063e0e1f4966d6c531d332d37`. **HEAD de código:** `d4fb7408a20c227aac653fd226cb4ae62413a10e`. **Branch:** `feat/KOR-PM05-WO-002-approval-queue`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PASS`.

## 1. Context Lock

- M04-003 (approval gate) e M05-001 (dashboard) estão na main.
- Nenhum framework/dependência nova, CRM/LLM real, token real ou dado de cliente.
- UI apenas local com dados sintéticos.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `GET /v1/approvals`: pendentes com run/escopo/payload/campos/versão/expiração e histórico de decisões.
- `POST /v1/approvals/{approval_id}/decision`: decisão humana server-side por sessão+CSRF.
- `decideApprovalByActor`: caminho de decisão por ator, sem token no cliente, com RBAC, row lock, TTL e integridade de hash.
- Seção de aprovações no dashboard: payload, validade, campos, histórico, confirmar/rejeitar, feedback de erro.
- `listApprovals`; testes de UI/API; docs e este Bundle.

## 3. Segurança

- Rotas de aprovação exigem `approval:decide`; viewer recebe `403`.
- `GET` e `POST` usam sessão; `POST` exige cookie + header CSRF.
- Cliente não envia tenant, ator, token, hash ou payload; o servidor usa a sessão e o registro armazenado.
- O gate recompõe `payload_hash`/`operation_hash`, exige `PENDING`, valida TTL, faz row lock, transiciona a FSM e audita.
- Duplo clique/replay é `IDEMPOTENT`; decisão concorrente contrária `ALREADY_DECIDED`; payload adulterado `PAYLOAD_MISMATCH`; CSRF inválido/sessão perdida falham sem escrita.
- A UI não decide por estado local; somente após resposta 200 do servidor a fila é recarregada.

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Ação depende da policy do servidor | Sessão + CSRF + `approval:decide` + gate server-side; viewer 403 |
| Nenhuma aprovação por estado local | Payload/token/hash não são enviados; decisão só após API |
| Reenvio sem idempotência | Duas submissões concorrentes: `APPROVED` + `IDEMPOTENT`, uma auditoria |
| Sessão perdida | POST sem cookie → `401`, run permanece `PENDING_APPROVAL` |
| CSRF | POST sem header → `403`, sem mutação |
| Payload alterado | Metadata do payload adulterada → `409 PAYLOAD_MISMATCH`, run inalterado |
| Rejeição | Botão/endpoint aceita `REJECTED`; FSM move para `REJECTED` |
| Histórico | `GET /v1/approvals` retorna `history` após decisão |
| Validade | Pending filtra `expires_at > now`; gate expira no TTL |
| Decisão inválida | `{decision:'MAYBE'}` → `400 INVALID_INPUT`, sem mutação |

## 5. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_test`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` (inclui `public/`) | PASS — 75 módulos JavaScript |
| `test/dashboard-unit.test.mjs` | **PASS — 3/3** |
| `npm run test:db` | **PASS — 75/75** (16 schema + 11 auth + 7 ingestão + 8 outbox + 6 workflow + 11 approval + 5 control + 11 dashboard) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 75/75** |
| `npm run check` sem banco | PASS — 74 testes, 75 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 41 Markdown, 69 links, 0 findings |

**NOT_RUN:** Playwright/navegador real, auditoria WCAG, leitor de tela, regressão visual, fluxo com múltiplos aprovadores/quórum e notificações em tempo real.

## 6. Limites

- Sem edição de payload, comentário, anexo, quórum ou notificação em tempo real.
- Sem token de aprovação na UI; o caminho por token continua existindo para API/automação e segue testado.
- Sem paginação/detalhe de histórico; listas limitadas a 50 pendentes/20 histórico.
- Sem MFA adicional, rate limit específico de decisão ou telemetria de frontend.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI

Consulta em 2026-10-30 para `d4fb7408a20c227aac653fd226cb4ae62413a10e`; todos os checks concluíram com sucesso.

| Check | Resultado | Run |
|---|---|---|
| `m02-baseline` | SUCCESS | [job 124369697083](https://github.com/KayzenRoot/koros/actions/runs/41145555532/job/124369697083) |
| `m02-data` | SUCCESS | [job 124369696729](https://github.com/KayzenRoot/koros/actions/runs/41145555532/job/124369696729) |
| `governance-docs` | SUCCESS | [job 124369696371](https://github.com/KayzenRoot/koros/actions/runs/41145555530/job/124369696371) |
| `codeql-js` | SUCCESS | [job 124369697153](https://github.com/KayzenRoot/koros/actions/runs/41145555532/job/124369697153) |
| CodeQL | SUCCESS | [run 124369973364](https://github.com/KayzenRoot/koros/runs/124369973364) |
| SonarCloud Code Analysis | SUCCESS | [PR 84](https://sonarcloud.io/dashboard?id=KayzenRoot_koros&pullRequest=84) |
| Socket Security | SUCCESS | [PR alerts](https://socket.dev) |

Este arquivo é atualizado em um commit somente de evidência; o histórico corrente de checks, incluindo a reexecução no HEAD documental, deve ser lido em [PR #84 checks](https://github.com/KayzenRoot/koros/pull/84/checks). Nenhum resultado é extrapolado para além dos runs acima.
