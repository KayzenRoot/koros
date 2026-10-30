# Evidence Bundle KOR-PM04-WO-001 — motor de workflows e FSM auditável

**Data:** 2026-10-30. **Issue:** [#51](https://github.com/KayzenRoot/koros/issues/51). **Módulo:** [PRODUCT-M04 #39](https://github.com/KayzenRoot/koros/issues/39). **PR:** [#79](https://github.com/KayzenRoot/koros/pull/79) (Draft, sem merge). **Base main:** `83bd85bd03f3009e381703084e1813ce05498c2c`. **HEAD de código:** `3b1482600630182e89409f16a6d9230b9f9c7bd2`. **Branch:** `feat/KOR-PM04-WO-001-workflow-fsm`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PASS`.

## 1. Context Lock

- M02 (schema/auth/RLS) e M03 (#48/#49/#50) estão na main.
- Nenhum LLM, CRM real, token, rede ou dado de cliente.
- Nenhuma dependência nova; PostgreSQL 17 local e adapter mock.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `db/migrations/0004_workflow_fsm.sql` e `.down.sql`: estados canônicos no check de `runs`, com compatibilidade legada.
- `src/workflow/fsm.mjs`: estados, arestas, estados terminais e validação deny-by-default.
- `src/workflow/service.mjs`: `createRun` idempotente, `transitionRun` com row lock/`expectedState` e auditoria.
- `src/workflow/errors.mjs` e `src/workflow/index.mjs`.
- `src/outbox/service.mjs`: outbox passa a usar `QUEUED`, `RECONCILING`, `PAUSED`, `COMPLETED` e `FAILED` via FSM, sem `UPDATE runs` direto.
- `test/workflow-unit.test.mjs`, `test/workflow-integration.test.mjs` e validação da migration em `test/data-model.test.mjs`.
- `package.json`, docs de segurança/dados/contratos e este Evidence Bundle.

## 3. FSM canônica

`RECEIVED → VALIDATED → PROPOSED → PENDING_APPROVAL → APPROVED → QUEUED → RECONCILING → COMPLETED`.

Arestas adicionais: rejeição/falha a partir de estados não terminais, `EXPIRED` antes/depois da aprovação, `QUEUED → COMPLETED` no sucesso síncrono, `QUEUED ↔ RECONCILING`, `QUEUED/RECONCILING → PAUSED` por quota, `PAUSED → QUEUED` por retomada autorizada. `REJECTED`, `EXPIRED`, `COMPLETED` e `FAILED` são terminais.

Não existem arestas `PENDING_APPROVAL → COMPLETED` nem `APPROVED → COMPLETED`; a IA não tem caminho para a escrita externa sem fila/approval.

## 4. Decisões técnicas

| Decisão | Justificativa | Limite |
|---|---|---|
| `SELECT ... FOR UPDATE` por run | Serializa reentrada concorrente no mesmo tenant | Lock é por linha/transação |
| `expectedState` opcional | Detecta worker offline/estado obsoleto | Replay do mesmo target é idempotente por design |
| Auditoria `RUN_STATE_CHANGED` | Trilha `from/to/reason`, sem PII | Sem UI de consulta nesta WO |
| Unique `(tenant_id, idempotency_key)` | Criação não duplica em replay | Chave repetida com contrato diferente falha |
| Outbox integrado à FSM | Evita atualização direta de `runs.state` | Estados legados ainda existem no check para compatibilidade |
| Sem auto-resume | `PAUSED` exige ação explícita | A retomada ainda não tem UI |

## 5. Critérios de aceitação

| Critério | Prova |
|---|---|
| Transições válidas somente | Teste de caminho feliz e unitários de todas as arestas; `assertTransition` antes do UPDATE |
| Falha fechada | Transição ilegal/terminal/shortcut retorna `INVALID_TRANSITION` sem mutação |
| Retomada autorizada | `PAUSED → QUEUED` apenas por `resumePausedAction`/transição explícita |
| Unicidade/replay | `createRun` repetido retorna o mesmo run; transição repetida não duplica auditoria |
| Nenhum atalho do LLM à escrita | `PENDING_APPROVAL`/`APPROVED → COMPLETED` rejeitados; outbox passa por `QUEUED`/`RECONCILING` |
| Reentrada concorrente | Duas transições iguais em paralelo: uma efetiva, uma idempotente, uma única auditoria |
| Worker offline | `expectedState` obsoleto retorna `STATE_MISMATCH` |
| Cross-tenant | Transição de run de outro tenant retorna `NOT_FOUND` |
| Outbox compatível | Suíte da #50 continua passando com os estados canônicos |

## 6. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_test`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 43 módulos JavaScript |
| `node --test test/workflow-unit.test.mjs` | **PASS — 5/5** |
| `npm run test:db` | **PASS — 46/46** (14 schema + 11 auth + 7 ingestão + 8 outbox + 6 workflow) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 46/46** |
| `npm run check` sem banco | PASS — 56 testes, 46 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 36 Markdown, 55 links, 0 findings |

**NOT_RUN:** UI/Playwright, editor de workflow, LLM real, CRM real, carga multi-worker distribuída e chaos de rede. Não fazem parte do escopo mock desta WO; permanecem pendentes para as próximas.

## 7. Segurança e limites

- Toda transição passa por tenant/RLS e row lock; não há header de tenant nem transição cross-tenant.
- `reason` é limitado e rejeita caracteres de controle; nenhum payload PII é copiado para a auditoria.
- `createRun` usa FK composta de lead/workflow version; IDs e chaves são validados.
- O outbox não faz mais `UPDATE runs` direto: usa `transitionRun`, mantendo a FSM como único caminho de estado.
- **Limites:** sem UI, editor visual, LLM, CRM real, scheduler distribuído, retenção ou relatório de auditoria. Estados legados permanecem aceitos no banco para compatibilidade, mas não são emitidos pelo serviço FSM.
- Nenhum merge, deploy, gasto ou dado real.

## 8. CI

Consulta em 2026-10-30 para `3b1482600630182e89409f16a6d9230b9f9c7bd2`; todos os checks concluíram com sucesso.

| Check | Resultado | Run |
|---|---|---|
| `m02-baseline` | SUCCESS | [job 124340868902](https://github.com/KayzenRoot/koros/actions/runs/41136718220/job/124340868902) |
| `m02-data` | SUCCESS | [job 124340869165](https://github.com/KayzenRoot/koros/actions/runs/41136718220/job/124340869165) |
| `governance-docs` | SUCCESS | [job 124340868304](https://github.com/KayzenRoot/koros/actions/runs/41136718215/job/124340868304) |
| `codeql-js` | SUCCESS | [job 124340869235](https://github.com/KayzenRoot/koros/actions/runs/41136718220/job/124340869235) |
| CodeQL | SUCCESS | [run 124341198891](https://github.com/KayzenRoot/koros/runs/124341198891) |
| SonarCloud Code Analysis | SUCCESS | [PR 79](https://sonarcloud.io/dashboard?id=KayzenRoot_koros&pullRequest=79) |
| Socket Security | SUCCESS | [PR alerts](https://socket.dev) |

Este arquivo é atualizado em um commit somente de evidência; o histórico corrente de checks, incluindo a reexecução no HEAD documental, deve ser lido em [PR #79 checks](https://github.com/KayzenRoot/koros/pull/79/checks). Nenhum resultado é extrapolado para além dos runs acima.
