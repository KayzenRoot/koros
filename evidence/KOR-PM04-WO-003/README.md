# Evidence Bundle KOR-PM04-WO-003 — approval gate server-side

**Data:** 2026-10-30. **Issue:** [#53](https://github.com/KayzenRoot/koros/issues/53). **Módulo:** [PRODUCT-M04 #39](https://github.com/KayzenRoot/koros/issues/39). **Base main:** `04b0bda2a237097841c208f38eb24c8328ac6175`. **Branch:** `feat/KOR-PM04-WO-003-approval-gate`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- M02 (schema/auth/RLS), M03 (#48/#49/#50) e M04-WO-001 (#51) estão na main.
- Nenhum LLM, CRM real, token real, rede ou dado de cliente.
- Nenhuma dependência nova; PostgreSQL 17 local e mock Agendor.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `db/migrations/0005_approval_gate.sql` e `.down.sql`: scope, operação proposta, campos, versão, token hash, decisores e revogação.
- `src/approval/hash.mjs`: JSON determinístico, hash de contato e hash de operação.
- `src/approval/service.mjs`: request, decide, revoke e verify server-side.
- `src/approval/errors.mjs` e `src/approval/index.mjs`.
- `src/outbox/service.mjs`: revalida decisão/revogação/expiração antes do dispatch.
- `test/approval-unit.test.mjs`, `test/approval-integration.test.mjs` e validação da migration em `test/data-model.test.mjs`.
- `package.json`, docs de segurança/dados/contratos e este Bundle.

## 3. Fluxo

1. O run precisa estar em `PENDING_APPROVAL`.
2. `requestApproval` valida scope `crm.contact.upsert`, contato allowlisted, versão e TTL 30–3600 s; grava `PENDING`, `payload_hash` canônico do contato, `operation_hash` (scope + payload + campos + versão), `field_allowlist` e SHA-256 do token.
3. O token em claro é devolvido uma única vez; o banco nunca o armazena.
4. `decideApproval` exige ator autenticado com `approval:decide`, token válido e row lock; aprova/rejeita via FSM ou expira.
5. `revokeApproval` só atua antes do enqueue (`PENDING_APPROVAL`/`APPROVED`), marca `REVOKED` e move o run para `EXPIRED`.
6. O outbox só enfileira com aprovação `APPROVED`, não revogada e não expirada; antes do adapter revalida a linha de aprovação.

## 4. Decisões técnicas

| Decisão | Justificativa | Limite |
|---|---|---|
| `payload_hash` = hash canônico do contato | Compatível com o contrato CRM/outbox da #49/#50 | Não cobre scope/versão sozinho |
| `operation_hash` separado | Vincula scope, campos e versão ao payload | Não substitui o hash do consumidor |
| Token one-time com SHA-256 | UI não autoriza; token não fica em claro no banco | Sem rotação/alerta de token vazado |
| Row lock + idempotência por decisão | Duplo clique não duplica auditoria/transição | Sem quórum/múltiplos aprovadores |
| Revogação só antes do enqueue | Evita corrida com escrita externa | Depois de `QUEUED` retorna `APPROVAL_IN_USE` |
| TTL 30–3600 s | Janela explícita e limitada | Sem renovação automática; nova versão exige novo pedido |

## 5. Critérios de aceitação

| Caso | Resultado |
|---|---|
| Aprovação exata | `APPROVED`, run `APPROVED`; outbox/mock só depois do enqueue explícito |
| Payload v2 após aprovação v1 | `PAYLOAD_MISMATCH`/`APPROVAL_MISMATCH`; zero outbox, zero contato no mock |
| Outro tenant | `NOT_FOUND` no lookup do approval; run permanece `PENDING_APPROVAL` |
| TTL expirado | `EXPIRED`, run `EXPIRED`; zero outbox |
| Duplo clique | Uma decisão efetiva + uma idempotente; uma auditoria `APPROVAL_APPROVED` |
| Aprovação forjada | `FORGED_APPROVAL`; approval permanece `PENDING`; zero outbox |
| Política inválida | `INVALID_POLICY`; nenhuma linha de approval |
| Rejeição | Run `REJECTED`; zero outbox e zero escrita no mock |
| Revogação antes do dispatch | `REVOKED`, run `EXPIRED`; enqueue retorna `APPROVAL_REQUIRED` |
| Replay do request | Mesmo approval, token `null`, uma única linha |
| Replay com versão diferente | `IDEMPOTENCY_CONFLICT`; sem segunda aprovação |

## 6. Provas locais

PostgreSQL 17 local, porta 55432, banco `koros_test`.

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 49 módulos JavaScript |
| `node --test test/approval-unit.test.mjs` | **PASS — 3/3** |
| `npm run test:db` | **PASS — 58/58** (15 schema + 11 auth + 7 ingestão + 8 outbox + 6 workflow + 11 approval) |
| `db:rollback:all` + `db:migrate` + `db:seed` + `test:db` | **PASS — 58/58** |
| `npm run check` sem banco | PASS — 59 testes, 58 skips de banco |
| `npm run smoke` | PASS |
| `docs` | PASS — 37 Markdown, 58 links, 0 findings |

**NOT_RUN:** UI/Playwright de aprovação, notificações, múltiplos aprovadores/quórum, CRM real, LLM e carga distribuída. Não fazem parte do escopo mock desta WO.

## 7. Segurança e limites

- Tenant/ator vêm do contexto autenticado; a UI não fornece identidade nem autoriza.
- Permissão `approval:decide` é verificada em `memberships`; viewer/operator não decide.
- Token one-time, comparação timing-safe e hash de 64 hex; token vazio/forjado falha.
- `payload_hash` e `operation_hash` são recomputados do registro armazenado antes da decisão/verify.
- Nenhuma escrita no adapter/mock é executada por request, decide, reject, expire ou revoke.
- **Limites:** sem UI, MFA adicional, quórum, assinatura externa, notificações, rotação de token, CRM real ou operação de produção. O gate depende da sessão/RBAC existentes.
- Nenhum merge, deploy, gasto ou dado real.

## 8. CI esperado

- `m02-baseline`, `m02-data` (inclui approval), `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- O resultado do HEAD final deve ser consultado no PR; nenhum `SUCCESS` é presumido.
