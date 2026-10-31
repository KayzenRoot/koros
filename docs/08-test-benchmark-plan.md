# 08 — Test / Benchmark Plan
**Nenhum teste de software executado.** Matriz futura:
| Tipo | Evidência exigida |
|---|---|
| Unit | policies, parsers, state transitions, idempotência, cotas |
| Integration | CRM sandbox, auth, banco, worker, LLM mocks |
| E2E | login → lead sintético → aprovação → escrita autorizada → histórico |
| Security | isolamento cross-tenant, assinatura webhook, prompt injection, SSRF, replay, segredos |
| Reliability | kill worker, timeout CRM, duplicados, recuperação, DLQ |
| Quality | lint/typecheck/build/test, CodeQL/Sonar/Socket quando instalados, SBOM/SCA |
| Benchmark | p50/p95 de latência, throughput, memória por navegador, custo por lead |
| UX | teclado, acessibilidade, erros críticos, clareza de estados |

## Baseline e amostragem
Fixtures sintéticas com casos inválidos, repetidos, maliciosos, ambíguos, rejeitados e interrompidos. Medir baseline manual ANTES de alegar ROI; definir sample size, limites de aceitação e orçamento do benchmark em ADR. No CI, mocks determinísticos; avaliação real LLM separada com custo autorizado.

## Critérios de bloqueio
Zero escritas sem aprovação, zero vazamentos entre clientes, zero ações duplicadas sob retries testados, zero segredos expostos, restore comprovado, orçamento interrompendo ações e findings HIGH/CRITICAL resolvidos. Documentar em Evidence Bundle por Work Order: base/head, diffs, comandos/exit codes, testes, riscos, checks, artefatos, Checkpoint Delta proposto. Marcar NOT_RUN com honestidade.

## KOR-PM07-WO-001 | CI incremental de código sintético (2026-10-30; delta PROPOSTO)
O baseline real de Node.js já foi integrado via #45, portanto a frase inicial "Nenhum teste de software executado" é **fotografia da fundação original**, não estado atual. Na [WO #61](https://github.com/KayzenRoot/koros/issues/61), a PR de CI propõe manter `m02-baseline` com testes nativos e smoke em pull requests e `push` à main, adicionar `ci:integrity` e negativos (dependências não auditadas, ação não pinada, segredos óbvios, TS sem typecheck, lockfile) e executar `codeql-js` real. [Evidence Bundle](../evidence/KOR-PM07-WO-001/README.md).
- `lint` e `build` permanecem **apenas sintaxe** na versão JS; não rotular como lint semântico, typecheck ou build de produção.
- TypeScript/`tsc`: `NOT_APPLICABLE` enquanto não existem arquivos TS e não há dependência TypeScript. Ao adicionar TS, é obrigatório implementar typecheck real antes da aprovação, e o guard bloqueia TS sem gate.
- CodeQL deve produzir check real por HEAD; Socket é informativo; SAST/SCA de produto completo, restore, CRM/DB/E2E, benchmarks, Sonar análise conclusiva e licença de dependências futuras **não foram comprovados** por esta mudança.
- A seção está PROPOSTA na PR da WO #61 até auditoria; não afirmar CI verde sem consultar checks do HEAD final.

## Benchmark determinístico da M07-WO-003 (2026-10-30; PROPOSED_IN_PR)

Harness: `scripts/benchmark.mjs`, workloads fixos e seeds sintéticos; `--scale small|medium`; `--out` publica JSON; `--baseline` compara throughput (piso 50% do baseline) e p95 (teto 2×). Estatísticas em `scripts/benchmark-stats.mjs`; regressão unitária em `test/benchmark-unit.test.mjs`.

Ambiente publicado: Windows x64, Node 26.4.0, 8 CPUs, ~23 GB RAM, PostgreSQL 17 local em loopback. Amostras: small = 1k AI / 5k hash / 1k preview / 20 crypto / 10 dashboard / 200 queue; medium = 5k / 20k / 5k / 50 / 20 / 1000.

| Workload | Small p95 | Small ops/s | Medium p95 | Medium ops/s |
|---|---:|---:|---:|---:|
| `ai-classify` (mock) | 0.038 ms | 55.6k | 0.013 ms | 125k |
| `approval-hash` | 0.014 ms | 90.9k | 0.012 ms | 111k |
| `template-preview` | 0.008 ms | 167k | 0.005 ms | 333k |
| `snapshot-crypto` (AES-GCM) | 0.77 ms | 2.0k | 1.61 ms | 1.7k |
| `db-dashboard-summary` | 22.0 ms | 114 | 9.1 ms | 114 |
| `outbox-claim` | 11.3 ms | 120 | 5.6 ms | 250 |

**SLO provisório local (não comercial):** p95 AI < 5 ms; hash/preview < 2 ms; crypto < 20 ms; dashboard < 100 ms small e < 250 ms medium; claim < 50 ms; restore de ~1.2k runs < 10 s. O restore local medido foi **2.204 s** para 2 tenants, 8 migrations e 1.202 runs. O baseline small pode ser checado com `npm run benchmark:check`; workloads DB só são comparáveis com o mesmo estado de banco.

**Variação/limites:** uma máquina, uma execução por escala, sem intervalo de confiança, sem carga concorrente/distribuída, sem provider real e sem navegador. Spike test limita-se à diferença small/medium; 429, worker crash e custo runaway são cobertos pelos testes de ingestão/outbox/control. Regressão é guard local, não SLA nem prova de capacidade de produção. Resultados em [benchmark-small.json](../evidence/KOR-PM07-WO-003/benchmark-small.json) e [benchmark-medium.json](../evidence/KOR-PM07-WO-003/benchmark-medium.json).
