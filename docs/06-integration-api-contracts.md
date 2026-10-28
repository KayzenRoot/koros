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
