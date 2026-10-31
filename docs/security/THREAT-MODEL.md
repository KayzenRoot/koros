# KOROS Threat Model — M07-WO-002 (2026-10-30; PROPOSED_IN_PR)

**Método:** STRIDE + abuse cases sobre o protótipo sintético local. Este documento não substitui auditoria independente e não declara segurança de produção.

## 1. Escopo e ativos

Ativos: dados de tenant, sessões/CSRF, aprovações e payloads, auditoria, outbox, templates, orçamento/kill switch, backup/chave, segredos de webhook e supply chain.

Fronteiras: browser → API; API → PostgreSQL/RLS; outbox → adapter mock; AI mock; backup → storage local; CI → artefatos.

Fora do escopo: produção, dados de clientes, CRM/LLM reais, MFA, WAF, DDoS de rede, VPS, billing e auditoria externa.

## 2. STRIDE

| Categoria | Ameaça | Controle implementado | Evidência |
|---|---|---|---|
| Spoofing | Header/query de tenant forja identidade | Tenant vem da sessão; headers/query ignorados | `test/dashboard-integration.test.mjs`; `test/auth-integration.test.mjs` |
| Spoofing | Sessão/token forjado | Token opaco hash server-side, cookies HttpOnly/SameSite, CSRF | `test/auth-integration.test.mjs`; `test/auth-unit.test.mjs` |
| Tampering | Payload alterado após aprovação | `payload_hash`/`operation_hash` recomputados; FSM/outbox | `test/approval-integration.test.mjs`; `test/template-integration.test.mjs` |
| Tampering | Auditoria editada retroativamente | Append-only + hash chain + `verifyAuditChain` | `test/control-integration.test.mjs` |
| Repudiation | Ação sem autoria | `audit_events` com ator/ação/entidade/correlation | `test/control-integration.test.mjs`; workflow/approval tests |
| Information disclosure | Tenant bleed/IDOR | RLS por tenant, lookups escopados, decisão por sessão | data-model, approval, dashboard tests |
| Information disclosure | Segredo em log/audit/backup | `secret_ref`, redaction, snapshot AES-GCM | control, backup unit; `/config` sem segredo |
| Information disclosure | PII em métricas/UI | Projeções agregadas/minimizadas | dashboard/control/AI tests |
| Denial of service | Login/webhook flood | Rate limit em memória, corpo limitado | auth/ingestion tests |
| Denial of service | Custo/runaway | Budget reservado + kill switch fail-closed | control/outbox tests |
| Elevation of privilege | Viewer decide/aprova/configura | RBAC server-side em cada rota/serviço | auth/approval/onboarding/dashboard tests |
| Elevation of privilege | IA escreve sem approval | AI só propõe; schema sem status/tool; FSM/approval | AI, workflow, approval tests |
| Elevation of privilege | Template/policy arbitrária | Schema exato, versões imutáveis, permissão | template tests |
| Supply chain | Dependência/action não revisada | Lockfile/versão pinada, integridade, SHA de actions | `test/ci-integrity.test.mjs`; CI |

## 3. Abuse cases

- **Impersonação:** `?tenant_id`, `X-Koros-Tenant` e `X-Tenant-Id` não alteram a sessão; teste usa tenant B e continua vendo A.
- **IDOR:** aprovação/run/template de A não é encontrado sob B; token de aprovação cross-tenant retorna `NOT_FOUND`.
- **Forgery:** webhook sem HMAC válido/timestamp; aprovação com token errado → falha sem escrita.
- **Replay:** webhook duplicado não cria segunda lead; aprovação/outbox são idempotentes.
- **Prompt injection:** padrões são interceptados antes do adapter; saída fora do schema/status alucinado é rejeitada.
- **Privilege escalation:** viewer não decide aprovação, não inicia onboarding, não cria versão de template.
- **Audit tampering:** `UPDATE` privilegiado de metadata quebra a cadeia e `verifyAuditChain` falha.
- **Secret exfiltration:** config pública sem segredo; audit redige chaves; backup não contém fixture nem chave.
- **Injection/XSS:** JSON com content-type explícito e CSP `default-src 'none'`; UI cria DOM com `textContent`, sem script inline; template/webhook têm allowlist.
- **Custo/DoS:** budget/kill switch bloqueiam antes do adapter; limites de corpo/rate em memória.

## 4. Registro HIGH/CRITICAL

O gate exige zero HIGH/CRITICAL aberto. Em 2026-10-30, a consulta ao CodeQL encontrou 1 HIGH (`js/reflected-xss`, `src/app.mjs`) e 1 medium; a resposta JSON foi ajustada para content-type explícito/UTF-8 nesta WO e a reanálise deve confirmar o fechamento. Se o HIGH permanecer aberto, o resultado é **BLOCKED**, não APPROVED. Dependabot está desabilitado no repositório; isso é uma lacuna declarada, não um “zero” presumido.

## 5. Riscos residuais

- Rate limits em memória/por processo, sem proteção distribuída.
- Sem MFA, WAF, DDoS de rede, HSM/escrow de chave ou storage off-host.
- Mocks locais não provam comportamento de CRM/LLM/provedor real.
- Sem auditoria independente, pentest, bug bounty ou certificação WCAG.
- Dependabot desabilitado; SAST/SCA dependem de CodeQL/Sonar/Socket e pins.
- Backup/restore de produção, failover e rollback de binário permanecem PENDING.

## 6. Rastreabilidade

Requisitos: R-01, R-03, R-05, R-08, R-11, R-13. Testes: `test/auth-*`, `test/data-model`, `test/ingestion-*`, `test/approval-*`, `test/control-*`, `test/dashboard-*`, `test/template-*`, `test/onboarding-*`, `test/ai-*`, `test/ci-integrity`, `test/backup-unit`. Evidência agregada em [KOR-PM07-WO-002](../../evidence/KOR-PM07-WO-002/README.md).
