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

## Registro técnico de escopo restrito da WO #45 — 2026-10-30
| ID | Status desta PR | Alcance preciso |
|---|---|---|
| ADR-016 / KOR-PM02-WO-001 | **PROPOSED_IN_PR; DECIDED_FOR_WO_ONLY** | Baseline independente Node.js ESM e core HTTP nativo para dados sintéticos, sem pacotes npm de terceiros; [detalhes](architecture/ADR-016-runtime-baseline.md). Sem herdar autorização de deploy, CRM, IA ou dados reais. |

**Compatibilidade:** ADR-006 (OpenBot/Intelligence/licenças de integração) e ADR-009 (LLM, CRM e produção) permanecem **PENDING**. A decisão mínima da WO não os substitui nem cria direito comercial. Node.js e ações GitHub são dependências de tooling sob licenças open-source próprias, com versões/pins registradas. Não promover esta seção à main sem auditoria e merge legítimos.

## Read-back pós-merge — ADR-016 / WO #45 — 2026-10-30 (delta documental PROPOSTO)
O baseline Node.js independente da **WO KOR-PM02-WO-001** entrou em `main=e24d7cf458f61d1b98850f34a304023ee1d87ce1` via PR #69 squash normal, árvore idêntica à aprovada. Portanto a decisão limitada de runtime está **IMPLEMENTED_FOR_SCOPED_BASELINE**, não é aprovação de toda a arquitetura do KOROS, não converte a `ADR-006` (upstream/licença) nem a `ADR-009` (CRM/LLM/produção) de PENDING, e não licencia produto a terceiros. Este registro complementar exige merge protegido da PR documental própria antes de ser canônico na `main`.
