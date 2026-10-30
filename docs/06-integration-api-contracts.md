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

## FSM de workflows da M04-WO-001 (2026-10-30; PROPOSED_IN_PR)

Estados canônicos: `RECEIVED`, `VALIDATED`, `PROPOSED`, `PENDING_APPROVAL`, `REJECTED`, `EXPIRED`, `APPROVED`, `QUEUED`, `RECONCILING`, `COMPLETED`, `FAILED`, `PAUSED`. `REJECTED`, `EXPIRED`, `COMPLETED` e `FAILED` são terminais. O caminho feliz é `RECEIVED → VALIDATED → PROPOSED → PENDING_APPROVAL → APPROVED → QUEUED → RECONCILING → COMPLETED`; `QUEUED` pode concluir diretamente no sucesso do dispatch, e `RECONCILING → QUEUED` representa retry após reconciliação sem registro remoto.

`createRun` grava `RECEIVED` com unique `(tenant_id, idempotency_key)`; replay retorna o mesmo run e não cria auditoria duplicada. Chave repetida com lead/workflow diferente retorna `IDEMPOTENCY_CONFLICT`.

`transitionRun` abre `SELECT ... FOR UPDATE`, exige `expectedState` opcional, valida a aresta antes do `UPDATE` e grava `audit_events` `RUN_STATE_CHANGED` com `from`, `to` e motivo. Repetir o estado atual é idempotente e não audita de novo; transição ilegal, estado terminal ou `expectedState` obsoleto falham fechado (`INVALID_TRANSITION`/`STATE_MISMATCH`). Não existe aresta direta de `PENDING_APPROVAL` ou `APPROVED` para `COMPLETED`.

O outbox da M03-WO-003 usa os mesmos estados: enqueue `APPROVED → QUEUED`, timeout/lease `RECONCILING`, quota `PAUSED`, sucesso `COMPLETED`, falha terminal `FAILED`. Os estados legados da M02/M03 continuam aceitos no check do banco para compatibilidade, mas o serviço FSM só permite os canônicos.

Fora deste incremento: editor visual de workflow, catálogo de templates, IA, UI, scheduler e CRM real. Evidência em [KOR-PM04-WO-001](../evidence/KOR-PM04-WO-001/README.md).

## Approval gate da M04-WO-003 (2026-10-30; PROPOSED_IN_PR)

O gate só opera sobre run em `PENDING_APPROVAL`. `requestApproval` valida scope `crm.contact.upsert`, contato allowlisted, versão de payload e TTL entre 30 s e 3600 s; grava `PENDING` com `payload_hash` (hash canônico do contato, compatível com o outbox), `operation_hash` (scope + payload + campos + versão), `field_allowlist`, `proposed_operation` e apenas o SHA-256 do token. O token em claro é devolvido uma única vez e nunca é persistido.

`decideApproval` exige contexto server-side de tenant/ator com `approval:decide`, token válido e row lock. Aprovar ou rejeitar transiciona a FSM (`PENDING_APPROVAL → APPROVED/REJECTED`); TTL vencido marca `EXPIRED` e move o run para `EXPIRED`. Replay da mesma decisão é idempotente e não duplica auditoria; token forjado, decisão contrária, tenant cruzado ou payload v2 após aprovação v1 falham sem escrita. A aprovação não chama o adapter nem cria outbox.

`revokeApproval` só é permitido antes do enqueue (run `PENDING_APPROVAL`/`APPROVED`), marca `REVOKED` e move o run para `EXPIRED`; depois de `QUEUED` retorna `APPROVAL_IN_USE`. O outbox revalida `decision='APPROVED'`, `revoked_at IS NULL` e expiração antes do dispatch.

Fora deste incremento: UI de aprovação, notificações, múltiplos aprovadores, quórum, assinatura externa, LLM e CRM real. Evidência em [KOR-PM04-WO-003](../evidence/KOR-PM04-WO-003/README.md).

## Adapter IA da M04-WO-002 (2026-10-30; PROPOSED_IN_PR)

O adapter recebe apenas entrada sintética minimizada `{intent, consent_status}`; e-mail e nome não entram no contexto. O contrato é `provider`, `model`, `mode` e `classify({ tenantId, input, signal })`, sem SDK, token, rede, ferramenta ou acesso ao CRM.

