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

## Adapter CRM mock da M03-WO-002 (2026-10-30; PROPOSED_IN_PR)

O contrato CRM aceita apenas campos allowlisted, exige tenant UUID e capacidade explícita, e vincula a escrita a uma aprovação `approved`, com hash SHA-256 do payload canônico e expiração. O mock não importa cliente HTTP, não lê tokens e falha fechado para campo desconhecido, objeto ausente, entitlement insuficiente e escrita sem aprovação. **Limite:** os adapters Agendor/HubSpot são sintéticos e em memória; nenhuma chamada real, OAuth ou persistência CRM foi implementada. Evidência em [KOR-PM03-WO-002](../evidence/KOR-PM03-WO-002/README.md).

## Outbox da M03-WO-003 (2026-10-30; PROPOSED_IN_PR)

O enqueue é atômico com a transição do run, exige aprovação persistida e hash do payload canônico, e usa uma chave idempotente por tenant/fonte/external_id/versão. O claim usa `FOR UPDATE SKIP LOCKED` e lease curto; timeout é tratado como resultado incerto e reconciliado por `external_id` antes de novo upsert. Quota esgotada pausa a ação e bloqueia o run; erros terminais falham sem retry. O outbox armazena apenas payload sintético e código de erro normalizado, nunca segredo, token ou resposta bruta do provedor.

**Limites:** a implementação é local/por processo, sem scheduler distribuído, DLQ, alertas, rate limit distribuído ou CRM real; não há prova de operação em produção. Evidência em [KOR-PM03-WO-003](../evidence/KOR-PM03-WO-003/README.md).

## FSM de workflows da M04-WO-001 (2026-10-30; PROPOSED_IN_PR)

A FSM é deny-by-default: só arestas declaradas são aceitas, estados terminais não voltam e `PENDING_APPROVAL`/`APPROVED` não podem saltar para `COMPLETED`. A transição usa `SELECT ... FOR UPDATE` por tenant, `expectedState` opcional para detectar worker obsoleto e auditoria `RUN_STATE_CHANGED`. Replay do mesmo estado é idempotente e não duplica auditoria; criação de run é única por `(tenant_id, idempotency_key)`.

O outbox usa a mesma FSM para `QUEUED`, `RECONCILING`, `PAUSED`, `COMPLETED` e `FAILED`, eliminando atualização direta de estado de run. **Limites:** a FSM não autoriza nem executa LLM; não há UI, editor de workflow, scheduler ou CRM real. Evidência em [KOR-PM04-WO-001](../evidence/KOR-PM04-WO-001/README.md).

## Approval gate da M04-WO-003 (2026-10-30; PROPOSED_IN_PR)

A aprovação é server-side: tenant e ator vêm do contexto autenticado, a permissão `approval:decide` é verificada em `memberships`, o token é one-time e só seu SHA-256 é persistido. A decisão usa row lock e é idempotente; TTL, payload, scope, campos e versão são vinculados por `payload_hash`/`operation_hash`. Token forjado, tenant cruzado, replay e payload alterado falham sem escrita. A revogação é permitida apenas antes do enqueue e o outbox revalida decisão/revogação/expiração antes do adapter.

**Limites:** não há UI, notificações, múltiplos aprovadores, quórum, assinatura externa ou CRM real; o gate não substitui autenticação/MFA da sessão. Evidência em [KOR-PM04-WO-003](../evidence/KOR-PM04-WO-003/README.md).

## Adapter IA da M04-WO-002 (2026-10-30; PROPOSED_IN_PR)

O adapter é mock/local, sem SDK, token, rede ou ferramenta. A entrada é minimizada e tratada como dado não confiável; prompt injection retorna fallback e revisão humana sem chamar o adapter. A saída é validada por schema estrito e não pode conter status, aprovação, autorização, ferramenta ou ação. Timeout, falha, JSON inválido e status alucinado são rejeitados e substituídos por fallback determinístico com revisão obrigatória.

**Limites:** não há provedor/modelo real (ADR-009 PENDING), avaliação de segurança de prompt exaustiva, custo, rate limit de provedor ou UI. A classificação nunca autoriza escrita; approval/FSM continuam sendo o gate. Evidência em [KOR-PM04-WO-002](../evidence/KOR-PM04-WO-002/README.md).
