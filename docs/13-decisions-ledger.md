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
