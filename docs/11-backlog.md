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

## Repriorização após mudança de escopo, 2026-10-29
- **Startup:** Nexlabs Technology; **produto:** KOROS.
- O fundador retirou a instalação e o funcionamento obrigatório do ECC dos gates do projeto. PRs #21/#22 encerradas sem merge; histórico da Epic #5 e issues #6–#20 encerradas como NOT_PLANNED exceto #13, cuja atualização foi recusada pelo controle de segurança da integração (não contornar).
- Skills de qualquer biblioteca são opcionais, sem implicar integração obrigatória no projeto, CI, hooks, MCPs, revisão ou release.
- **Workflow de main inalterado:** `.github/workflows/koros-governance.yml`, `governance-docs` required App 15368, ruleset #26074776 ativo e sem bypass. CI de aplicação e segurança adicionais somente quando existirem código/testes e checks verificáveis, de preferência com ferramentas gratuitas.
- **Próximo módulo de PRODUTO:** [KOR-DISC-002 / PRODUCT-M01](product-m01/README.md), [Epic #23](https://github.com/KayzenRoot/koros/issues/23), tarefas #24–#35. Supersede a priorização da integração ECC como M01 de engenharia, mas **não renumera** os IDs históricos.
- Não criar commits de aplicação nem deploy nem gastos. Planejamento e decisões de negócio devem ser aceitos pelo fundador antes de virar WOs de implementação.
