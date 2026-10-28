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
