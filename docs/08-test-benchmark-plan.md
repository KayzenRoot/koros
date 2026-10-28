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
