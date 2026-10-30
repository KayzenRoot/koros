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

## KOR-ROADMAP-001 | Módulos técnicos criados (2026-10-30)
Por decisão explícita do fundador, todas as issues de engenharia dos PRODUCT-M02..M09 foram preparadas: epics #37..#44 e WOs #45..#67. M01 permanece em #23..#35, decisões ainda na PR #36 Draft. [Roadmap](product-roadmap/README.md) · [Fila](product-roadmap/execution-queue.md) · [Evidências](../evidence/KOR-ROADMAP-001/README.md).
Primeira WO NECESSARY #45. Empresa/INPI, registros fiscais, entrevistas, contratos de clientes e produção adiados para comercialização, **sem dispensar licença do código, segurança, testes e LGPD por design**. Classes IMPORTANT/FUTURE não entram automaticamente no MVP. WOs criadas não são código implementado.
