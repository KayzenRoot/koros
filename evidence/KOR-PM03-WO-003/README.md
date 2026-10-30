# Evidence Bundle KOR-PM03-WO-003 — outbox, retries e reconciliação idempotente

**Data:** 2026-10-30. **Issue:** [#50](https://github.com/KayzenRoot/koros/issues/50). **Módulo:** [PRODUCT-M03 #38](https://github.com/KayzenRoot/koros/issues/38). **PR:** [#78](https://github.com/KayzenRoot/koros/pull/78) (Draft, sem merge). **Base main:** `5d4a045518e15f1ceb79da728e89333ee5e4a72a`. **HEAD de código:** `b8b34bed34602b5bfd4aace0537e578d524526bd`. **Branch:** `feat/KOR-PM03-WO-003-outbox`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PASS`.

## 1. Context Lock

- #49 (contrato CRM mock) e #48 (receptor de leads) estão na main.
- Nenhum CRM real, token, OAuth, sandbox de fornecedor ou chamada de rede.
- Nenhuma dependência nova; adapter usado é o mock Agendor da #49.
- Dados exclusivamente sintéticos e PostgreSQL 17 local.
- Sem merge, deploy, conta, gasto ou alteração da main.

## 2. Escopo entregue

- `db/migrations/0003_outbox.sql` e `.down.sql`: tupla idempotente, payload, aprovação, lease, reconciliações, `PAUSED` e índices de claim.
- `src/outbox/policy.mjs`: chave idempotente, backoff exponencial limitado, classificação de falhas e próximo attempt.
- `src/outbox/errors.mjs` e `src/outbox/index.mjs`: erros normalizados e superfície pública.
- `src/outbox/service.mjs`: enqueue atômico, claim com `SKIP LOCKED`, dispatch, retry, timeout incerto, quota, reconciliação e retomada manual.
- `test/outbox-unit.test.mjs` e `test/outbox-integration.test.mjs`.
- `test/data-model.test.mjs`: verificação da migration 0003.
- `package.json`: `test:outbox` e inclusão no `test:db`.
- `docs/04-security.md`, `docs/05-data-model.md` e `docs/06-integration-api-contracts.md`.

## 3. Decisões técnicas

| Decisão | Justificativa | Limite |
|---|---|---|
| Chave `SHA-256(tenant + source + external_id + payload_version)` | Evita colisão de concatenação e cobre replay/retry | Não substitui a unique do banco |
| Enqueue e `run APPROVED → DISPATCHING` na mesma transação | Outbox atômica; falha não deixa ação órfã | Requer caller na transação de tenant |
| Claim com `FOR UPDATE SKIP LOCKED` e lease de 60 s | Duas filas não pegam a mesma linha; crash é recuperável | Lease é por processo, não coordenado globalmente |
| Timeout → `UNCERTAIN` e `getPerson` antes de novo upsert | Evita duplicar escrita quando o provedor já commitou | Depende de leitura por `external_id` |
| Backoff 5 s → 900 s, máximo 5 tentativas | Retry limitado e previsível | Sem jitter nesta WO |
| `QUOTA_EXCEEDED` → `PAUSED` + run `BLOCKED` | Não queima tentativas contra quota esgotada | Retomada é manual |
| Aprovação vinculada ao hash canônico e persistida | Impede escrita sem aprovação ou com payload trocado | Aprovação ainda não tem UI/fluxo completo |

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Não duplicar gravação após replay | Replay do enqueue retorna a mesma ação; replay do dispatch não reprocessa; upsert mock é idempotente por `externalId` |
| Não duplicar após retry/timeout | Timeout após sucesso vai para `UNCERTAIN`; reconciliação encontra o contato e conclui sem segundo upsert |
| Reconciliar antes de repetir após timeout ambíguo | `processNextAction` chama `getPerson` para `previous_status=UNCERTAIN` |
| Auditar falhas | `OUTBOX_FAILED`, `OUTBOX_RETRY_SCHEDULED`, `OUTBOX_UNCERTAIN`, `OUTBOX_PAUSED`, `OUTBOX_RECONCILED`, `OUTBOX_LEASE_EXPIRED` |
| Pausar por quota | `QUOTA_EXCEEDED` → outbox `PAUSED`, run `BLOCKED`; `resumePausedAction` reabre |
| Dupla fila simultânea | Duas chamadas concorrentes de claim; exatamente uma recebe a ação |
| Crash/lease expirada | Lease vencida vira `UNCERTAIN`; a passagem seguinte reconcilia antes de reenviar |
| Falha terminal | Erro de validação/autorização → `FAILED`, sem retry |
| Retry limitado | `maxAttempts: 1` com 503 termina em `FAILED` e auditoria `retryExhausted` |

## 5. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_test`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 37 módulos JavaScript |
| `node --test test/outbox-unit.test.mjs` | **PASS — 7/7** |
| `npm run test:db` | **PASS — 39/39** (13 schema + 11 auth + 7 ingestão + 8 outbox) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 39/39** |
| `npm run check` sem banco | PASS — 51 testes, 38 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 35 Markdown, 52 links, 0 findings |

**NOT_RUN:** teste contra CRM real, carga distribuída multi-worker, Playwright (não há UI nesta WO), chaos test de rede real. Não são necessários para o mock local, mas permanecem pendentes para produção.

## 6. Segurança e limites

- O outbox armazena payload sintético e código de erro normalizado; não armazena token, segredo ou resposta bruta do provedor.
- Aprovação persistida `APPROVED`, hash do payload canônico e expiração são revalidados no enqueue e no dispatch.
- Todas as operações do serviço passam por `withTenant`/RLS; o teste cross-tenant não reivindica a ação de outro tenant.
- Lease expirada nunca é retry cego: vira `UNCERTAIN` e exige reconciliação.
- `PAUSED` por quota exige retomada manual; não há auto-resume.
- **Limites:** sem scheduler distribuído, DLQ, alertas, métricas, rate limit distribuído, UI ou CRM real. O lease usa relógio da aplicação; produção exige calibração e observabilidade.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI

Consulta em 2026-10-30 para `b8b34bed34602b5bfd4aace0537e578d524526bd`; todos os checks concluíram com sucesso.

| Check | Resultado | Run |
|---|---|---|
| `m02-baseline` | SUCCESS | [job 124335732722](https://github.com/KayzenRoot/koros/actions/runs/41135171307/job/124335732722) |
| `m02-data` | SUCCESS | [job 124335732264](https://github.com/KayzenRoot/koros/actions/runs/41135171307/job/124335732264) |
| `governance-docs` | SUCCESS | [job 124335731780](https://github.com/KayzenRoot/koros/actions/runs/41135171116/job/124335731780) |
| `codeql-js` | SUCCESS | [job 124335732518](https://github.com/KayzenRoot/koros/actions/runs/41135171307/job/124335732518) |
| CodeQL | SUCCESS | [run 124336109486](https://github.com/KayzenRoot/koros/runs/124336109486) |
| SonarCloud Code Analysis | SUCCESS | [PR 78](https://sonarcloud.io/dashboard?id=KayzenRoot_koros&pullRequest=78) |
| Socket Security | SUCCESS | [PR alerts](https://socket.dev) |

Este arquivo é atualizado em um commit somente de evidência; o histórico corrente de checks, incluindo a reexecução no HEAD documental, deve ser lido em [PR #78 checks](https://github.com/KayzenRoot/koros/pull/78/checks). Nenhum resultado é extrapolado para além dos runs acima.
