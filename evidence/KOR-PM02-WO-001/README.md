# KOR-PM02-WO-001 | Evidence Bundle do primeiro baseline técnico
**Data:** 2026-10-30 · **Issue:** [#45](https://github.com/KayzenRoot/koros/issues/45) · **Fase:** código local testado, PR/CI para validação no HEAD final.

## Context Lock (consultado antes do incremento)
- Base `main`: `30819b2622d5dc865931d5c55e9e9e9586648276`.
- M01: PR #36 Draft HEAD `d9f88b6a6087e395784b618d0b9e2967d228bcef`, ainda não incorporada à main.
- Roadmap: PR #68 Draft HEAD `b66181e9f2adf206aae2654e7c7056053eacca99`, ainda não incorporada à main.
- Git blob fingerprint de arquivos críticos na **main**:
  - `docs/14-checkpoint.md`: `2ed5860e2198ccf80d8d71e87025b9c248b9389c`.
  - `docs/13-decisions-ledger.md`: `73c3691806c7bf7bdf7c0ce43d918e051b5020d4`.
  - `docs/02-scope.md`: `61387c18ce36f728d6b892bb6d91087e2c46e7bd`.
  - `docs/03-architecture.md`: `fac99f19991a84fb91e1a3712e2f8f146b83c141`.
  - `docs/12-definition-of-done.md`: `ae20959a02e5b32651bc611d0907d7ae49967a9b`.
  - `docs/04-security.md`: `abc01282a6f16025d0e3374761e8106f8d4684ff`.
  - `docs/08-test-benchmark-plan.md`: `40809e82910a5eb846c8b351d9212faf323571d1`.
- Fonte de decisão de produto na branch M01: `docs/product-m01/decisions.md` blob `658a07489f87462aab4fb617b2d593a775412351`.
- Fila do roadmap: `docs/product-roadmap/execution-queue.md` blob `28c485b151aeea9d3bcd75a37c620a5f45385df1`.
- **Regra:** divergência de qualquer fonte antes de novo incremento torna o Context Lock STALE; nenhuma PR Draft foi tratada como `main`.

## Escopo / decisões com impacto limitado
- **Base independente:** Node.js LTS, JavaScript ESM, HTTP nativo, `node:test`, sem dependências npm declaradas; nenhum arquivo OpenBot/CopilotKit copiado/incorporado. ADR técnico proposto em `docs/architecture/ADR-016-runtime-baseline.md`; ADR-006 original permanece PENDING para escolha de integração/upstream maior.
- Versão sintética `0.1.0`, somente loopback `127.0.0.1`; endpoints de leitura `/healthz`, `/version`, `/config` (sem segredos). `PUBLIC_CONFIG.tenantAccess='deny-all'`, `externalWrites=false`, `authentication='not-implemented'`.
- Tenant envelope apenas **validação de formato**; nenhuma identidade/verificação de sessão está implementada, sem rota tenant.
- Banco/Postgres, migrations, autenticação, agente, CRM e persistência pertencem a outras WOs; `NOT_IMPLEMENTED`.
- Licença: Node.js código base MIT com licenças de componentes embutidos documentadas upstream; action checkout/setup-node MIT com SHA conferido. Produto privado em `package.json` como `UNLICENSED` (não é autorização de uso comercial para terceiros).

## Tests/Evidence executados localmente
**Ambiente:** container de teste nesta sessão, Node `v22.16.0`, npm `10.9.2`, sem npm install, sem rede externa. Os testes HTTP abriram somente loopback em porta efêmera.

| Comando | Resultado observado | Limite |
|---|---|---|
| `npm run check` | PASS: syntax-check 8 módulos + 10/10 testes Node/TAP | Sem análise estática ESLint externa |
| `npm run build` | PASS: verificação de sintaxe de 8 módulos | **Não gera bundle** nem prova deploy |
| `npm run smoke` | PASS: GET /healthz e POST rota protegida 405, usando loopback | Não é teste de produção |
| `npm audit` | NOT_RUN | Sem dependências npm instaladas/declaradas; não afirmar SCA completa |
| TypeScript `tsc`, CodeQL/Sonar | NOT_RUN | Nenhum TS nem scanner de aplicativo nesta WO |
| Banco, CRM, autenticação, T-01..T-12, CRM-R01..12 | NOT_RUN | Fora desta WO |
| Testes de rede externa/tenant real | NOT_RUN | Proibidos/sem serviço real |

**Testes negativos presentes:** métodos mutáveis 405, rotas tenant/CRM inexistentes 404, header `X-Tenant-Id` não concede direitos, porta inválida fail-closed, envelope com campo indevido/role inválido rejeitado, configuração sem segredos. **Limite:** não demonstram R-01/R-11 cumpridos em autenticação real, somente ausência de superfície privilegiada nesta baseline.

## Workflow de CI introduzido nesta própria WO
`m02-baseline` em `.github/workflows/koros-baseline.yml`, usando checkout commit `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1) e setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1` (v7.1.0). Node 24 LTS, apenas checkout read-only, sem cache e sem instalação npm. CI de aplicação roda syntax, testes e smoke; `governance-docs` da main continua obrigatório, sem mudar ruleset. **Resultado no HEAD publicado deve ser lido em comentário de auditoria da PR**, não adivinhado neste arquivo.

## Riscos e STOP
- NÃO publicar porta em `0.0.0.0`; `startLocalServer` aceita apenas porta, e host é constante loopback.
- `validateTenantEnvelopeShape` valida apenas a forma, não prova identidade: nunca usar para autorizar API. Futuro R-01/R-11 depende de sessão, RBAC, DB e negativos na WO #46/#47.
- Sem TLS/DB/PII/credenciais/tenants reais, este servidor **não é deployável em produção**.
- ADR-006, LLM/CRM real, licença final de produto, DPA, registro/INPI/comercial permanecem pendentes/deferidos conforme Source Pack e decisão do fundador.
- Sem merge, Ready, custo, VPS, contas, deploy, nova WO ou dados reais. Resultado da auditoria final deve ser `APPROVED` somente se todas as obrigações da WO e CI HEAD estiverem satisfeitas; senão `CORRECTION REQUIRED`/`BLOCKED`.

## Checkpoint Delta PROPOSTO (não promovido)
`WO KOR-PM02-WO-001: esqueleto local de processo e três GET públicos, contrato estrutural tenant, testes de sintaxe/unidade/smoke, CI mínima verificada após commit. Architecture baseline independente somente para esta WO. ADR-006/009 e real tenants/CRM permanecem PENDING. Nenhuma entrega de app ao cliente, produção, billing ou deploy. Próxima WO ainda não iniciada.`

## Read-back pós-merge verificado — 2026-10-30 (registro proposto em PR documental)
- **PR #69:** `MERGED/CLOSED` via GitHub REST com `merge_method=squash` e `expected_head_sha=56e006435531e5d596a22f52e3b52db59a4d3ade`, sem bypass; commit squash `e24d7cf458f61d1b98850f34a304023ee1d87ce1`.
- **Main anterior:** `30819b2622d5dc865931d5c55e9e9e9586648276` = pai único do squash. Git tree do commit mesclado e da PR origem `319d7c0d91a3a1348d71f691aae52f76f16780d7`, sem drift de conteúdo.
- **Checks da PR prontos após Ready:** `governance-docs` [run 41084134782](https://github.com/KayzenRoot/koros/actions/runs/41084134782) `success`, `m02-baseline` [run 41083625071](https://github.com/KayzenRoot/koros/actions/runs/41083625071) `success` (Node24, 10/10 teste, verificação sintaxe, smoke), Socket PR Alerts/Project Report `success`. `mergeable_state=clean`, nenhuma review thread aberta. Ruleset #26074776 `active`, PR obrigatório, squash-only, required `governance-docs` App 15368, bypass_actors vazio. Rota administrativa de branch protection devolveu `403`; o ruleset foi lido, e merge real testou seu enforcement.
- **Checks pós-push em main:** `governance-docs` [run 41084211605](https://github.com/KayzenRoot/koros/actions/runs/41084211605) `completed/success`, Socket Project Report `completed/success`. **Não** atribuir `m02-baseline` à execução na main: ele só executou na PR, mas conteúdo de árvore do squash é igual.
- **Limites persistentes:** segurança de produção, autenticação, RLS/RBAC, CRM/IA e persistência `NOT_IMPLEMENTED/NOT_RUN`; `M02_COMPLETE=NO`; PR #36/#68 não mergeadas, #45 OPEN. Registro na PR de documentação do pós-merge **ainda não promovido**. Sem nova WO, merge dessa segunda PR, deploy ou gastos.
