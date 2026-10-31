# Evidence Bundle KOR-PM07-WO-002 — threat model e regressão de segurança

**Data:** 2026-10-30. **Issue:** [#62](https://github.com/KayzenRoot/koros/issues/62). **Módulo:** [PRODUCT-M07 #42](https://github.com/KayzenRoot/koros/issues/42). **Base main:** `ee18631e388fcee5bb9a7d57482cd6b3d491e927`. **Branch:** `feat/KOR-PM07-WO-002-security-regression`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- M02–M06 estão na main.
- Escopo sintético/local; nenhum dado de cliente, VPS, provider real ou produção.
- Nenhuma migração ou dependência nova.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `docs/security/THREAT-MODEL.md`: STRIDE, abuse cases, ativos, fronteiras, riscos residuais e rastreabilidade.
- `docs/04-security.md`: link e resumo do threat model.
- Regressão de impersonação por header/query em `test/dashboard-integration.test.mjs`.
- Correção da resposta JSON (`application/json` explícito + UTF-8) em `src/app.mjs` para o achado CodeQL.
- Matriz de evidências apontando os testes negativos por módulo.

## 3. Cobertura STRIDE/abuso

| Ameaça | Controle | Testes |
|---|---|---|
| Impersonação de tenant | Tenant da sessão; headers/query ignorados | dashboard integration (query + `X-Koros-Tenant`/`X-Tenant-Id`) |
| IDOR/cross-tenant | RLS, lookup escopado, decisão por sessão | data-model, approval, dashboard |
| Forgery | HMAC webhook, token de aprovação | ingestion, approval |
| Replay | unique webhook/outbox, idempotência de decisão | ingestion, approval, outbox |
| Prompt injection | schema/AI fallback sem adapter | ai unit/evaluation |
| Privilege escalation | RBAC server-side | auth, approval, onboarding |
| Audit tampering | append-only + hash chain | control |
| Secret exfiltration | `secret_ref`, redaction, backup AES-GCM | control, backup |
| XSS/injection | JSON content-type, CSP, textContent, allowlists | dashboard, template, ingestion |
| Custo/DoS | rate limit, budget, kill switch | auth, ingestion, control |
| Supply chain | pins/lockfile/actions SHA | ci-integrity |

## 4. Alertas de segurança

Consulta em 2026-10-30 ao CodeQL na `main`:

| Alerta | Severidade | Regra | Estado |
|---|---|---|---|
| #4 | **HIGH** | `js/reflected-xss` | open na main; remediado nesta PR (content-type JSON explícito/UTF-8); reanálise pendente |
| #3 | medium | `js/xss-through-exception` | open na main; mesmo caminho de resposta, reanálise pendente |

Dependabot está **desabilitado** no repositório (lacuna declarada, não “zero”). O gate só pode ser `APPROVED` se o HIGH estiver fechado na análise do HEAD final. Caso permaneça aberto, resultado **BLOCKED**.

## 5. Provas locais

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 93 módulos JavaScript |
| `npm run check` sem banco | PASS — 90 testes, 86 skips |
| `npm run test:db` | **PASS — 86/86** |
| Impersonação query+headers | PASS — sessão A permanece A; B/run-b ausentes |
| `npm run smoke` | PASS |
| `docs` | PASS — 49 Markdown, 81 links, 0 findings |

**NOT_RUN:** auditoria independente, pentest, DAST, WAF/DDoS, MFA, teste de provider real, Playwright/WCAG e dependabot (desabilitado).

## 6. Riscos residuais

- Rate limits em memória; sem proteção distribuída.
- Sem MFA, WAF, HSM/key escrow, storage off-host ou auditoria independente.
- Mocks não provam comportamento de provider real.
- Dependabot desabilitado; SCA depende de pins/Socket/CI.
- HIGH aberto bloqueia aprovação; medium residual documentado.

## 7. CI esperado

- `m02-baseline`, `m02-data`, `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- O resultado do HEAD final e o estado do alerta #4 devem ser consultados antes de qualquer GO.
