# Evidence Bundle KOR-PM04-WO-004 — auditoria, custos e kill switch

**Data:** 2026-10-30. **Issue:** [#54](https://github.com/KayzenRoot/koros/issues/54). **Módulo:** [PRODUCT-M04 #39](https://github.com/KayzenRoot/koros/issues/39). **PR:** [#82](https://github.com/KayzenRoot/koros/pull/82) (Draft, sem merge). **Base main:** `be5da86b87148299ce2339c583d7e3a35fd92de8`. **HEAD de código:** `4536241ae9d35914cf8caa84f1c8589f82bf2384`. **Branch:** `feat/KOR-PM04-WO-004-audit-cost-killswitch`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PASS`.

## 1. Context Lock

- M04-WO-001/002/003 (#51/#52/#53), M03 e M02 estão na main.
- Nenhum LLM/CRM real, token real, cobrança real ou dado de cliente.
- Nenhuma dependência nova; PostgreSQL 17 local.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `db/migrations/0006_audit_cost_killswitch.sql` e `.down.sql`: hash chain de auditoria, correlation ID, orçamento por tenant, status de uso e kill switch.
- `src/audit/hash.mjs`, `events.mjs` e `verify.mjs`: redaction, encadeamento SHA-256 e verificação.
- `src/control/guard.mjs`: kill switch fail-closed, arm/disarm com permissão e auditoria.
- `src/control/budget.mjs`: reserva/settle/release de tokens/custo, execução metered e métricas agregadas.
- `src/control/authz.mjs` e `src/control/index.mjs`; `src/audit/index.mjs`.
- `test/audit-unit.test.mjs` e `test/control-integration.test.mjs`.
- Seed sintético de `budget_policies` e `tenant_controls`; docs e este Bundle.

## 3. Decisões técnicas

| Decisão | Justificativa | Limite |
|---|---|---|
| Auditoria com `prev_hash`/`event_hash` por tenant | Detecta edição retroativa mesmo com acesso de owner | Linhas legadas sem hash não entram na cadeia |
| Advisory lock por tenant | Serializa a cadeia sem colisão concorrente | Custo de lock por inserção |
| Redaction antes do hash | Segredo não entra no audit nem no hash | Pattern de chave, não DLP exaustivo |
| `correlation_id` por evento | Correlação operacional sem PII | Sem UI/tracing distribuído |
| Reserva de orçamento com row lock | Impede overspend concorrente antes do callback | Reserva órfã exige reconciliação |
| Kill switch fail-closed no outbox/budget | Bloqueia antes do adapter, sem bypass | Sem UI/alertas/controle por operação |
| Métricas agregadas | Observabilidade sem PII | Sem dashboards/exportadores |

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Orçamento excedido bloqueia antes do processamento pago | Callback não executado; nenhuma linha `RESERVED` criada |
| Quota sob limite | Reserva + settle; uso `SETTLED`; métricas atualizadas |
| Kill switch sem bypass | `runMeteredOperation` e `claimNextAction` falham com `KILL_SWITCH_ACTIVE` antes de adapter |
| Segredo mascarado | `api_key`, `password`, `authorization` viram `[REDACTED]`; valor bruto ausente |
| Nenhuma edição silenciosa | `verifyAuditChain` detecta `UPDATE` retroativo de metadata |
| Correlation ID | Evento/uso com UUID não nulo |
| Métricas sem PII | Apenas agregados; sem e-mail/nome no JSON |
| Reserva falha | `runMeteredOperation` libera `RELEASED` quando o callback falha |

## 5. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_test`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 68 módulos JavaScript |
| `node --test test/audit-unit.test.mjs` | **PASS — 2/2** |
| `npm run test:db` | **PASS — 64/64** (16 schema + 11 auth + 7 ingestão + 8 outbox + 6 workflow + 11 approval + 5 control) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 64/64** |
| `npm run check` sem banco | PASS — 71 testes, 64 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 39 Markdown, 63 links, 0 findings |

**NOT_RUN:** cobrança real, provedor de IA/CRM real, UI/Playwright, rollover automático de período, reconciliação de reserva órfã, alertas e carga distribuída.

## 6. Segurança e limites

- Auditoria append-only; app role mantém apenas SELECT/INSERT. O hash chain detecta alteração feita por acesso privilegiado.
- Redaction mascara chaves sensíveis antes de persistir/hashear; não é DLP exaustivo.
- Orçamento e kill switch são verificados no servidor, sob RLS/tenant, antes do callback/adapter.
- Métricas retornam somente agregados, sem PII.
- **Limites:** custo/tokens simulados; sem cobrança real, sem faturamento, sem reconciliação de reserva órfã, sem UI/alertas, sem operação distribuída. O kill switch é único por tenant, não por operação.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI

Consulta em 2026-10-30 para `4536241ae9d35914cf8caa84f1c8589f82bf2384`; todos os checks concluíram com sucesso.

| Check | Resultado | Run |
|---|---|---|
| `m02-baseline` | SUCCESS | [job 124357737514](https://github.com/KayzenRoot/koros/actions/runs/41141845931/job/124357737514) |
| `m02-data` | SUCCESS | [job 124357737311](https://github.com/KayzenRoot/koros/actions/runs/41141845931/job/124357737311) |
| `governance-docs` | SUCCESS | [job 124357736985](https://github.com/KayzenRoot/koros/actions/runs/41141845848/job/124357736985) |
| `codeql-js` | SUCCESS | [job 124357737731](https://github.com/KayzenRoot/koros/actions/runs/41141845931/job/124357737731) |
| CodeQL | SUCCESS | [run 124358130962](https://github.com/KayzenRoot/koros/runs/124358130962) |
| SonarCloud Code Analysis | SUCCESS | [PR 82](https://sonarcloud.io/dashboard?id=KayzenRoot_koros&pullRequest=82) |
| Socket Security | SUCCESS | [PR alerts](https://socket.dev) |

Este arquivo é atualizado em um commit somente de evidência; o histórico corrente de checks, incluindo a reexecução no HEAD documental, deve ser lido em [PR #82 checks](https://github.com/KayzenRoot/koros/pull/82/checks). Nenhum resultado é extrapolado para além dos runs acima.
