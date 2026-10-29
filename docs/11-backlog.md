# 11 — Backlog / Roadmap proposto
IDs estáveis; não equivalem a issues já criadas. Avançar **somente depois de APPROVED** do incremento corrente.
| ID | Classe | Resultado e gate |
|---|---|---|
| KOR-PLAN-001 | NECESSARY | Source Pack inicial, PR e auditoria |
| KOR-DISC-002 | NECESSARY | Descoberta comercial e definição do caso de uso |
| KOR-LEGAL-003 | NECESSARY | Marca/INPI, licenças e direitos comerciais |
| KOR-UPSTREAM-004 | NECESSARY | Auditoria técnica OpenBot/Intelligence com SHA pinado |
| KOR-INFRA-005 | NECESSARY | Baseline VPS/custos/segurança, sem deploy |
| KOR-ADR-006 | NECESSARY | Escolher arquitetura, provedor IA, CRM e canal |
| KOR-SEC-007 | NECESSARY | Threat model e critérios de isolamento |
| KOR-CONTRACT-008 | NECESSARY | API/data contracts e critérios de teste |
| KOR-POC-009 | NECESSARY | Prova técnica sintética em staging |
| KOR-AUTH-010 | NECESSARY | Identidade/papéis e testes negativos |
| KOR-INGEST-011 | NECESSARY | Recepção, normalização, deduplicação |
| KOR-AGENT-012 | NECESSARY | Classificação controlada e avaliação |
| KOR-GATE-013 | NECESSARY | Aprovação humana vinculada a payload |
| KOR-CRM-014 | NECESSARY | Integração oficial CRM sandbox |
| KOR-OPS-015 | NECESSARY | Audit, custos, quotas e STOP |
| KOR-UI-016 | NECESSARY | Dashboard e E2E |
| KOR-RECOVERY-017 | NECESSARY | Backup/restore/incident |
| KOR-HARDEN-018 | NECESSARY | Security, benchmark e gates CI |
| KOR-PILOT-019 | NECESSARY | Piloto autorizado com métricas |
| KOR-RELEASE-020 | NECESSARY | Auditoria DoD e decisão de release |
| KOR-BILL-021 | IMPORTANT | Faturamento automático |
| KOR-PORTAL-022 | IMPORTANT | Portal NexLabs + provisionamento |
| KOR-SCALE-023 | FUTURE | Multi-tenancy físico compartilhado |
| KOR-STUDIO-024 | FUTURE | Designer de fluxos/marketplace |

Não fabricar 500 issues antes de escopo aprovado. Cada item vira Work Order com testes/evidência e PR própria após contexto lock. Se falhar, Correction Delta no mesmo ID, sem começar próximo.

## Sequenciamento novo solicitado pelo fundador em 2026-10-29 (planejamento, sem reescrever IDs)
**Nexlabs Technology** determinou que o primeiro módulo a ser planejado em detalhe seja **KOR-M01-ECC-PLAN-001 — ECC & Engineering Foundation**, antes de iniciar KOR-DISC-002. Esta precedência não muda a classe/identidade de KOR-DISC-002 nem aprova a implementação do produto; cria um **módulo habilitador de engenharia** em paralelo ao roadmap canônico.
- Epic M01 [#5](https://github.com/KayzenRoot/koros/issues/5) e issues técnicas [#6–#20](https://github.com/KayzenRoot/koros/issues/5).
- [Plano canônico M01](modules/M01-ECC/README.md), [módulos futuros propostos](modules/README.md), [decisões pendentes](modules/M01-ECC/decisions.md).
- Estado: PLAN_DRAFT / PLANNED; ECC ainda não instalado, workflows futuros NOT_RUN. A transição para implementação ou novo módulo requer aceites e WOs separadas.
