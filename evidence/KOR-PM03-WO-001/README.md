# Evidence Bundle KOR-PM03-WO-001 — receptor de leads autorizados

**Data:** 2026-10-30. **Issue:** [#48](https://github.com/KayzenRoot/koros/issues/48). **Módulo:** [PRODUCT-M03 #38](https://github.com/KayzenRoot/koros/issues/38). **Base main:** `57a8b5c9aa2034ecb4219333fe45a4e639c1feb0`. **Branch:** `feat/KOR-PM03-WO-001-lead-ingestion`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- Dependências M02 (#45/#46/#47) já mescladas na main; auth, RLS e schema disponíveis.
- `POST /v1/webhooks/leads` implementado apenas com dados sintéticos; nenhuma fonte/API real, CRM ou LLM.
- Nenhuma migração nova: usa `connections`, `inbound_events`, `leads`, `audit_events` da #47.
- Sem merge, deploy, conta, gasto ou dado real.

## 2. Escopo entregue

- `src/ingestion/signature.mjs`: HMAC-SHA256 de `${timestamp}.${rawBody}`, janela de ±300 s, comparação timing-safe, segredo mínimo de 16 caracteres.
- `src/ingestion/validate.mjs`: contrato estreito (`external_id`, `lead`, `schema_version=1`), e-mail normalizado, consentimento `GRANTED/DENIED/UNKNOWN`, rejeição de campos desconhecidos/controle/tamanho.
- `src/ingestion/service.mjs`: lookup de conexão sob RLS, resolução de `secret_ref` em env, rate limit 60/min por tenant/provider/account, dedupe por `(tenant_id, provider, external_id)`, inserção de lead `RECEIVED` e auditoria.
- `src/ingestion/errors.mjs`: erros HTTP fechados.
- `src/app.mjs`: rota `POST /v1/webhooks/leads`, corpo bruto limitado a 16 KiB.
- `db/seeds/synthetic.sql`: conexões sintéticas A/B com `secret_ref` `KOROS_WEBHOOK_SECRET_A/B`.
- `test/ingestion-unit.test.mjs` e `test/ingestion-integration.test.mjs`.
- `docs/06-integration-api-contracts.md`: contrato do receptor.
- `.github/workflows/koros-baseline.yml`: segredos sintéticos A/B no job `m02-data`.
- `test/data-model.test.mjs`: asserções de seed por IDs específicos, sem acoplar a testes de ingestão.

## 3. Contrato do webhook

Headers: `X-Koros-Tenant`, `X-Koros-Provider`, `X-Koros-Account`, `X-Koros-Timestamp`, `X-Koros-Signature`.

Assinatura: `HMAC-SHA256(secret, timestamp + "." + rawBody)`, hex. O tenant é chave de roteamento; a autenticação real é a assinatura da conexão, cujo segredo é lido de `secret_ref` no ambiente. Nenhum segredo vai ao banco, log ou resposta.

Respostas: `202` aceito; `200` duplicado; `400` payload inválido; `401` assinatura/timestamp/origem; `413` corpo grande; `415` content-type; `429` rate limit; `503` banco/segredo indisponível.

## 4. Provas locais

PostgreSQL 17.10 temporário, porta 55432.

| Prova | Resultado |
|---|---|
| `db:migrate` (0001+0002) | PASS |
| `db:seed` com conexões A/B | PASS |
| `test:db` (12 schema + 11 auth + 7 ingestão) | **30/30 PASS** |
| `db:rollback:all` + migrate + seed + test:db | **30/30 PASS** |
| `npm run check` sem banco | PASS — 23 testes, 30 skips |
| `npm run smoke` | PASS |
| `npm run ci:integrity` | PASS |
| `docs` | PASS — 32 Markdown, 47 links, 0 findings |

Cobertura de ingestão: evento válido A, replay duplicado, assinatura inválida, timestamp expirado, segredo errado, origem desconhecida, spoof cross-tenant, payload ausente, content-type inválido, isolamento B vs A, corpo acima de 16 KiB.

## 5. Segurança e limites

- HMAC com janela temporal e comparação constante; sem aceitar origem não cadastrada.
- Dedupe no banco por unique de evento e lead; replay não cria segunda lead.
- RLS garante que a conexão, o evento e a lead pertencem ao tenant consultado.
- Rate limit **em memória/por processo**, não distribuído.
- Sem classificação IA, dispatch CRM, outbox/retry/reconciliação, webhooks reais, dados de clientes ou produção.
- `secret_ref` é referência; os valores de teste são fixtures sintéticas, não credenciais reais.

## 6. CI esperado

- `m02-baseline`, `m02-data` (inclui ingestão), `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- CI do HEAD final deve ser consultado após o push; nenhum `SUCCESS` é presumido.
