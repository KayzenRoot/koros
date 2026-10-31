# Synthetic backup and restore

Local/synthetic only. Snapshots are encrypted with AES-256-GCM and require an
external key; the key is never stored in the repository or snapshot.

## Key

Generate a key once and keep it outside Git:

```bash
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64') + '\n')" > .koros/backup.key
chmod 600 .koros/backup.key
export KOROS_BACKUP_KEY_FILE="$PWD/.koros/backup.key"
```

Revoking/rotating the key makes existing snapshots unreadable. There is no key
escrow in the repo. Use `KOROS_BACKUP_KEY` instead of a file only if the
environment injects it securely.

## Database URL

Use a local synthetic owner/restore URL, never production:

```bash
export KOROS_BACKUP_DATABASE_URL="postgres://postgres@127.0.0.1:55432/koros_local"
```

The URL is read from the environment; it is not printed or embedded in the
snapshot metadata.

## Commands

```bash
npm run backup                         # encrypted snapshot + retention
npm run backup:list
npm run backup:verify -- --snapshot .koros/backups/<file>.korosbackup
KOROS_ALLOW_RESTORE=1 npm run backup:restore -- \
  --snapshot .koros/backups/<file>.korosbackup \
  --target-db koros_restore_<name> \
  --expect-tenant 11111111-1111-4111-8111-111111111111
```

Defaults:

- Directory: `.koros/backups/` (gitignored).
- Retention: 5 snapshots (`KOROS_BACKUP_RETENTION=1..100`).
- Snapshot format `KOROSBAK1`: magic + IV + GCM tag + ciphertext.
- Metadata inside the encrypted envelope: format version, created_at, database,
  tenant IDs, migration versions/checksums, key row counts.
- Restore only creates `koros_restore_*` databases and requires
  `KOROS_ALLOW_RESTORE=1`.
- Restore verifies tenant set, migrations and row counts; mismatch drops the
  target database and fails closed.

## Negative cases

- Corrupt file/tamper → `SNAPSHOT_CORRUPT`.
- Wrong key → `SNAPSHOT_CORRUPT`.
- Unknown format version → `INCOMPATIBLE_VERSION`.
- Missing expected tenant → `TENANT_MISMATCH`.
- Migration/checksum or row-count drift → `MIGRATION_MISMATCH`/`ROW_COUNT_MISMATCH`.
- Restore without explicit opt-in → `RESTORE_DISABLED`.

## Limits

No off-host storage, automated failover, WORM/immutability, key escrow, RPO/RTO
or production data. Snapshot-level rollback is proven; application binary
rollback and managed failover remain PENDING.
