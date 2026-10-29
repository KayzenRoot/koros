# Nexlabs Technology — KOROS | Planejamento modular
**Empresa:** Nexlabs Technology · **Produto:** KOROS (nome comercial provisório) · **Fonte da verdade:** este repositório GitHub.  
**Estado:** roadmap PROPOSED / não implementado. **Atualização:** 2026-10-29.

## Contrato do programa de engenharia
1. Discutir **um módulo por vez** no chat; o fundador escolhe alternativas e aceita uma matriz de decisões antes de qualquer implementação.
2. Registrar no GitHub: especificação canônica, Epic, todas as issues NECESSARY do módulo, dependências, riscos, test matrix, Evidence Bundle e checkpoint.
3. Planejamento em branch + PR Draft. Somente após aceite técnico/documental, avançar para WOs de implementação em PRs pequenas, com SHA Context Lock, CI e squash normal após autorização. Não assumir APPROVED independente por COMMENTED.
4. Documentar estado separadamente: PROPOSED, PLAN_APPROVED, IMPLEMENTING, IMPLEMENTED_VERIFIED, BLOCKED. 100% de issues criadas **não** significa 100% de software concluído.
5. Custos em GitHub/CI para esta fundação: **R$0**, sem plataformas Pro, bigger runners, upgrades ou deploy. Se exigir custo, STOP e alternativa.
6. Não produzir 500 issues antecipadamente: abrir issues de execução detalhadas **somente para o módulo em discussão**, não todos os módulos futuros.

## Produto transversal (diretriz do fundador, ainda sujeita a ADR)
KOROS pretende atender comércios e prestadores de serviço de vários segmentos. Separar **core agnóstico ao setor** de **conectores, templates de workflows e configurações do cliente**; priorizar instalação e onboarding simples, isolamento e mínimo privilégio. Nunca incorporar ECC no pacote distribuído ao cliente. O ECC existe apenas no ambiente de desenvolvimento da Nexlabs Technology.

## Ordem de módulos (proposta, não decisões técnicas fechadas)
| Módulo | Resultado pretendido | Estado |
|---|---|---|
| **M01 ECC & Engineering Foundation** | Ambiente Codex, ECC OSS, ECC Tools Free, skills, MCP, segurança e CI profissional | **PLANNED**, [Epic #5](https://github.com/KayzenRoot/koros/issues/5), [documento](M01-ECC/README.md) |
| **M02 Discovery & product boundaries** | Descoberta comercial KOR-DISC-002, segmentos, primeira vertical e ROI | PROPOSED / NÃO INICIADO |
| M03 Product core & tenant contracts | Core genérico, tenancy/identidade/permissões e extensibilidade | PROPOSED / NÃO INICIADO |
| M04 Install & Customer Onboarding | Instalação por cliente, provisionamento, assistente de setup e atualizações | PROPOSED / NÃO INICIADO |
| M05 Connectors & Channels | Arquitetura plugável de ERP/CRM/WhatsApp/APIs autorizadas | PROPOSED / NÃO INICIADO |
| M06 Agent & Workflow Runtime | Política fora da IA, orquestração, execuções e limites | PROPOSED / NÃO INICIADO |
| M07 Human Gates & Audit | Aprovações humanas, idempotência, rastreio e recuperação | PROPOSED / NÃO INICIADO |
| M08 Management UI & Templates | Dashboard, perfis de negócio, editor/configuração dos fluxos | PROPOSED / NÃO INICIADO |
| M09 Operations, Metering & Security | Monitoramento, quotas, custos, backup, LGPD, isolamento | PROPOSED / NÃO INICIADO |
| M10 Commercial & Pilot Release | Validação paga, precificação, faturamento, pilotos e release | PROPOSED / NÃO INICIADO |

**Atenção:** essa lista é uma hipótese modular, **não substitui** o [backlog canônico já aprovado para planejamento](../11-backlog.md). Futuras mudanças precisam de ADR e aceite, mantendo IDs KOR-DISC-002..KOR-STUDIO-024 estáveis.

## M01
Ler [especificação canônica](M01-ECC/README.md), [decisões](M01-ECC/decisions.md), [pipeline](M01-ECC/ci-quality-gates.md), [harness/MCP](M01-ECC/harness-mcp-skills.md), [aceite](M01-ECC/acceptance-and-issues.md) e [Evidence Bundle](../../evidence/KOR-M01-ECC-PLAN-001/README.md).
