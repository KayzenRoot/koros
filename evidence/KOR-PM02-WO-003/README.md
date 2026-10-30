# Evidence Bundle KOR-PM02-WO-003 — dados, migrations e RLS

**Data:** 2026-10-30. **Issue:** [#47](https://github.com/KayzenRoot/koros/issues/47). **Módulo:** [PRODUCT-M02 #37](https://github.com/KayzenRoot/koros/issues/37). **Base main:** `e25082ab029a04211a1379c518f61d13c9934e25`. **Branch:** `feat/KOR-PM02-WO-003-data-migrations`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock e autorização

- Decisão técnica [#73](https://github.com/KayzenRoot/koros/issues/73) aprovada e fechada em 2026-10-30; D-M02-01/02/06/07/08/09 aplicadas neste incremento.
- `ADR-017` (PostgreSQL + RLS) e `ADR-018` (sessão/scrypt) permanecem `PROPOSED_IN_PR`; `ADR-006/009` seguem `PENDING`.
- Nenhum merge, deploy, dado real, cliente, conta ou gasto. O driver de runtime `pg` **não** foi adicionado nesta WO; o baseline continua sem dependências npm. A decisão do driver fica para #46, com revisão de licença/dependência.
- PostgreSQL 17.10 local; Docker não foi usado; cluster temporário isolado na porta 55432.

## 2. Escopo entregue

- `db/migrations/0001_init.sql`: organizações/tenants, usuários, memberships, sessões, conexões, workflows/versões, inbound events, leads, runs, classifications, approvals, outbox, audit, usage e retention.
- `db/migrations/0001_init.down.sql`: rollback de dev/test; produção usa backup/restore.
- `db/bootstrap/test-role.sql`: papel `koros_app` de teste; senha sintética explícita, local/CI apenas.
- `db/seeds/synthetic.sql`: dois tenants (`1111…`, `2222…`), usuários, workflows, eventos, leads, runs, approvals, audit e usage, todos sintéticos.
- `scripts/db-migrate.mjs`: runner `up/down/seed/status` com checksum SHA-256 e `schema_migrations`.
- `test/data-model.test.mjs`: 12 testes de schema, RLS, audit, constraints e FK composta.
- `.github/workflows/koros-baseline.yml`: job `m02-data` com serviço `postgres:17`, migrate, seed, testes e rollback/reapply; path `db/**`.
- `docs/05-data-model.md`: referência para o schema implementado.

## 3. Invariantes de segurança

- `tenant_id` em todas as tabelas tenant-scoped; RLS habilitada em 15 tabelas.
- Política `tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid`; sem setting, nenhuma linha.
- `koros_app` é `NOSUPERUSER NOBYPASSRLS`; `schema_migrations` não é acessível ao app.
- `audit_events`: app tem `SELECT`/`INSERT`; `UPDATE`/`DELETE` negados.
- FKs compostas `(id, tenant_id)` impedem referência cruzada entre tenants.
- `connections.secret_ref` é referência; nenhum segredo real no schema/seed.
- **Limite explícito:** o papel da aplicação pode definir `app.tenant_id`; portanto o servidor deve derivar o tenant da sessão autenticada, nunca do cliente. Essa ligação é responsabilidade da #46. A tabela `users` é global por design; a autorização de leitura é da #46.

## 4. Testes executados localmente

| Prova | Resultado |
|---|---|
| `npm run db:migrate` | PASS — `APPLY 0001_init` |
| `npm run db:seed` | PASS |
| `KOROS_DB_TESTS=1 npm run test:db` | **12/12 PASS** |
| `npm run db:rollback && npm run db:migrate && npm run db:seed && npm run test:db` | **12/12 PASS** |
| `npm run check` | PASS — 14 testes, 12 DB tests `SKIP` sem `KOROS_DB_TESTS` |
| `npm run smoke` | PASS — loopback e rota protegida fail-closed |
| `npm run ci:integrity` | PASS — zero dependências npm, actions pinadas |

Os testes cobrem: migration aplicada/checksum, seed de dois tenants, RLS por tenant, fail-closed sem setting, insert cruzado rejeitado, update cruzado sem efeito, audit append-only, unique de lead, FK composta cross-tenant, proteção de `schema_migrations` e escopo de audit.

## 5. CI

- `m02-data` usa `services: postgres:17` e cliente `psql`; executa migrate, test-role, seed, 12 testes e o ciclo rollback/reapply.
- `m02-baseline` continua igual; `governance-docs` segue required; `m02-data` **não** foi tornado required nesta WO.
- CI do HEAD final deve ser consultado após o push; nenhum `SUCCESS` é presumido.

### Correção após o primeiro run do SonarCloud (2026-10-30)

- Primeiro run: `SonarCloud Code Analysis` **FAIL**; quality gate `new_security_rating=3` (C).
- Achados: 2x `jssecurity:S8705` em `scripts/db-migrate.mjs` (argumentos dinâmicos no `spawnSync`).
- Correção: comando fixo `psql`, argumentos fixos e SQL/migrations por **stdin**; nenhum `-c`/`-f` dinâmico.
- Segundo run: restaram `javascript:S4036` (PATH do `psql`) e `jssecurity:S8707` (path traversal).
- Correção final: caminho absoluto do `psql` (`/usr/bin/psql` no CI e `C:\Program Files\PostgreSQL\17\bin\psql.exe` no Windows) e allowlist estática de migrations; nenhum caminho dinâmico.
- Revalidação local após a correção: **12/12** testes DB, rollback/reapply **12/12**, `npm run check`, smoke e docs PASS.

## 6. Riscos e STOP

- **Alto:** RLS não substitui a autorização server-side; a #46 precisa vincular sessão→tenant e membership.
- **Médio:** `users` global; policies de leitura de usuário serão definidas na #46.
- **Médio:** sem driver de runtime; #46 decide `pg` com licença/pin e atualiza o guard.
- **Baixo:** senha de teste explícita no bootstrap é local/CI e não é credencial de produção.
- **STOP:** cross-tenant, migration destrutiva, perda de audit, dependência não auditada, CI falho ou dado real interrompem a WO.

## 7. Próximo passo

Revisar o PR Draft, validar CI no HEAD, e somente após `APPROVED` avançar para #46 (auth/RBAC/sessão), que resolve o vínculo sessão→tenant e o driver de runtime.
