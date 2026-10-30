# 13 — Decisions Ledger / ADRs
| ID | Status | Conteúdo e limites |
|---|---|---|
| ADR-001 | APPROVED_FOR_PLANNING | Usar KOROS como nome interno do produto da Next Labs; marca não liberada |
| ADR-002 | APPROVED_DIRECTION | SaaS B2B para automação com IA e dashboard, alvo VPS/cloud |
| ADR-003 | APPROVED_STRUCTURE | Implementação uma vez + mensal/trimestral/semestral/anual |
| ADR-004 | APPROVED_PROCESS | Governança com Source Pack, Work Order, Context Lock e PR |
| ADR-005 | PROPOSED | Piloto inicial leads → CRM com aprovação humana |
| ADR-006 | PENDING | Escolher OpenBot/Intelligence e direitos de dependências |
| ADR-007 | PROPOSED | Deploy dedicado por empresa no MVP |
| ADR-008 | PENDING | Tabela de preços, cotas, desconto e cobrança |
| ADR-009 | PENDING | LLM, CRM, canal, VPS, orçamento e metas |
| ADR-010 | PENDING | Clearance jurídico de KOROS para venda |
| ADR-011 | PENDING | Implementação real de políticas e sandbox |

Somente o fundador/autoridade designada promove decisões de produto; auditor valida evidências objetivamente. Não transformar 'PROPOSED' em 'APPROVED' pela redação. Se marca comercial falhar, manter code name e decidir novo nome via ADR, sem renomear dados/repo destrutivamente. Após cada auditoria aprovada, atualizar checkpoint e docs afetados.

## Política aprovada após mudança de rumo (2026-10-29)
| ID | Status | Decisão |
|---|---|---|
| ADR-012 | **APPROVED_DIRECTION** | Nexlabs Technology retirou qualquer requisito de ECC plugin/hosted, trust, hooks, MCP e check-runs do fluxo obrigatório. Skills podem ser consultadas **somente quando úteis**, nunca como gate. Não há autorização implícita de desinstalação no PC ou de alterar permissões de App de terceiros. Preservar `governance-docs` GitHub Actions, ruleset e proteção da main. |
| ADR-013 | **PROPOSED** | KOROS será core genérico multissetorial, com templates e conectores configuráveis, a validar em PRODUCT-M01. |
| ADR-014 | **PENDING_DECISION** | Modalidade inicial: SaaS administrado com isolamento por cliente, self-host guiado ou híbrido de início. |
| ADR-015 | **PENDING_DECISION** | Segmento inicial, dor prioritária, primeiro workflow e critérios de viabilidade comercial. |

O cancelamento de ECC não prova produto ou pipeline de testes de aplicativo instalado; controles documentais existentes continuam em vigor. Nova análise e escolha do fundador serão registradas em `docs/product-m01/decisions.md`.

## Atualização válida mais recente para as ADRs de produto (2026-10-29)
O fundador aprovou as cinco escolhas PM01-D01..D05. Esta seção **substitui o status PROPOSED/PENDING** das entradas equivalentes anteriores (ADR-005, ADR-007, ADR-013..015) **somente como direção de planejamento**, sem apagar o histórico.

| ADR / decisão | Status atual | Diretriz aceita | Limites |
|---|---|---|---|
| ADR-013 / PM01-D03 | APPROVED_FOR_PLANNING | Core genérico multissetorial, templates versionados, conectores oficiais e política fora da IA | Stack, isolamento físico e implementação PENDING |
| ADR-014 / PM01-D02 | APPROVED_FOR_PLANNING | SaaS gerenciado inicial, self-host planejado para fase posterior | Nenhum deploy, cloud/instalador/benchmark aprovado |
| ADR-015 / PM01-D01/D04 | APPROVED_FOR_PLANNING | Serviços com leads/agendamentos como público inicial; primeiro fluxo leads→CRM com aprovação humana | ICP específico, provedor CRM, canal, preços, clientes e licenças PENDING |
| PM01-D05 | APPROVED_FOR_PLANNING | IA apenas propõe/classifica, servidor autoriza por política explícita e approval válida | RBAC, hashes, logs e testes ainda NOT_IMPLEMENTED |

Detalhes e riscos em [decisões do produto](product-m01/decisions.md). **ADR-006/ADR-008/ADR-009/ADR-010/ADR-011 continuam PENDING.** Nenhuma aprovação para ECC obrigatório; ADR-012 permanece em vigor.

## Decisão subsidiária de referência de CRM — 2026-10-30
| ID | Status | Escopo aprovado |
|---|---|---|
| PM01-D01-S1-CRM-REF-01 | **APPROVED_FOR_PLANNING — A** | Para [issue #24](https://github.com/KayzenRoot/koros/issues/24), modelar **Agendor REST v3** como primeira referência documental sintética de **Pessoa/Contato** e **HubSpot DBV/Projects** como segunda referência de portabilidade. **Sem exigir migração de CRM pelos clientes**, sem decisão de fornecedor de produção, conta, API real, licença ou gasto. |

**Semântica:** ADR-009 (seleção do CRM de produção/LLM/canal) continua PENDING. O aceite serve unicamente à especificação de um contrato de referência, não altera a arquitetura canônica ainda não aprovada. [Detalhes e riscos](product-m01/crm-reference-agendor-vs-hubspot.md), [análise PLAN_READY de #24](../evidence/KOR-DISC-002/issue24-plan-ready-audit.md). Não alterar `main` sem PR protegida/aceite de merge separado.
