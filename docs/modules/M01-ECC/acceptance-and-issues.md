# M01 — Matriz de issues, rastreabilidade e DoD
**Estado atual:** issues escritas integralmente; NENHUMA implementada. Criar issues completas não equivale a construir o sistema.

## Padrão de issue que regerá cada próximo módulo
- ID estável, título, classe (NECESSARY/IMPORTANT/FUTURE), fase, dependências e owner.
- Por que existe, problema de negócio, contrato técnico, arquitetura alternativa, integração/API, segurança, observabilidade, fallback/rollback.
- Checklist com tarefas de implementação, paths permitidos, arquivos/serviços impactados, testes positivos e negativos, evidência exigida, critérios de aceite e STOP.
- Limites e custos Free comprovados; fato observado separado de ideia/hipótese e `NOT_RUN`.
- Conclusão em GitHub: PR SHA/branch + Evidence Bundle + read-back + review e owner aceitando; encerrar issue somente após PROVEN (ou BLOCKED explícito), não por promessas.

## Matriz completa de execução M01
| Issue | Contrato/teste de fechamento | Dependências | Estado |
|---|---|---|---|
| [#6 KOR-M01-ECC-01](https://github.com/KayzenRoot/koros/issues/6) | Inventário de Codex Windows, MCP e GitHub com status verificáveis, nenhum token | nenhuma | PLANNED |
| [#7 -02](https://github.com/KayzenRoot/koros/issues/7) | ECC pin/licença/provenance e verificação negativa de origem | #6 | PLANNED |
| [#8 -03](https://github.com/KayzenRoot/koros/issues/8) | Plugin Windows/CLI compatível, instalação idempotente + rollback | #6-7 | PLANNED |
| [#9 -04](https://github.com/KayzenRoot/koros/issues/9) | Catálogo mínimo de skills + smoke de invocação/contexto | #7-8 | PLANNED |
| [#10 -05](https://github.com/KayzenRoot/koros/issues/10) | Planner/Executor/Reviewer, handoff, impedimento de auto-APPROVED | #8-9 | PLANNED |
| [#11 -06](https://github.com/KayzenRoot/koros/issues/11) | Hooks/rules revisados, segurança de shell e memória | #7-10 | PLANNED |
| [#12 -07](https://github.com/KayzenRoot/koros/issues/12) | MCP allowlist, read-only/default, secrets, egress, falha e autorização | #6-8 | PLANNED |
| [#13 -08](https://github.com/KayzenRoot/koros/issues/13) | ECC Tools Free, quotas, comandos e check publisher confirmado/limites | #6-7 | PLANNED |
| [#14 -09](https://github.com/KayzenRoot/koros/issues/14) | Pipeline GitHub Free com producers testados e zero required check órfão | #6-7,#13 | PLANNED |
| [#15 -10](https://github.com/KayzenRoot/koros/issues/15) | Estratégia unit/contract/E2E alinhada à stack futura | #14+ADR stack | PLANNED |
| [#16 -11](https://github.com/KayzenRoot/koros/issues/16) | CodeQL quando elegível, scanners OSS, AgentShield, segredos sintéticos | #7,#11,#12,#14 | PLANNED |
| [#17 -12](https://github.com/KayzenRoot/koros/issues/17) | Ruleset preservado, reviews legítimos, check gates e HEAD lease | #14,#16 | PLANNED |
| [#18 -13](https://github.com/KayzenRoot/koros/issues/18) | E2E CI positivo/negativo com evidência real sem false green | #8-17 | PLANNED |
| [#19 -14](https://github.com/KayzenRoot/koros/issues/19) | Windows install/upgrade/uninstall/rollback e orçamento R$0 | #8,#11-14 | PLANNED |
| [#20 -15](https://github.com/KayzenRoot/koros/issues/20) | Auditoria independente e checkpoint com todos os gates satisfeitos | #6-19 | PLANNED |

## Cobertura de requisitos e testes
| Requisito | Issue(s) | Prova necessária |
|---|---|---|
| E01 Custo de engenharia R$0 | #6,#7,#13,#14,#19 | Plano/quota público + read-back e ausência de serviços pagos |
| E02 Compatibilidade Windows | #6,#8,#19 | Versões do usuário, dry-run + smoke real |
| E03 ECC plugin skills | #7-11 | Inventário/pin, invocação, conflitos, rollback |
| E04 MCP seguro | #12,#16,#18 | Allowlist, autenticação, teste negativo de escrita |
| E05 ECC Tools hosted Free | #13,#18 | Auditoria de App, publisher/quotas, STOP em limitação |
| E06 CI profissional | #14-17 | Check runs em main+PR, falha e recovery, custos |
| E07 Sem bypass / review | #10,#17,#20 | Ruleset read-back, ausência de falso APPROVED |
| E08 Segurança supply-chain | #7,#11,#16 | Fontes oficiais, scans e casos negativos |
| E09 Reversibilidade local | #8,#11,#19 | Snapshot e rollback idempotente |
| E10 Evidência imutável | #6,#18,#20 | WO/PR/commits/run IDs, logs sanitizados |
| E11 Core multissetorial | M02-M09 futuros, não ECC | ADR de interfaces/configuração após discovery |
| E12 Fácil instalação para cliente | M04 futuro, não ECC | Testes reais de onboarding/desinstalação depois |

## Critérios de 100% construído, sem falsa promessa
**100% planejado:** 15 issues com escopo, dependências, riscos, testes, DoD, evidências e decisões; documentação em PR Draft e revisão técnica. Isso equivale a **PLAN_READY**, não IMPLEMENTED.

**100% entregue (M01 IMPLEMENTED_VERIFIED):**
- 15/15 issues com evidências validadas (podem existir itens explicitamente OUT_OF_SCOPE por ADR legítimo, sem apagar pendências).
- 0 item NECESSARY com `NOT_RUN`, `FAIL`, `BLOCKED` ou `UNVERIFIED`.
- 0 ferramenta paga, 0 token em commit, 0 bypass, 0 ferramenta global sobrescrita sem consentimento.
- TODOS checks required do HEAD e main com sucesso e provedores reais; smoke Codex Windows e rollback reais.
- 100% da matriz E01-E10 coberta por evidência. Não exigir matematicamente 100% line coverage como substituto de qualidade.
- Parecer independente tecnicamente fundamentado + aceite do fundador + squash NORMAL autorizado, Evidence Bundle e checkpoint.

## Testes negativos obrigatórios
| Caso | Esperado |
|---|---|
| Plugin/source malicioso, lock incorreto | Falhar instalação |
| Hook duplicado ou comando destrutivo | STOP e workspace intacto |
| MCP tenta escrita sem WO | Bloqueio/auditoria |
| Secret sintético no repo | Scanner falha e bloqueia PR |
| Link quebrado | governance-docs falha |
| ECC Tools excede quota Free | STOP / sem cobrança / manter OSS local |
| Check não publicado por App | NÃO REQUIRED e NOT_VERIFIED |
| Check exigido antes de produtor main | STOP deadlock preventivo |
| Runner não gratuito ou cloud | STOP gasto |
| Auto revisão COMMENTED | Não satisfaz APPROVED |

## Audit trail
Para cada teste: `issue ID, date, base_sha, head_sha, command, exit_code, run_url, producer, result, evidence_path, reviewer, residual_risk`. Nunca armazenar secrets em log. Nenhum desses testes foi efetivamente executado nesta Work Order de planejamento.
