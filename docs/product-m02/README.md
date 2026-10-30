# PRODUCT-M02 | Contrato técnico de dados, tenancy e autenticação

**Nexlabs Technology · KOROS · 2026-10-30**
**Estado:** `PLANNED / PROPOSED_FOR_FOUNDER_APPROVAL` · **Código:** NOT_STARTED · **Banco:** NOT_CREATED · **Auth:** NOT_IMPLEMENTED · **Custo:** R$0.
**Módulo:** [Epic PRODUCT-M02 #37](https://github.com/KayzenRoot/koros/issues/37) · **WOs:** [#47](https://github.com/KayzenRoot/koros/issues/47) e [#46](https://github.com/KayzenRoot/koros/issues/46) · **Base:** `main` `21ed96b05aa5a567089b384f11d4a202ca290328` (2026-10-30).

## 1. Por que este plano existe

O baseline técnico de M02-WO-001 (#45 / PR #69) e o CI gratuito (M07-WO-001 / #61 / PR #71) já estão na `main`. O que existe é apenas um runtime Node.js ESM com três GET em loopback, envelope tenant estrutural, testes e CI. **Não existem** banco, migrations, login, RBAC, sessão, isolamento real por tenant ou dados persistidos.

Este documento fecha o contrato de planejamento para as duas próximas WOs:

1. **#47 — dados e migrations:** schema mínimo, constraints, RLS, auditoria append-only e fixtures sintéticas.
2. **#46 — autenticação, RBAC e isolamento:** sessão server-side, papéis, autorização deny-by-default e testes cross-tenant.

Nenhuma decisão aqui autoriza código, dependência, conta, banco real, dados de cliente, deploy, gasto ou merge. As decisões abaixo são **propostas** e precisam de aceite do fundador antes da execução.

## 2. Fronteira de escopo

**Incluído em M02:** organizações/tenants, usuários, memberships, sessões, papéis fixos, permissões por ação, schema de dados do fluxo lead→CRM, migrations, RLS, auditoria, fixtures sintéticas e testes negativos de isolamento.

**Fora de M02:** CRM real, chamadas de API externas, LLM, classificação, worker/outbox de dispatch, dashboard, billing, onboarding guiado, deploy, dados pessoais reais e contratos comerciais. ADR-006 (OpenBot/Intelligence) e ADR-009 (LLM/CRM/produção) **permanecem PENDING** e não são resolvidos por este plano.

## 3. Decisões propostas

| ID | Decisão proposta | Motivo | Alternativa rejeitada/adiada |
|---|---|---|---|
| **D-M02-01** | PostgreSQL 16+ como banco do MVP SaaS, com RLS nativa | Isolamento por tenant verificável no banco, transações, constraints e caminho para produção | SQLite fica apenas como possível teste local, não como banco SaaS; banco em memória adiaria a prova de isolamento |
| **D-M02-02** | `tenant_id` em todas as tabelas de tenant + RLS + verificação server-side | Defesa em profundidade: nem o cliente nem a IA escolhem o tenant | Confiar só em `WHERE tenant_id = ?` na aplicação é insuficiente |
| **D-M02-03** | Sessão server-side com cookie HttpOnly/Secure/SameSite e token opaco hasheado no banco | Revogação imediata, sem JWT em localStorage, sem provedor pago | JWT local, Auth0/Clerk pagos ou login social ficam fora do MVP |
| **D-M02-04** | Hash de senha com `crypto.scrypt` nativo do Node, salt por usuário | Zero dependência npm e algoritmo disponível no runtime | Argon2id exige dependência; revisar em ADR futuro se licença/benefício justificarem |
| **D-M02-05** | Papéis fixos: owner, admin, approver, operator, viewer | Matriz simples e auditável para o MVP | Papéis customizados e permissões dinâmicas ficam para depois |
| **D-M02-06** | Migrations SQL versionadas + runner Node próprio, lock e checksum | Sem ORM/dependência; schema explícito e reproduzível | ORM/migration framework adiciona dependência e mágica |
| **D-M02-07** | Forward-only em produção; down migrations apenas para dev/test; rollback de produção por backup/restore | Evita migração destrutiva em dados reais | Down migration em produção não é plano de recuperação |
| **D-M02-08** | Auditoria append-only com `INSERT`/`SELECT`, sem `UPDATE`/`DELETE` para o papel da aplicação | Trilha confiável por run/ator | Log de aplicação sem tabela auditável não satisfaz R-08 |
| **D-M02-09** | Segredos somente por `secret_ref`; fixtures usam variáveis locais sintéticas | Nenhum token no Git, banco, prompt ou log | Guardar segredo em coluna comum é proibido |
| **D-M02-10** | M02 não escolhe OpenBot, LLM, CRM ou VPS | Mantém ADR-006/009 PENDING e evita lock-in prematuro | Escolher stack completa agora amplia risco e escopo |

## 4. Modelo de dados mínimo

Todas as tabelas de tenant carregam `tenant_id uuid not null`, timestamps UTC e constraints explícitas. `organizations` é a raiz; `users` é global; `memberships` liga usuário a tenant com papel. Nomes finais podem mudar na WO #47, mas as invariantes não.

| Tabela | Campos mínimos | Invariantes |
|---|---|---|
| `organizations` | `tenant_id`, `name`, `status`, `created_at`, `updated_at` | `status` em `ACTIVE/SUSPENDED/CLOSED`; nenhum dado de cliente real |
| `users` | `user_id`, `email_normalized`, `password_hash`, `status`, `created_at` | e-mail único normalizado; `password_hash` nunca retornado por API |
| `memberships` | `membership_id`, `tenant_id`, `user_id`, `role`, `status`, `created_at` | unique `(tenant_id, user_id)`; role no conjunto fixo; revogação explícita |
| `sessions` | `session_id`, `user_id`, `tenant_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at` | token opaco armazenado só como hash; unique `token_hash`; expiração e revogação |
| `connections` | `connection_id`, `tenant_id`, `provider`, `scopes`, `secret_ref`, `status` | unique `(tenant_id, provider, external_account)`; `secret_ref` write-only |
| `workflows` | `workflow_id`, `tenant_id`, `name`, `status`, `created_at` | nome único por tenant; workflow pertence a um tenant |
| `workflow_versions` | `workflow_version_id`, `workflow_id`, `tenant_id`, `version`, `input_schema`, `approval_policy`, `created_at` | unique `(workflow_id, version)`; versão imutável após uso |
| `inbound_events` | `event_id`, `tenant_id`, `provider`, `external_id`, `body_hash`, `signature_status`, `received_at` | unique `(tenant_id, provider, external_id)`; replay não cria execução |
| `leads` | `lead_id`, `tenant_id`, `event_id`, `external_id`, `source`, `status`, `minimal_fields`, `consent_status` | unique `(tenant_id, source, external_id)`; PII mínima |
| `runs` | `run_id`, `tenant_id`, `lead_id`, `workflow_version_id`, `state`, `idempotency_key`, `created_at`, `updated_at` | unique `(tenant_id, idempotency_key)`; estado na FSM documentada |
| `classifications` | `classification_id`, `tenant_id`, `run_id`, `schema_version`, `labels`, `explanation`, `uncertainty` | saída estruturada; não autoriza ação |
| `approvals` | `approval_id`, `tenant_id`, `run_id`, `actor_user_id`, `payload_hash`, `decision`, `expires_at`, `decided_at` | unique `(run_id, payload_hash)`; decisão vinculada ao payload exato |
| `outbox_actions` | `action_id`, `tenant_id`, `run_id`, `operation_key`, `target`, `payload_hash`, `status`, `attempts`, `next_attempt_at` | unique `(tenant_id, operation_key)`; nenhum dispatch sem approval |
| `audit_events` | `event_id`, `tenant_id`, `run_id`, `actor_user_id`, `action`, `entity`, `entity_id`, `before_hash`, `after_hash`, `metadata`, `created_at` | append-only; sem update/delete para o papel da app |
| `usage_ledger` | `usage_id`, `tenant_id`, `run_id`, `provider`, `tokens`, `cost_estimate`, `created_at` | custo estimado, não faturamento real |
| `retention_policies` | `policy_id`, `tenant_id`, `data_class`, `retention_days`, `purpose` | prazo e finalidade explícitos; LGPD/contrato ainda PENDING |

**Regras transversais:** FKs sempre incluem `tenant_id` quando a entidade é tenant-scoped; nenhuma FK entre tenants; `created_at`/`updated_at` em UTC; JSONB apenas para payloads versionados e metadados de auditoria; nenhum campo livre para token/segredo.

## 5. Tenancy e RLS

1. O servidor autentica a sessão, resolve `user_id` e `tenant_id` da sessão — nunca de `body`, query ou header do cliente.
2. Cada transação faz `SET LOCAL app.tenant_id = $1` antes das queries de tenant.
3. Todas as tabelas tenant-scoped têm `ENABLE ROW LEVEL SECURITY` e policies `USING`/`WITH CHECK` baseadas em `current_setting('app.tenant_id')::uuid`.
4. O papel da aplicação não é superuser e não pode `BYPASSRLS`; migrations usam papel separado.
5. `users` é global, mas respostas e joins só expõem o usuário da sessão/membership autorizada.
6. Testes negativos obrigatórios: leitura de tenant B retorna zero; insert com `tenant_id` B falha; update/delete cruzado falha; `SET ROLE`/`SET app.tenant_id` pelo cliente não é possível; IDOR e spoof de header falham.

## 6. Autenticação e sessão

- **Login:** e-mail normalizado + senha; verificação `scrypt` com salt por usuário e parâmetros versionados; resposta genérica para usuário/senha inválidos; rate limit por IP/e-mail.
- **Sessão:** token opaco aleatório (>= 32 bytes), armazenado apenas como SHA-256 no banco; cookie `__Host-koros_session` com `HttpOnly`, `Secure` em produção, `SameSite=Lax`; expiração absoluta e inatividade; rotação no login e em elevação de privilégio.
- **CSRF:** double-submit token para métodos mutáveis; `Origin`/`Referer` verificados; nenhuma escrita sem token válido.
- **Logout/revogação:** apaga/revoga a sessão; admin pode revogar memberships e sessões; troca de papel invalida sessões antigas quando necessário.
- **Auditoria:** login success/failure, logout, revogação, criação/alteração de membership, negação de acesso e alteração de papel.
- **Não incluído:** cadastro público, reset de senha por e-mail, MFA, SSO, login social, provedor pago. Ficam para WOs futuras.

## 7. RBAC

| Ação | owner | admin | approver | operator | viewer |
|---|---|---|---|---|---|
| Ler dashboard/execuções | sim | sim | sim | sim | sim |
| Criar/editar workflow | sim | sim | não | não | não |
| Aprovar/rejeitar run | sim | sim | sim | não | não |
| Executar/pausar automação | sim | sim | não | sim | não |
| Gerenciar memberships | sim | sim | não | não | não |
| Revogar sessões | sim | sim | não | não | não |
| Ver auditoria | sim | sim | sim | próprio run | não |
| Alterar configuração de tenant | sim | não | não | não | não |

Autorização é deny-by-default no servidor; a UI não é fonte de verdade. Nenhum papel se autoaprova; owner não contorna approval de payload. A matriz final será validada na WO #46 com testes de escalonamento.

## 8. Migrations e operação

- `migrations/NNNN_name.sql` idempotente por versão, checksum SHA-256 e tabela `schema_migrations`.
- Runner Node próprio, transação por migration, advisory lock para concorrência; falha = rollback da migration e STOP.
- `down/NNNN_name.down.sql` para dev/test; produção é forward-only, com backup/restore documentado.
- Seed sintético `seeds/synthetic.sql`: dois tenants, usuários de teste, leads e workflows fictícios; nenhum dado real.
- CI: serviço PostgreSQL efêmero no GitHub Actions; local: Docker Compose ou Postgres local documentado. Se o ambiente local não tiver Postgres, a WO deve registrar `NOT_RUN` e não substituir a prova de RLS por mock.
- Licença do driver `pg` (MIT) e versão pinada devem ser revisadas e registradas antes de adicionar a dependência; o guard de CI atual bloqueia npm não auditado.

## 9. Matriz de testes M02

| ID | Cenário | Resultado esperado |
|---|---|---|
| M02-A01 | Owner do tenant A faz login | Sessão criada, cookie seguro, auditoria |
| M02-A02 | Senha errada / usuário inexistente | Negação genérica, rate limit, auditoria |
| M02-A03 | Sessão expirada ou revogada | 401, sem dados |
| M02-A04 | CSRF ausente/inválido | 403, sem escrita |
| M02-A05 | Fixation/rotação de sessão | Token novo, antigo inválido |
| M02-A06 | Operator tenta aprovar | 403 server-side |
| M02-A07 | IDOR em recurso de outro usuário | 404/403, sem vazamento |
| M02-A08 | Tenant B tenta ler tenant A | Zero linhas / 403 |
| M02-A09 | Insert/update com tenant_id B | Falha de RLS/constraint |
| M02-A10 | Membership revogada | Sessões invalidadas, acesso negado |
| M02-D01 | Migrations up/down em banco limpo | Schema e checksum corretos |
| M02-D02 | Runner executado duas vezes | Idempotente, sem duplicar |
| M02-D03 | FK/unique cross-tenant | Constraint rejeita |
| M02-D04 | Audit update/delete | Negado para papel da app |
| M02-D05 | PII/segredo em log | Teste de redaction falha fechado |
| M02-D06 | Concorrência de migration | Advisory lock impede corrida |

T-01..T-12 completos continuam `NOT_RUN`; M02 cobre os subconjuntos de auth, tenancy e schema. CRM/LLM/worker ficam para M03/M04.

## 10. Sequência de execução

1. **#47 — dados/migrations** (primeiro): schema, RLS, audit, seeds, runner, testes M02-D01..D06. Depende do aceite das decisões D-M02-01/02/06/07/08/09.
2. **#46 — auth/RBAC** (segundo): usuários/memberships/sessões, login/logout, cookies, CSRF, rate limit, matriz de papéis, testes M02-A01..A10. Depende de #47 e do aceite de D-M02-03/04/05.
3. **#48/#49 — M03** somente depois de M02 aprovado; sem CRM real, apenas mock/contrato sintético.
4. Nenhuma WO começa antes de Context Lock, branch/PR própria, Evidence Bundle e CI no HEAD correto.

## 11. ADRs propostos

| ID | Status | Conteúdo |
|---|---|---|
| ADR-017 | PROPOSED_IN_PR | PostgreSQL + RLS como persistência/tenancy do MVP SaaS |
| ADR-018 | PROPOSED_IN_PR | Sessão server-side com scrypt, cookie opaco e CSRF |
| ADR-006 | PENDING | OpenBot/Intelligence e direitos de dependências; fora de M02 |
| ADR-009 | PENDING | LLM/CRM/canal/VPS/orçamento; fora de M02 |

A aprovação de ADR-017/018 não aprova ADR-006/009, não autoriza produção e não altera o baseline já mesclado.

## 12. Gates e STOP

- **Gate de aceite:** fundador aprova D-M02-01..10 e ADR-017/018; caso contrário, a WO #47 não começa.
- **Gate de licença:** `pg` MIT e versão pinada revisadas antes de qualquer dependência.
- **Gate de ambiente:** Postgres local/CI disponível; se não houver, `NOT_RUN` explícito, sem mock de RLS.
- **STOP:** cross-tenant, escrita sem approval, segredo em log, migration destrutiva, HIGH/CRITICAL, CI falho, dado real, custo ou ampliação de escopo. Correction Delta na mesma WO, sem avançar.

## 13. Read-back e evidência

- `main` `21ed96b05aa5a567089b384f11d4a202ca290328`; baseline #45/PR #69 e CI #61/PR #71 mesclados.
- Nenhum código, banco, dependência, conta ou dado real foi criado por este plano.
- PR #36 (PRODUCT-M01) e PR #68 (roadmap) continuam Draft; este documento entra na PR #68 como planejamento, não como produto.
- Evidence Bundle do roadmap atualizado com o read-back pós-merge e a fila reconciliada.

**Este é um plano. Não é arquitetura implementada, não é MVP e não é autorização de merge.**
