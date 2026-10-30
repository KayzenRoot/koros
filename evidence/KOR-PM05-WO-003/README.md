# Evidence Bundle KOR-PM05-WO-003 — catálogo de templates versionados

**Data:** 2026-10-30. **Issue:** [#57](https://github.com/KayzenRoot/koros/issues/57). **Módulo:** [PRODUCT-M05 #40](https://github.com/KayzenRoot/koros/issues/40). **Base main:** `ab8c053cb944c405780c2e42ad72a210b838161f`. **Branch:** `feat/KOR-PM05-WO-003-template-catalog`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- M04-001 (FSM) e M05-001/002 (dashboard/aprovação) estão na main.
- Nenhum editor visual, marketplace, CRM real, LLM real, token ou dado de cliente.
- Nenhuma dependência nova; PostgreSQL 17 local.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `db/migrations/0007_templates.sql` e `.down.sql`: `workflow_templates`, `workflow_template_versions` imutáveis e `approvals.template_version_id`.
- `src/templates/schema.mjs`: schema exato, detecção de chaves secret-like, hash, compatibilidade e preview.
- `src/templates/service.mjs`: criação, nova versão, listagem, preview e invalidação de aprovações.
- `src/templates/errors.mjs` e `index.mjs`.
- Seed de um template lead→CRM por tenant.
- `GET /v1/templates`, `POST /v1/templates/{id}/preview`, `POST /v1/templates/{id}/versions`.
- Catálogo read-only no dashboard.
- Testes unitários/integração, docs e este Bundle.

## 3. Configuração e segurança

- Schema exato: `schema_version`, `name`, `source`, `required_fields`, `field_map`, `crm`, `approval`, `limits`.
- Chave desconhecida → `UNKNOWN_FIELD`; chave secret-like → `SECRET_FIELD`; config inválida → `INVALID_TEMPLATE`.
- `required_fields` exige `external_id` e `email`; `field_map` precisa cobrir ambos; operação fixa `crm.contact.upsert`; targets apenas mocks.
- Versões têm `config_hash` SHA-256; app role recebe somente `SELECT,INSERT` (imutável).
- Preview é dry-run: valida lead, mapeia contato, retorna operação/payload sem run/outbox/adapter.
- `POST /versions` exige `tenant:configure` + CSRF.
- Mudança em source/campos/mapeamento/operação/target/scope revoga aprovações `PENDING`/`APPROVED` vinculadas a versões antigas; nome/limites/TTL não são breaking.

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Configuração sem segredo | `api_key`/`secret`/`token` estrutural → `SECRET_FIELD`; nenhum valor bruto em config |
| Versão imutável | App role só SELECT/INSERT; `UPDATE` retorna `42501` |
| Preview dry-run | lead→payload; zero runs/outbox no teste |
| Campo obrigatório omitido | `MISSING_REQUIRED_FIELD` |
| Template de outro tenant | `NOT_FOUND` via RLS |
| Upgrade incompatível | aprovação vinculada à v1 vira `REVOKED`; `verifyApproval` falha |
| Upgrade compatível | limite/nome alterado → `breaking=false`, zero invalidações |
| Sem edição arbitrária de policy | schema exato + versão append-only + permissão |
| Catálogo | `GET /v1/templates` e painel read-only |

## 5. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_test`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` (inclui `public/`) | PASS — 81 módulos JavaScript |
| `node --test test/template-unit.test.mjs` | **PASS — 6/6** |
| `npm run test:db` | **PASS — 81/81** (17 schema + 11 auth + 7 ingestão + 8 outbox + 6 workflow + 11 approval + 5 control + 11 dashboard + 5 templates) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 81/81** |
| `npm run check` sem banco | PASS — 80 testes, 81 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 42 Markdown, 73 links, 0 findings |

**NOT_RUN:** editor visual, marketplace, preview no navegador, Playwright, DLP de valores, CRM real, deploy e operação distribuída.

## 6. Limites

- Detecção de segredo é estrutural por nome de chave, não inspeção exaustiva de valores.
- Sem criação/edição de template pela UI; apenas catálogo e API.
- Sem versionamento semântico automático além da comparação de campos core.
- Sem criptografia adicional da config; dados são sintéticos.
- Sem marketplace, templates por setor além do inicial, CRM real ou cobrança.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI esperado

- `m02-baseline`, `m02-data` (inclui templates), `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- O resultado do HEAD final deve ser consultado no PR; nenhum `SUCCESS` é presumido.
