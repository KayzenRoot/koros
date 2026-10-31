# Evidence Bundle KOR-PM06-WO-002 — ambiente local isolado e deploy de teste

**Data:** 2026-10-30. **Issue:** [#59](https://github.com/KayzenRoot/koros/issues/59). **Módulo:** [PRODUCT-M06 #41](https://github.com/KayzenRoot/koros/issues/41). **PR:** [#86](https://github.com/KayzenRoot/koros/pull/86) (Draft, sem merge). **Base main:** `dcad1e995a2694fda8e6f9b5abcc6c370cfb1c21`. **HEAD de código:** `90ceca8fb31b8f0ca0422395e03f23496e1a3d8b`. **Branch:** `feat/KOR-PM06-WO-002-local-env`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PASS`.

## 1. Context Lock

- M02–M05 estão na main; M06-WO-002 vem antes da #58 conforme o plano do épico.
- Nenhum deploy público, VPS, Docker socket, custo externo ou dado de cliente.
- PostgreSQL 17 local e app em loopback.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `scripts/local-env.mjs`: start/status/restart/stop do PostgreSQL + app, migrations/seed, health e credenciais locais.
- `scripts/local-env-policy.mjs`: validação loopback/não-produção/sem Docker socket/portas.
- `deploy/local/README.md` e `deploy/local/env.example`: runbook e config sem segredos.
- `.gitignore`: `.koros/` (estado, logs, credenciais locais).
- Scripts npm `local:start|stop|restart|status` e `test:local`.
- `test/local-env-unit.test.mjs`; docs/Evidence Bundle.

## 3. Isolamento e configuração

- App/PostgreSQL escutam apenas `127.0.0.1`; nenhuma porta administrativa é publicada.
- Nenhum Docker socket é lido/montado; o runner não usa Docker.
- O runner recusa `NODE_ENV=production`, host não-loopback, `KOROS_DOCKER_SOCKET`, `KOROS_ALLOW_NON_LOOPBACK=1`, portas iguais/inválidas e cookies Secure em HTTP.
- O data dir precisa ficar dentro do workspace; padrão `.koros/local/`, gitignored.
- A senha sintética é gerada aleatoriamente e gravada só em `.koros/local/credentials.json` (owner-only), nunca no Git/log.
- A config de exemplo não tem segredo real nem bind externo.

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Boot local repetível | `npm run local:start` inicializa PG, cria DB/role, migra, seed, inicia app e espera `/healthz` |
| Status/restart/stop | `local:status` running; `local:restart` preserva data; `local:stop`; status stopped |
| Sem custo externo | PostgreSQL/Node locais; sem VPS/Docker/API externa |
| Sem porta administrativa/socket | binds 127.0.0.1; policy e teste de manifesto recusam 0.0.0.0/docker.sock |
| Config sem segredo | env example sintético; credenciais geradas em `.koros` gitignored |
| Migrações/health | migrations+seed aplicados; `/healthz` 200 e dashboard/login 200 |
| Env ausente | defaults seguros de host/portas; start funcionou sem env custom |
| Ambiente inseguro | production/non-loopback/docker socket → exit 1 |
| Migração divergente | checksum alterado → `DB_MIGRATE_FAIL`, exit 1 |

## 5. Provas locais

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 84 módulos JavaScript |
| `node --test test/local-env-unit.test.mjs` | **PASS — 4/4** |
| `npm run local:start` | PASS — PG 17 + app loopback |
| `npm run local:status` | PASS — running/healthy |
| `npm run local:restart` | PASS — data/credenciais preservados |
| `npm run local:stop` | PASS — status stopped |
| Login/dashboard/templates no ambiente local | PASS — 200, tenant A, 1 template |
| `npm run test:db` contra o ambiente local | **PASS — 81/81** |
| `npm run check` sem banco | PASS — 84 testes, 81 skips |
| `npm run smoke` | PASS |
| `docs` | PASS — 43 Markdown, 74 links, 0 findings |

**NOT_RUN:** staging público, VPS, TLS, Docker/Compose, backup/restore automatizado, Playwright e deploy gerenciado.

## 6. Limites

- Ambiente local-only, sem TLS ou exposição externa.
- Sem container/Docker; depende de binários PostgreSQL 17 locais.
- Sem backup/restore automatizado, observabilidade externa, rate limit distribuído ou SLA.
- Credenciais são sintéticas e locais; não servem para staging/produção.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI

Consulta em 2026-10-30 para `90ceca8fb31b8f0ca0422395e03f23496e1a3d8b`; todos os checks concluíram com sucesso.

| Check | Resultado | Run |
|---|---|---|
| `m02-baseline` | SUCCESS | [job 124381053781](https://github.com/KayzenRoot/koros/actions/runs/41149091110/job/124381053781) |
| `m02-data` | SUCCESS | [job 124381053967](https://github.com/KayzenRoot/koros/actions/runs/41149091110/job/124381053967) |
| `governance-docs` | SUCCESS | [job 124381053560](https://github.com/KayzenRoot/koros/actions/runs/41149091109/job/124381053560) |
| `codeql-js` | SUCCESS | [job 124381054078](https://github.com/KayzenRoot/koros/actions/runs/41149091110/job/124381054078) |
| CodeQL | SUCCESS | [run 124381354075](https://github.com/KayzenRoot/koros/runs/124381354075) |
| SonarCloud Code Analysis | SUCCESS | [PR 86](https://sonarcloud.io/dashboard?id=KayzenRoot_koros&pullRequest=86) |
| Socket Security | SUCCESS | [PR alerts](https://socket.dev) |

Este arquivo é atualizado em um commit somente de evidência; o histórico corrente de checks, incluindo a reexecução no HEAD documental, deve ser lido em [PR #86 checks](https://github.com/KayzenRoot/koros/pull/86/checks). Nenhum resultado é extrapolado para além dos runs acima.
