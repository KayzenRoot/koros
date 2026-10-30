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

