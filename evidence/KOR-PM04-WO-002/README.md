# Evidence Bundle KOR-PM04-WO-002 — adapter IA mock com classificação estruturada

**Data:** 2026-10-30. **Issue:** [#52](https://github.com/KayzenRoot/koros/issues/52). **Módulo:** [PRODUCT-M04 #39](https://github.com/KayzenRoot/koros/issues/39). **Base main:** `46873c3b9a87d9cd4e54f9181cff9047575b1cd7`. **Branch:** `feat/KOR-PM04-WO-002-ai-adapter`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- M04-WO-001/003 (#51/#53), M03 e M02 estão na main.
- Nenhum LLM real, SDK, token, rede, CRM ou dado de cliente.
- Nenhuma migração ou dependência nova.
- Escopo limitado a mock determinístico, schema e avaliação por fixtures.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `src/ai/schema.mjs`: entrada minimizada, detecção de prompt injection, schema estrito, fallback e regras de revisão.
- `src/ai/mock.mjs`: adapter mock determinístico e adapter estático de fixture, ambos locais.
- `src/ai/service.mjs`: `classifyLead` com timeout, validação, fallback e metadados de origem.
- `src/ai/evaluation.mjs`: avaliação reprodutível por fixtures.
- `src/ai/errors.mjs` e `src/ai/index.mjs`.
- `test/ai-unit.test.mjs` e `test/ai-evaluation.test.mjs`.
- `docs/04-security.md`, `docs/06-integration-api-contracts.md` e este Bundle.

## 3. Contrato

Entrada aceita: somente `{intent, consent_status}`; `intent` tem 1–500 caracteres e `consent_status` é `GRANTED`/`DENIED`/`UNKNOWN`. E-mail, nome e campos desconhecidos são rejeitados.

Saída aceita: exatamente `schema_version=1`, `intent` (`demo`/`pricing`/`support`/`other`), `confidence` e `uncertainty` em [0,1], `reason_code` enumerado e `requires_human_review` booleano. Chaves privilegiadas (`status`, `approved`, `authorization`, `tool`, `action`, `crm`, `write`, `execute`) causam `HALLUCINATED_STATUS`; qualquer outra chave extra, ausência ou tipo inválido causa `INVALID_OUTPUT`.

O retorno do serviço separa `classification` (proposta) de `meta` (`source`, `provider`, `model`, `model_called`, `validation`, `review_reasons`, `error_code`). Não há status de run, approval, autorização ou escrita.

## 4. Decisões técnicas

| Decisão | Justificativa | Limite |
|---|---|---|
| Mock determinístico local | Reproduzível, sem custo, sem SDK/token/rede | Não mede qualidade de um modelo real |
| Entrada minimizada | Reduz PII e superfície de prompt injection | Perde contexto que um modelo real talvez use |
| Schema estrito + allowlist | Rejeita saída fora do contrato e status privilegiado | Não substitui avaliação semântica |
| Fallback determinístico | Timeout/erro/saída inválida não viram decisão | Sempre exige revisão humana |
| Detecção de injection antes do adapter | Entrada não vira instrução | Detecção por padrões não é exaustiva |
| Revisão forçada por confiança/consentimento | IA não autoriza; incerteza e consentimento importam | Sem UI/fluxo de revisão nesta WO |

## 5. Critérios de aceitação

| Critério | Prova |
|---|---|
| Modelo nunca autoriza | Schema não possui status/approval/authorization; saída é apenas proposta; nenhum import de DB/CRM/FSM |
| Não executa ferramenta privilegiada | Adapter não recebe ferramenta, segredo ou cliente CRM; mock não faz I/O |
| Saída fora do schema rejeitada | JSON malformado, campo ausente, tipo inválido e chave extra → fallback `INVALID_MODEL_OUTPUT` |
| Prompt injection | Padrões detectados antes do adapter; `model_called=false`, fallback `INJECTION_SUSPECTED` |
| Status alucinado | `status='APPROVED'`/`approved=true` → `HALLUCINATED_STATUS`, fallback e revisão |
| Timeout | Adapter lento abortado; fallback `TIMEOUT`, confiança 0, incerteza 1 |
| Fixtures reproduzíveis | Avaliação executada duas vezes com métricas idênticas |
| Sem rede | `fetch` bloqueado no teste; zero chamadas |

## 6. Provas locais

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 58 módulos JavaScript |
| `node --test test/ai-unit.test.mjs test/ai-evaluation.test.mjs` | **PASS — 10/10** |
| `npm run check` sem banco | **PASS — 69 testes, 0 fail, 58 skips de banco** |
| `npm run smoke` | PASS |
| `docs` | PASS — 38 Markdown, 60 links, 0 findings |
| `test:db` local | **NOT_RUN** — nenhuma alteração de schema; o CI `m02-data` executará a suíte existente |

**NOT_RUN:** provedor/modelo real (ADR-009 PENDING), SDK/API externa, UI/Playwright, avaliação semântica ampla, custo e rate limit de provedor. Não fazem parte do escopo mock desta WO.

## 7. Segurança e limites

- Nenhum segredo, token, credencial, cliente CRM ou ferramenta é passado ao adapter.
- Entrada é dado não confiável; injection é detectada e não enviada ao modelo.
- Saída é validada por allowlist exata e nunca contém autorização/status.
- Timeout e falhas resultam em fallback determinístico com revisão obrigatória.
- **Limites:** mock local, sem LLM real, sem prompt de produção, sem avaliação de segurança exaustiva, sem UI, sem custo/quotas de provedor. A IA não substitui approval gate/FSM.
- Nenhum merge, deploy, gasto ou dado real.

## 8. CI esperado

- `m02-baseline`, `m02-data`, `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- O resultado do HEAD final deve ser consultado no PR; nenhum `SUCCESS` é presumido.
