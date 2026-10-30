# KOR-ROADMAP-001 | Planejamento dos módulos KOROS
**Nexlabs Technology | 2026-10-30 | PLANNED / NOT_IMPLEMENTED**

## Fonte de verdade e decisões
A main protegida fornece o Source Pack (docs/). As decisões de PRODUCT-M01 estão na [PR #36 Draft](https://github.com/KayzenRoot/koros/pull/36), que ainda NÃO foi mergeada. Foram aprovados para planejamento: SaaS gerenciado, core multissetorial, leads próprios de consultorias comerciais B2B, fluxo supervisionado lead→CRM, aprovação humana no servidor, Agendor REST v3 como referência sintética e HubSpot DBV/Projects como referência de portabilidade, sem troca compulsória de CRM. Na issue #24 o fundador aceitou os critérios para validação futura, sem contatar clientes.

**Nova prioridade:** preparar todas as issues de PRODUCT-M02..M09 para começar implementação sintética, sem ciclos repetidos de pesquisa comercial. Preservar a hierarquia Source Pack e ADRs pendentes.

## Matriz de módulos
| Módulo | Epic | WOs registradas | Situação |
|---|---|---|---|
| M01 descoberta | [#23](https://github.com/KayzenRoot/koros/issues/23) | #24..#35, existentes | documentação PR #36 Draft, não validada comercialmente |
| M02 fundação/auth | [#37](https://github.com/KayzenRoot/koros/issues/37) | #45..#47 | NECESSARY |
| M03 leads/CRM | [#38](https://github.com/KayzenRoot/koros/issues/38) | #48..#50 | NECESSARY |
| M04 workflow/IA/approval | [#39](https://github.com/KayzenRoot/koros/issues/39) | #51..#54 | NECESSARY |
| M05 dashboard/templates | [#40](https://github.com/KayzenRoot/koros/issues/40) | #55..#57 | NECESSARY |
| M06 setup/restore | [#41](https://github.com/KayzenRoot/koros/issues/41) | #58..#60 | NECESSARY |
| M07 qualidade/segurança | [#42](https://github.com/KayzenRoot/koros/issues/42) | #61..#63 | NECESSARY |
| M08 custos/portal | [#43](https://github.com/KayzenRoot/koros/issues/43) | #64..#65 | custos essenciais; portal/billing IMPORTANT |
| M09 E2E/release | [#44](https://github.com/KayzenRoot/koros/issues/44) | #66..#67 | E2E necessário; lançamento separado |

**Total novo:** oito epics (#37..#44) e vinte e três Work Orders (#45..#67), além de M01 preexistente. M02..M09 são módulos planejados, não produtos entregues. Cada WO contém objetivo, contexto, escopo, fora de escopo, fontes, requisitos, arquitetura, restrições, aceite, testes, entregáveis, review e STOP.

## Sequência e gates
[Ordem completa, IDs e requisitos](execution-queue.md). Primeiro incremento: [KOR-PM02-WO-001 / #45](https://github.com/KayzenRoot/koros/issues/45), escolher baseline de arquitetura executável e avaliar código próprio versus OpenBot, licenças e contratos de runtime. Não usar OpenBot/Intelligence sem comprovação. Opção de execução greenfield é candidata, não ADR automaticamente aprovada.

M02 → M03 → M04 → M05 → M06 → M09; CI e threat model de M07 iniciam assim que existir skeleton e acompanham a implementação; M08 prepara custos, não transações.

## Deferimento administrativo sem enfraquecer segurança
**DEFERRED_FOR_BUILD:** INPI, registro de empresa, emissão fiscal, contas de pagamento, contratos/contato de clientes, validação de campo, compra de VPS e lançamento comercial. Essas pendências voltam como gates antes de vender, acessar dados reais ou operar em produção. **NÃO diferidos:** licenças das dependências usadas no código, segurança, autorização, isolamento, privacidade by design, RLS/RBAC conforme stack, CI, testes e auditoria.

## Definition of Ready e DoD
Cada execução requer Context Lock com base/head e fingerprints de checkpoint, Scope, Architecture, DoD e ADRs relevantes; rebase em STALE. Executor inspeciona repo, implementa somente a WO, roda testes conforme risco, corrige regressões, commita/push e abre PR com Evidence Bundle. Auditoria em PT-BR decide APPROVED, CORRECTION REQUIRED ou BLOCKED, sem avançar com HIGH/CRITICAL. Atualizar checkpoint apenas após auditoria. Nenhuma PR de software ou deploy foi iniciada por este planejamento.

**Estados:** ISSUES_PREPARED=YES; APP_CODE=NOT_STARTED; TESTS_APP=NOT_RUN; MARKET_VALIDATED=NO; LEGAL_ADMIN=DEFERRED_FOR_BUILD; PRODUCTION=BLOCKED.
