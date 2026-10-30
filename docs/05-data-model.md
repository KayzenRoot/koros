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

## Implementação sintética de M02-WO-003 (2026-10-30, PROPOSED_IN_PR)

O schema físico mínimo está em [db/migrations/0001_init.sql](../db/migrations/0001_init.sql), com migrations up/down, RLS por `tenant_id`, auditoria append-only e seeds sintéticos em [db/seeds/synthetic.sql](../db/seeds/synthetic.sql). A prova local e as limitações estão no [Evidence Bundle](../evidence/KOR-PM02-WO-003/README.md).

**Limites:** a WO #47 não adiciona driver de runtime nem autenticação. O papel `koros_app` pode definir `app.tenant_id`; a #46 deve vincular a sessão autenticada ao tenant e à membership. `users` permanece global por design. Nenhum merge, dado real ou produção é declarado.

## Outbox da M03-WO-003 (2026-10-30; PROPOSED_IN_PR)

A migration [0003_outbox.sql](../db/migrations/0003_outbox.sql) estende `outbox_actions` com `source`, `external_id`, `payload_version`, `payload` JSONB, `approval_id`, `approval_expires_at`, `lease_expires_at`, `reconciliations`, `last_error_code`, `updated_at` e `completed_at`. O status ganha `PAUSED` para quota esgotada.

Invariantes: `payload` é objeto JSON sintético sem segredo; `payload_version > 0`; `reconciliations >= 0`; a tupla `(tenant_id, source, external_id, payload_version)` tem índice único parcial; há índices de claim por `(tenant_id, status, next_attempt_at)` e de lease por `(status, lease_expires_at)`. A FK de aprovação aponta para `approvals(approval_id)` e é `ON DELETE SET NULL`.

O rollback de desenvolvimento remove as colunas e restaura o check antigo; linhas `PAUSED` são convertidas em `FAILED` antes da restauração. Produção continua exigindo backup/restore, não este down. Nenhum dado real é usado.

## FSM de runs da M04-WO-001 (2026-10-30; PROPOSED_IN_PR)

A migration [0004_workflow_fsm.sql](../db/migrations/0004_workflow_fsm.sql) amplia o check de `runs.state` com `PROPOSED`, `QUEUED`, `RECONCILING` e `PAUSED`, mantendo os estados legados da M02/M03 (`DISPATCHING`, `BLOCKED`, `UNCERTAIN_EXTERNAL_RESULT`, entre outros) para compatibilidade de linhas existentes.

Não há tabela nova: a trilha de transições usa `audit_events` com `action='RUN_STATE_CHANGED'` e metadata `{from,to,reason}`, além de `RUN_CREATED`. A unicidade de criação continua em `(tenant_id, idempotency_key)`. O rollback de desenvolvimento mapeia os quatro estados novos para o estado legado mais próximo antes de restaurar o check antigo; produção exige backup/restore.

## Approval gate da M04-WO-003 (2026-10-30; PROPOSED_IN_PR)

A migration [0005_approval_gate.sql](../db/migrations/0005_approval_gate.sql) estende `approvals` com `scope`, `proposed_operation` JSONB, `field_allowlist`, `payload_version`, `operation_hash`, `token_hash`, `requested_by`, `decided_by`, `revoked_at` e `revoked_by`. O check de decisão passa a aceitar `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED` e `REVOKED`.

`payload_hash` continua sendo o SHA-256 do contato canônico usado pelo outbox; `operation_hash` vincula scope, payload, campos e versão. `token_hash` é SHA-256 de token one-time, com 64 caracteres; a revogação exige `revoked_at` e `revoked_by` juntos. O rollback de desenvolvimento converte decisões novas em `REJECTED` antes de restaurar o check antigo; produção exige backup/restore.

## Controles da M04-WO-004 (2026-10-30; PROPOSED_IN_PR)

A migration [0006_audit_cost_killswitch.sql](../db/migrations/0006_audit_cost_killswitch.sql) adiciona `audit_seq` (identity), `correlation_id`, `prev_hash` e `event_hash` a `audit_events`; `correlation_id`, `operation`, `status` (`RESERVED`/`SETTLED`/`RELEASED`) e `updated_at` a `usage_ledger`; e cria `budget_policies` e `tenant_controls`, ambas com RLS por tenant.

`tenant_controls` tem um switch fail-closed por tenant. `budget_policies` tem um período e limites de tokens/custo. O down de desenvolvimento remove as tabelas/colunas e restaura o schema anterior; produção exige backup/restore. Linhas de auditoria legadas sem hash permanecem válidas como histórico append-only, mas não entram na cadeia verificável.

## Templates da M05-WO-003 (2026-10-30; PROPOSED_IN_PR)

A migration [0007_templates.sql](../db/migrations/0007_templates.sql) cria `workflow_templates` e `workflow_template_versions` com RLS por tenant. Cada versão tem `version`, `config` JSONB, `config_hash` SHA-256 e autoria; a unique `(template_id, version)` e o grant apenas `SELECT,INSERT` tornam versões imutáveis para o app role.

`approvals` ganha `template_version_id` com FK composta por tenant, permitindo invalidar aprovações incompatíveis quando uma nova versão muda source, campos, mapeamento, operação/target ou scope. O down de desenvolvimento remove a coluna/FK/tabelas; produção exige backup/restore.

