# 04 — Security
**Plano, não certificado. Risco ELEVATED; HIGH_ASSURANCE para futuras ações financeiras/irreversíveis (fora do MVP).**

## Ameaças e controles mínimos
- Cross-tenant: isolamento de deployment, banco, secrets e volumes; testes negativos de rede, API, files e browser profiles.
- Prompt injection/links: entradas externas sempre não confiáveis, policy engine no servidor, allowlist estrita de ferramenta e egress.
- SSRF/exfiltração: validar URL/redirecionamentos, bloquear metadados cloud/loopback, firewall e network policies; proxy sozinho insuficiente.
- Shell/supervisor: desabilitar por padrão, limitar recursos, sem montar Docker socket nos agentes; acesso de supervisor só interno e restrito.
- Escritas: aprovação autenticada, hash do payload, validade temporal e reconciliação idempotente.
- Segredos/PII: TLS, criptografia em repouso, vault, rotação, redaction e nenhum token no Git/prompt/logs.
- Contas e fraude: RBAC, princípio do menor privilégio, MFA quando aplicável, revogação, trilha de autoria e limites de consumo.
- LGPD: definição controlador/operador, base legal, DPA, retenção, exportação e resposta a incidentes antes de qualquer dado real.

## Testes-gate
SAST/SCA/secrets/SBOM, CI, política deny-all inicial, autenticação, fluxo de aprovação, replay, webhook forgery, SSRF, prompt injection, isolamento, backup/restore. **HIGH ou CRITICAL conhecido = STOP**, sem exceção informal. Sem evidência não declarar seguro.

## Escopo do gate de CI KOR-PM07-WO-001 (2026-10-30; PROPOSTO)
Um `ci:integrity` sintético bloqueia novas dependências npm, lockfiles não auditados, `uses:` sem SHA em GitHub Actions, arquivos TypeScript sem verificador real e tokens óbvios em arquivos de origem. Testes negativos de cada classe são incluídos. `codeql-js` com upload no GitHub será evidência de SAST **somente se o check concluir com sucesso no HEAD auditado**. Limites: pattern matching não é secret scanning exaustivo; sem dependências não existe SCA de bibliotecas de terceiros; CodeQL/Socket não substituem threat model e auditoria de HIGH/CRITICAL. Nunca desabilitar um gate falho apenas para gerar check verde.

## Auth, sessão e RBAC da M02-WO-002 (2026-10-30; PROPOSED_IN_PR)

A implementação em PR Draft usa `scrypt` nativo, sessão server-side com token opaco hasheado, cookie `HttpOnly`/`SameSite=Lax`, CSRF double-submit e RBAC fixo. O tenant vem da sessão e é aplicado no banco com `SET LOCAL app.tenant_id`; header do cliente não concede acesso. Funções `SECURITY DEFINER` isoladas fazem apenas o lookup de login/sessão, com `search_path` fixo e execute restrito a `koros_app`.

**Limites:** rate limit em memória (não distribuído), uma membership ativa por login, sem MFA/reset/cadastro público, sem dashboard/CRM/LLM. `users` é global; a autorização é server-side. O driver `pg@8.23.1` é MIT, com transitivos MIT/ISC e `npm audit` sem vulnerabilidades. Evidência em [KOR-PM02-WO-002](../evidence/KOR-PM02-WO-002/README.md).