A resposta aceita tem exatamente `schema_version=1`, `intent` (`demo`, `pricing`, `support`, `other`), `confidence`/`uncertainty` entre 0 e 1, `reason_code` enumerado e `requires_human_review` booleano. Campo extra, ausente, tipo inválido ou chave privilegiada (`status`, `approved`, `authorization`, `action`, `tool`, `crm`, `write`, `execute`) é rejeitado. A saída do modelo é uma proposta: não há status de run, aprovação, autorização ou escrita.

Entrada com padrões de prompt injection não é enviada ao adapter; retorna fallback determinístico com `reason_code=INJECTION_SUSPECTED` e revisão humana obrigatória. Timeout, falha do adapter, JSON malformado e status alucinado também retornam fallback `other`, confiança 0, incerteza 1 e revisão obrigatória. O serviço força revisão quando confiança < 0,7, incerteza > 0,3 ou consentimento diferente de `GRANTED`.

`evaluateClassification` roda fixtures sintéticas e calcula acurácia, acurácia de revisão, fallbacks e revisões; não grava nada. Fora deste incremento: provedor/modelo real (ADR-009 PENDING), SDK, prompt de produção, UI, custo e execução de ferramentas. Evidência em [KOR-PM04-WO-002](../evidence/KOR-PM04-WO-002/README.md).

## Controles da M04-WO-004 (2026-10-30; PROPOSED_IN_PR)

**Auditoria.** Novos eventos usam `audit_seq` e uma cadeia SHA-256 por tenant: `event_hash = SHA-256(prev_hash + payload redigido)`. A inserção usa advisory lock por tenant, correlation ID e redaction de chaves sensíveis (`secret`, `token`, `password`, `authorization`, `cookie`, `api_key`, `credential`). `verifyAuditChain` recomputa a cadeia e detecta alteração retroativa; linhas legadas sem hash são ignoradas e permanecem append-only.

**Orçamento.** `budget_policies` define período, tokens e custo máximos por tenant. `runMeteredOperation` reserva `RESERVED` sob row lock antes de chamar a operação paga; a soma de `RESERVED`+`SETTLED` não pode exceder o limite. Sucesso vira `SETTLED`; falha libera `RELEASED`. Uma reserva não liquidada permanece contabilizada e exige reconciliação operacional. Custos/tokens são simulados; não há cobrança real.

**Kill switch.** `tenant_controls.kill_switch_active` é fail-closed: ausência de controle ou switch ativo bloqueia `runMeteredOperation` e o claim do outbox antes de qualquer adapter. Armar/desarmar exige `tenant:configure` e gera auditoria.

**Métricas.** `getTenantMetrics` retorna apenas agregados (audit events, runs, completados, tokens, custo, limites e estado do switch), sem e-mail, nome ou payload.

Fora deste incremento: cobrança real, preço, faturamento, LLM/CRM real, UI, rollover automático de período, reconciliação de reserva órfã e alertas. Evidência em [KOR-PM04-WO-004](../evidence/KOR-PM04-WO-004/README.md).

## Dashboard da M05-WO-001 (2026-10-30; PROPOSED_IN_PR)

`GET /v1/dashboard/summary` exige sessão válida e `session:read`. O tenant vem de `session.tenantId`; query string e headers não concedem acesso. A resposta read-only contém nome do tenant, papel, lista exata de permissões RBAC, contagens por estado, fila (`PENDING_APPROVAL`, `APPROVED`, `QUEUED`, `RECONCILING`, `PAUSED`), falhas (`FAILED`, `REJECTED`, `EXPIRED`), últimos 20 runs, orçamento usado/limite e estado do kill switch.

`GET /login` e `GET /dashboard` servem HTML estático com CSP restritiva; `GET /assets/dashboard.css`, `/assets/dashboard.js` e `/assets/login.js` servem assets fixos. Não há rota de escrita, detalhe por ID ou parâmetro de tenant. Erros de sessão retornam `401` JSON; o cliente redireciona ao login. Fora deste incremento: aprovação pela UI, edição, templates, upload, WebSocket e testes de navegador. Evidência em [KOR-PM05-WO-001](../evidence/KOR-PM05-WO-001/README.md).

