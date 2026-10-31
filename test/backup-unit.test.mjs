import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import {
  BackupError,
  assertSnapshotMatches,
  decryptSnapshot,
  encryptSnapshot,
  parseBackupKey,
  validateSnapshotMetadata,
} from '../scripts/backup-format.mjs';

const KEY = randomBytes(32);
const METADATA = {
  format_version: 1,
  created_at: '2026-10-30T12:00:00.000Z',
  database: 'koros_local',
  tenant_ids: ['11111111-1111-4111-8111-111111111111'],
  migrations: [{ version: '0001_init', checksum: 'a'.repeat(64) }],
  row_counts: { organizations: 1, users: 1, runs: 2 },
};

function snapshot(overrides = {}) {
  return encryptSnapshot({
    metadata: { ...METADATA, ...overrides },
    sql: 'CREATE TABLE synthetic(id int);\n',
    key: KEY,
  });
}

test('encrypted snapshots round-trip and reject a wrong key', () => {
  const encrypted = snapshot();
  const decrypted = decryptSnapshot(encrypted, KEY);
  assert.equal(decrypted.sql.includes('synthetic'), true);
  assert.equal(decrypted.metadata.database, 'koros_local');
  assert.throws(
    () => decryptSnapshot(encrypted, randomBytes(32)),
    (error) => error instanceof BackupError && error.code === 'SNAPSHOT_CORRUPT',
  );
});

test('tampered snapshots and wrong magic are rejected', () => {
  const encrypted = snapshot();
  const tampered = Buffer.from(encrypted);
  tampered[tampered.length - 1] ^= 0xff;
  assert.throws(
    () => decryptSnapshot(tampered, KEY),
    (error) => error.code === 'SNAPSHOT_CORRUPT',
  );
  const wrongMagic = Buffer.from(encrypted);
  wrongMagic[0] = 0x00;
  assert.throws(
    () => decryptSnapshot(wrongMagic, KEY),
    (error) => error.code === 'SNAPSHOT_CORRUPT',
  );
});

test('incompatible format and malformed metadata fail closed', () => {
  assert.throws(
    () => validateSnapshotMetadata({ ...METADATA, format_version: 99 }),
    (error) => error.code === 'INCOMPATIBLE_VERSION',
  );
  assert.throws(
    () => validateSnapshotMetadata({ ...METADATA, tenant_ids: 'not-an-array' }),
    (error) => error.code === 'INVALID_METADATA',
  );
});

test('restore metadata must match tenant, migrations and row counts exactly', () => {
  assert.doesNotThrow(() =>
    assertSnapshotMatches({
      metadata: METADATA,
      current: { ...METADATA },
    }),
  );
  assert.throws(
    () =>
      assertSnapshotMatches({
        metadata: METADATA,
        current: { ...METADATA, tenant_ids: ['22222222-2222-4222-8222-222222222222'] },
      }),
    (error) => error.code === 'TENANT_MISMATCH',
  );
  assert.throws(
    () =>
      assertSnapshotMatches({
        metadata: METADATA,
        current: {
          ...METADATA,
          migrations: [{ version: '0002_auth', checksum: 'b'.repeat(64) }],
        },
      }),
    (error) => error.code === 'MIGRATION_MISMATCH',
  );
  assert.throws(
    () =>
      assertSnapshotMatches({
        metadata: METADATA,
        current: { ...METADATA, row_counts: { ...METADATA.row_counts, runs: 3 } },
      }),
    (error) => error.code === 'ROW_COUNT_MISMATCH',
  );
});

test('backup key accepts 32-byte base64 or 64-char hex only', () => {
  assert.equal(parseBackupKey(KEY.toString('base64')).length, 32);
  assert.equal(parseBackupKey(KEY.toString('hex')).length, 32);
  assert.throws(() => parseBackupKey('short'), (error) => error.code === 'INVALID_KEY');
});
