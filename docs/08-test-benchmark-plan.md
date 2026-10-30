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
