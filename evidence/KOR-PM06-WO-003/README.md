# Evidence Bundle KOR-PM06-WO-003 — backup, restore e rollback de snapshot

**Data:** 2026-10-30. **Issue:** [#60](https://github.com/KayzenRoot/koros/issues/60). **Módulo:** [PRODUCT-M06 #41](https://github.com/KayzenRoot/koros/issues/41). **Base main:** `6e744b3df0ba0ec65408ffa3b2c0214457565e1d`. **Branch:** `feat/KOR-PM06-WO-003-backup-restore`. **Status:** `IMPLEMENTED_IN_PR / LOCAL_PASS / CI_PENDING`.

## 1. Context Lock

- M02–M06-WO-001/002 estão na main.
- Apenas PostgreSQL/Node locais e dados sintéticos; nenhum storage externo, VPS ou dado real.
- Nenhuma migração nova; nenhuma dependência nova.
- Sem merge, deploy, gasto ou alteração da main.

## 2. Escopo entregue

- `scripts/backup-format.mjs`: formato `KOROSBAK1`, AES-256-GCM, validação de metadata, comparação de tenant/migrations/contagens.
- `scripts/backup-restore.mjs`: backup, verify, restore, list, retenção.
- `scripts/backup-constants.mjs`: magic/formato/retenção.
- `deploy/local/BACKUP.md`: runbook, chave, restore, negativos e limites.
- `test/backup-unit.test.mjs`; scripts npm `backup*` e `test:backup`.
- Docs de deployment e este Bundle.

## 3. Formato e segurança

- Snapshot: `KOROSBAK1` + IV 12 B + tag GCM 16 B + ciphertext.
- Chave externa de 32 bytes (`KOROS_BACKUP_KEY` ou `KOROS_BACKUP_KEY_FILE`); nunca no Git/snapshot/log. Revogar/rotacionar a chave torna snapshots antigos ilegíveis.
- Metadata cifrada: formato, criação, database, tenant IDs, migrations/checksums e row counts.
- `pg_dump`/restore usam credenciais locais via ambiente; a URL/segredo não é impressa.
- Restore exige `KOROS_ALLOW_RESTORE=1` e target `koros_restore_*`; compara tenant set, migrations e contagens antes de sucesso; divergência remove o target.
- Retenção apaga somente snapshots `.korosbackup` dentro do diretório local configurado.

## 4. Critérios de aceitação

| Critério | Prova |
|---|---|
| Restore comprovado | Snapshot 2 tenants/8 migrations/2 runs restaurado em `koros_restore_local1`; alvo 2 org/2 runs/8 migrations |
| Estado/tenant íntegros | `assertSnapshotMatches` compara tenant IDs, migrations/checksums e row counts |
| Impedir restore cruzado | `--expect-tenant` desconhecido → `TENANT_MISMATCH`; target só após opt-in |
| Snapshot corrupto | byte alterado → `SNAPSHOT_CORRUPT` |
| Versão incompatível | formato 99 → `INCOMPATIBLE_VERSION` |
| Segredo exposto | bytes do snapshot não contêm fixture de webhook nem a chave |
| Retenção | 3 backups com retenção 2 mantiveram exatamente 2 snapshots |

## 5. Provas locais

| Prova | Resultado |
|---|---|
| `npm ci --ignore-scripts` | PASS |
| `npm run lint` | PASS — 93 módulos JavaScript |
| `node --test test/backup-unit.test.mjs` | **PASS — 5/5** |
| `npm run backup` no ambiente local | PASS — 2 tenants, 8 migrations, 2 runs |
| `npm run backup:verify` | PASS — `verified` |
| `backup:restore` em banco isolado | PASS — `restored`, contagens iguais |
| Corrupção / versão / tenant errado | PASS — `SNAPSHOT_CORRUPT` / `INCOMPATIBLE_VERSION` / `TENANT_MISMATCH` |
| Retenção 2 | PASS — 2 snapshots mantidos |
| `npm run test:db` | **PASS — 86/86** |
| `npm run check` sem banco | PASS — 90 testes, 86 skips |
| `npm run smoke` | PASS |
| `docs` | PASS — 47 Markdown, 79 links, 0 findings |

**NOT_RUN:** storage off-host, failover automático, WORM/imutabilidade, escrow/HSM, RPO/RTO, restore de produção, rollback de binário/aplicação e Playwright.

## 6. Limites

- Backup/restore local e sintético; não há cópia off-host nem retenção geográfica.
- Snapshot-level rollback está provado; rollback de binário/aplicação e failover gerenciado permanecem PENDING.
- Chave precisa ser preservada externamente; perdida a chave, o snapshot é irrecuperável.
- Restore cria banco separado; não substitui o banco corrente.
- Nenhum merge, deploy, gasto ou dado real.

## 7. CI esperado

- `m02-baseline`, `m02-data`, `governance-docs`, CodeQL, Sonar e Socket.
- Nenhum required check novo; `governance-docs` permanece o required existente.
- O resultado do HEAD final deve ser consultado no PR; nenhum `SUCCESS` é presumido.
