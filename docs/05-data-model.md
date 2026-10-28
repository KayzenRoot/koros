# 05 — Data Model (conceitual)
Nenhuma tabela/migration criada. Deployment separado por empresa. Dados mínimos:
| Entidade | Chave | Campos e invariantes |
|---|---|---|
| Organization | organization_id | identidade, contrato, status |
| Member | member_id | auth_subject, role, revocation |
| Connection | connection_id | provider, scopes, secret_ref write-only |
| WorkflowDefinition | workflow_id + version | input_schema, approval_policy versionada |
| Lead | lead_id | external_id, source, PII minimizada |
| Run | run_id | origin, actor, workflow_version, estado |
| Approval | approval_id | run_id, approver, hash_payload, validade |
| OutboxAction | action_id | idempotency_key unique, retries, target |
| AuditEvent | event_id | run_id, actor, decisão, regra, outcome (append-only) |
| UsageLedger | usage_id | run_id, tokens e custo estimado (não faturamento real) |
| Subscription | agreement_id | cobrança por período, taxa de implantação, limites |
| RetentionPolicy | policy_id | finalidade, classe, prazo, exclusão |

Definir FK/unique, gestão de concorrência, outbox transacional, criptografia, segregação por tenant e migração reversível quando houver implementação. Prazos de retenção permanecem PENDING por contrato e LGPD. Nenhum dado real ou esquema de produção alegado.
