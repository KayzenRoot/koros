# 06 — Integration and API Contracts (proposta)
## Fonte
Uma fonte aprovada de lead via API/webhook do fornecedor com autenticação/assinatura, replay protection, schema, rate limit, privacidade e id externo único. Sem confirmar API e termos não há integração aprovada.

## CRM
Uma API oficial, primeiro em sandbox. Credencial de escopo mínimo, quotas, validação de consentimento e reconciliação no caso de timeout. Escrita somente com Approval válida para o payload final exato; a IA não chama diretamente um endpoint privilegiado.

## Máquina de estados
RECEIVED → VALIDATED → CLASSIFIED → PENDING_APPROVAL → APPROVED → DISPATCHING → COMPLETED; alternativas REJECTED / EXPIRED / FAILED / BLOCKED. Worker não pode saltar estados; duplicado não cria segunda ação.

## API conceitual NÃO implementada
GET /v1/runs, GET /v1/runs/{id}, POST /v1/approvals/{id}/decision, POST /v1/workflows/{id}/pause, GET /v1/usage, POST /v1/connections/{provider}/verify. OpenAPI, status HTTP, payloads, RBAC e eventos serão definidos antes do primeiro código.

## Falhas
Validação: falha permanente. Timeout/transiente: backoff com teto; resultado incerto: consultar external_id antes de tentar de novo; falha auth: conexão pausada; falha política: negada + auditada. Cada integração terá contrato/fixtures e documentação de custos/licença.

## Receptor de leads da M03-WO-001 (2026-10-30; PROPOSED_IN_PR)

Endpoint implementado em PR Draft: `POST /v1/webhooks/leads`, apenas com dados sintéticos.

Headers obrigatórios: `X-Koros-Tenant`, `X-Koros-Provider`, `X-Koros-Account`, `X-Koros-Timestamp` (epoch seconds), `X-Koros-Signature` (hex HMAC-SHA256 de `${timestamp}.${rawBody}`). A conexão é buscada por tenant/provider/account sob RLS; o `secret_ref` aponta para uma variável de ambiente e o segredo nunca é armazenado no banco/log.

Respostas: `202` aceito; `200` duplicado idempotente; `400` payload/schema inválido; `401` assinatura/timestamp/origem inválidos; `413` corpo acima de 16 KiB; `415` content-type inválido; `429` rate limit; `503` banco/segredo indisponível. A deduplicação usa `(tenant_id, provider, external_id)` e a inserção de lead é vinculada ao evento e ao tenant.

Fora deste incremento: classificação por IA, dispatch ao CRM, retries/outbox e reconciliação (M03-WO-002/003 e M04). Rate limit é em memória/por processo; não é distribuído.

## Adapter CRM mock da M03-WO-002 (2026-10-30; PROPOSED_IN_PR)

Contrato puro em `src/crm/contract.mjs`, sem I/O. O CRM real e qualquer fornecedor de produção permanecem **PENDING**; Agendor e HubSpot existem apenas como mocks em memória, sem token, API ou rede.

**Capacidades:** `contact.read` e `contact.upsert`. Um adapter sem a capacidade exigida retorna `ENTITLEMENT_DENIED` antes de qualquer leitura/escrita.

**Contato canônico:** somente `external_id`, `email`, `name` e `company_external_id`. Campo desconhecido retorna `UNAUTHORIZED_FIELD`; objeto/`external_id` ausente ou inválido retorna `INVALID_INPUT`; tenant fora do formato UUID retorna `INVALID_TENANT`. E-mail é normalizado (`trim` + lowercase) e o hash de aprovação usa a forma canônica, não o corpo bruto.

**Escrita:** `upsertPerson({ tenantId, contact, approval })` exige `approval.approved === true`, `approval.payloadHash` igual a SHA-256 do contato canônico ordenado e `approval.expiresAt` futuro. Sem aprovação: `APPROVAL_REQUIRED`; hash divergente: `APPROVAL_MISMATCH`; expirada: `APPROVAL_EXPIRED`.

**Idempotência e erros:** a chave é `(tenantId, externalId)`. Repetir o mesmo payload com aprovação válida retorna `created=false/updated=false`, sem nova versão. Payload diferente cria uma nova versão; e-mail já usado por outro contato no mesmo tenant retorna `CONFLICT`; leitura em outro tenant retorna `NOT_FOUND`. O mock limita-se a 1000 contatos e retorna `CAPACITY_EXCEEDED` ao ultrapassar.

**Portabilidade:** o mock Agendor expõe o formato sintético v3 (`id`, `externalId`, `name`, `email`, `companyExternalId`). O mock HubSpot expõe `properties` com `email`, `firstname`, `lastname`, `koros_external_id`, `koros_company_external_id` e `koros_name`; as propriedades `koros_*` tornam o mapeamento sem perda. Ambos implementam a mesma suíte de contrato.

Fora deste incremento: cliente HTTP real, OAuth/token, persistência do adapter, outbox/retry/reconciliação, classificação IA e UI. Evidência em [KOR-PM03-WO-002](../evidence/KOR-PM03-WO-002/README.md).

## Outbox transacional da M03-WO-003 (2026-10-30; PROPOSED_IN_PR)

Implementação local em `src/outbox/`, ainda sem CRM real. A chave idempotente é `tenant_id + source + external_id + payload_version`, materializada em `operation_key` (SHA-256 com separadores não ambíguos) e protegida pela unique `(tenant_id, operation_key)` e por um índice único parcial da tupla.

**Enqueue atômico.** `enqueueAction` cria a linha `PENDING` e move o run de `APPROVED` para `DISPATCHING` na mesma transação. Exige aprovação persistida `APPROVED`, não expirada, para o hash exato do contato; sem isso retorna `APPROVAL_REQUIRED`/`APPROVAL_EXPIRED`/`APPROVAL_MISMATCH`. Replay da mesma chave retorna a ação existente sem nova linha; payload diferente para a mesma versão retorna `IDEMPOTENCY_CONFLICT`.

**Claim e lease.** O worker reivindica uma ação com `FOR UPDATE SKIP LOCKED`, lease de 60 s e incremento de `attempts`. Duas filas simultâneas não recebem a mesma linha. Lease expirada vira `UNCERTAIN` com auditoria `OUTBOX_LEASE_EXPIRED`, nunca retry cego.

**Dispatch e retry.** Sucesso grava `COMPLETED` no outbox e no run, com auditoria. `429`, `5xx`, `TRANSIENT` e `UNAVAILABLE` reagendam `PENDING` com backoff exponencial de 5 s até 900 s e teto de 5 tentativas. `ETIMEDOUT`/timeout é `UNCERTAIN`: a próxima passagem consulta o `external_id` no adapter antes de qualquer novo upsert. `QUOTA_EXCEEDED` pausa em `PAUSED` e move o run para `BLOCKED`; a retomada é manual e revalida a aprovação. Erro de validação/autorização é terminal em `FAILED`.

**Reconciliação.** `getPerson` encontrado → `COMPLETED` sem segunda escrita. `NOT_FOUND` → `PENDING` com novo backoff após a checagem. Falha transiente durante a reconciliação → `UNCERTAIN` novamente. Todas as transições relevantes geram `audit_events`.

Fora deste incremento: scheduler distribuído, múltiplos workers em produção, CRM real, rate limit distribuído, DLQ, alertas e UI. O adapter é o mock da M03-WO-002; nenhum token, API ou dado real. Evidência em [KOR-PM03-WO-003](../evidence/KOR-PM03-WO-003/README.md).

