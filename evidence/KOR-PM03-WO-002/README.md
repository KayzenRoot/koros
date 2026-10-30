# Evidence Bundle KOR-PM03-WO-002 — contrato CRM e mocks Agendor/HubSpot

**Data:** 2026-10-30. **Issue:** [#49](https://github.com/KayzenRoot/koros/issues/49). **Módulo:** [PRODUCT-M03 #38](https://github.com/KayzenRoot/koros/issues/38). **Base main:** `6d992a655052daa59d05b201eb470dbe2ed81cfc`. **Branch:** `feat/KOR-PM03-WO-002-crm-adapter`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- #48 (receptor de leads) e M02 (#45/#46/#47) já estão na main.
- Nenhum CRM real, fornecedor de produção, token, OAuth ou chamada de rede.
- Nenhuma migração, dependência nova ou alteração de schema.
- Agendor e HubSpot são **mocks em memória**; o CRM de cliente continua **PENDING**.
- Sem merge, deploy, conta, gasto ou dado real.

## 2. Escopo entregue

- `src/crm/contract.mjs`: allowlist de contato, normalização, capacidades, validação de tenant, aprovação vinculada ao hash e erros normalizados.
- `src/crm/mock-core.mjs`: adapter em memória, idempotência por `(tenantId, externalId)`, versão, índice de e-mail, limite de registros e `reset`.
- `src/crm/mock-agendor.mjs`: factory mock e mapping sintético do recurso de pessoa Agendor v3.
- `src/crm/mock-hubspot.mjs`: factory mock e mapping sintético HubSpot DBV com propriedades `koros_*`.
- `src/crm/index.mjs`: superfície pública do contrato.
- `test/crm-contract.test.mjs`: mesma suíte de contrato executada contra Agendor e HubSpot.
- `docs/04-security.md` e `docs/06-integration-api-contracts.md`: controles e contrato propostos.

## 3. Contrato

Campos aceitos: `external_id`, `email`, `name`, `company_external_id`. Campo extra é rejeitado com `UNAUTHORIZED_FIELD`; contato ausente/inválido e `external_id` ausente retornam `INVALID_INPUT`; tenant fora de UUID retorna `INVALID_TENANT`.

Capacidades: `contact.read` e `contact.upsert`. Ausência da capacidade retorna `ENTITLEMENT_DENIED` antes da operação.

Escrita: `upsertPerson({ tenantId, contact, approval })` exige `approval.approved === true`, `approval.payloadHash` igual ao SHA-256 do contato canônico ordenado e `approval.expiresAt` futuro. Sem aprovação: `APPROVAL_REQUIRED`; hash divergente: `APPROVAL_MISMATCH`; expirada: `APPROVAL_EXPIRED`.

Idempotência: repetir o mesmo payload com aprovação válida não cria versão; payload diferente incrementa a versão. E-mail duplicado no mesmo tenant retorna `CONFLICT`; leitura por outro tenant retorna `NOT_FOUND`; o mock aceita até 1000 contatos e retorna `CAPACITY_EXCEEDED` acima disso.

Mapeamento Agendor: `{ id, externalId, name, email, companyExternalId }`. Mapeamento HubSpot: `{ id, properties: { email, firstname, lastname, koros_external_id, koros_company_external_id, koros_name } }`. As propriedades `koros_*` preservam o nome completo e o identificador externo, permitindo round-trip sem perda.

## 4. Negativos exigidos pela issue

| Caso | Resultado |
|---|---|
| Campo não autorizado (`ssn`) | `UNAUTHORIZED_FIELD`, sem escrita |
| Objeto/`external_id` ausente | `INVALID_INPUT`, sem escrita |
| Entitlement somente leitura | `ENTITLEMENT_DENIED`, sem escrita |
| Escrita sem aprovação | `APPROVAL_REQUIRED`, sem escrita |
| Aprovação para outro payload | `APPROVAL_MISMATCH` |
| Aprovação antiga após mudança de payload | `APPROVAL_MISMATCH`, versão inalterada |
| Aprovação expirada | `APPROVAL_EXPIRED` |
| Leitura cross-tenant | `NOT_FOUND` |
| Upsert do mesmo `external_id` em outro tenant | registro separado por tenant |
| E-mail duplicado no tenant | `CONFLICT` |
| Update para e-mail de outro contato | `CONFLICT`, registro inalterado |
| Chamada de rede durante o mock | 0 chamadas; `fetch` bloqueado no teste |

## 5. Provas locais

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 31 módulos JavaScript |
| `npm run check` (integridade + lint + testes) | **PASS — 44 testes executados, 30 skips de banco** |
| `node --test test/crm-contract.test.mjs` | **PASS — 21/21** |
| `npm run smoke` | PASS |
| `npm run ci:integrity` | PASS (dentro do `check`) |
| `node .github/scripts/check-docs.mjs` | PASS — 34 Markdown, 49 links, 0 findings |
| Dependências novas | 0 |
| Chamadas de rede/CRM real | 0 |

Os 30 skips são os testes de integração de banco que exigem `KOROS_DB_TESTS=1` e um PostgreSQL local; não foram executados neste work order. Nenhum resultado de CI é presumido.

## 6. Segurança e limites

- A aprovação é vinculada ao payload canônico, não ao corpo bruto; qualquer alteração de e-mail, nome ou empresa invalida o hash.
- O contrato falha fechado para campo desconhecido, objeto ausente, entitlement e aprovação.
- O mock é em memória/por processo; não há persistência CRM, retry, outbox, reconciliação, rate limit distribuído ou multi-worker.
- Não há cliente HTTP, token, OAuth, sandbox real, webhook real ou dado de cliente.
- O CRM real permanece **PENDING** até contrato de fornecedor, termos, escopo mínimo de credencial e sandbox aprovados.

## 7. CI esperado

- `m02-baseline`, `m02-data`, `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- O resultado do HEAD final deve ser lido no PR após o push; nenhum `SUCCESS` é presumido.
