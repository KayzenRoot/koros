# Evidence Bundle KOR-PM07-WO-003 — benchmark determinístico

**Data:** 2026-10-30. **Issue:** [#63](https://github.com/KayzenRoot/koros/issues/63). **Módulo:** [PRODUCT-M07 #42](https://github.com/KayzenRoot/koros/issues/42). **PR:** [#90](https://github.com/KayzenRoot/koros/pull/90) (Draft, sem merge). **Base main:** `d3cfedf3a545eea0f3cf0f53f775637795ce0099`. **HEAD de código:** `47c7f4950c2842a450195be765d9afdcdc149500`. **Branch:** `feat/KOR-PM07-WO-003-benchmark`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PASS`.

## 1. Context Lock

- M02–M06 e M07-WO-002 estão na main.
- Apenas ambiente local/sintético; nenhum VPS, provider real, custo externo ou dado de cliente.
- Nenhuma migração ou dependência nova.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `scripts/benchmark.mjs`: workloads AI mock, hash, template preview, snapshot crypto, dashboard/queue e outbox claim.
- `scripts/benchmark-stats.mjs`: percentis, resumo e comparação de regressão (piso 50% de throughput, teto 2× p95).
- `test/benchmark-unit.test.mjs`.
- Resultados `benchmark-small.json` e `benchmark-medium.json`.
- Docs de test/benchmark e este Bundle.

## 3. Configuração

- Windows x64, Node 26.4.0, 8 CPUs, ~23 GB RAM.
- PostgreSQL 17 local em `127.0.0.1:55432`, banco sintético.
- Small: 1.000 AI / 5.000 hash / 1.000 preview / 20 crypto / 10 dashboard / 200 queue.
- Medium: 5.000 AI / 20.000 hash / 5.000 preview / 50 crypto / 20 dashboard / 1.000 queue.

## 4. Resultados

| Workload | Small p95 | Small ops/s | Medium p95 | Medium ops/s |
|---|---:|---:|---:|---:|
| `ai-classify` (mock) | 0.038 ms | 55.6k | 0.013 ms | 125k |
| `approval-hash` | 0.014 ms | 90.9k | 0.012 ms | 111k |
| `template-preview` | 0.008 ms | 167k | 0.005 ms | 333k |
| `snapshot-crypto` | 0.77 ms | 2.0k | 1.61 ms | 1.7k |
| `db-dashboard-summary` | 22.0 ms | 114 | 9.1 ms | 114 |
| `outbox-claim` | 11.3 ms | 120 | 5.6 ms | 250 |

**Restore:** 2.204 s para 2 tenants, 8 migrations e 1.202 runs em banco isolado; verificação de tenant/migrations/contagens passou.

## 5. SLO provisório e regressão

SLO local provisório (não comercial): p95 AI < 5 ms; hash/preview < 2 ms; crypto < 20 ms; dashboard < 100 ms small e < 250 ms medium; claim < 50 ms; restore de ~1.2k runs < 10 s.

`npm run benchmark:check` contra o baseline small (workloads puros, sem DB) retornou `status: OK`, `regressions: []`. O check de DB exige o mesmo estado de banco e não é comparável entre execuções com cardinalidade diferente. Não há SLA comercial, RPO/RTO ou prova de capacidade de produção.

## 6. Falhas e negativos

| Cenário | Cobertura |
|---|---|
| Spike small→medium | p95/throughput publicados; sem degradação > tolerância nos workloads puros |
| 429 | `test/ingestion-integration.test.mjs` rate limit |
| Worker crash/lease | `test/outbox-integration.test.mjs` lease/UNCERTAIN/reconciliação |
| Runaway cost | `test/control-integration.test.mjs` budget/kill switch |
| Restore lento | restore local 2.204 s; SLO provisório < 10 s |
| Restore inválido | #60: corrupção, versão, tenant, migrations/row counts |

**NOT_RUN:** carga concorrente/distribuída, >1.200 runs, browser/Playwright, provider/CRM real, rede externa, restauração de produção e SLA/RPO/RTO.

## 7. Limites

- Uma máquina e uma execução por escala; sem intervalo de confiança ou análise estatística.
- Workloads AI/CRM são mocks; não medem provider real.
- DB benchmark usa banco local sintético e acumula dados entre execuções.
- Regressão é guard local, não gate de capacidade.
- Nenhum merge, deploy, gasto ou dado real.

## 8. CI

Consulta em 2026-10-30 para `47c7f4950c2842a450195be765d9afdcdc149500`; todos os checks concluíram com sucesso.

| Check | Resultado | Run |
|---|---|---|
| `m02-baseline` | SUCCESS | [job 124395902567](https://github.com/KayzenRoot/koros/actions/runs/41153758546/job/124395902567) |
| `m02-data` | SUCCESS | [job 124395902419](https://github.com/KayzenRoot/koros/actions/runs/41153758546/job/124395902419) |
| `governance-docs` | SUCCESS | [job 124395901385](https://github.com/KayzenRoot/koros/actions/runs/41153758337/job/124395901385) |
| `codeql-js` | SUCCESS | [job 124395902747](https://github.com/KayzenRoot/koros/actions/runs/41153758546/job/124395902747) |
| CodeQL | SUCCESS | [run 124396192674](https://github.com/KayzenRoot/koros/runs/124396192674) |
| SonarCloud Code Analysis | SUCCESS | [PR 90](https://sonarcloud.io/dashboard?id=KayzenRoot_koros&pullRequest=90) |
| Socket Security | SUCCESS | [PR alerts](https://socket.dev) |

Este arquivo é atualizado em um commit somente de evidência; o histórico corrente de checks, incluindo a reexecução no HEAD documental, deve ser lido em [PR #90 checks](https://github.com/KayzenRoot/koros/pull/90/checks). Nenhum resultado é extrapolado para além dos runs acima.

**Docs:** 50 Markdown, 83 links, 0 findings.
