import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { BACKUP_MAGIC } from './backup-constants.mjs';

const MAGIC = Buffer.from(BACKUP_MAGIC, 'utf8');
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export class BackupError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
  }
}

export function parseBackupKey(value) {
  if (typeof value !== 'string' || !value) throw new BackupError('INVALID_KEY');
  const hex = Buffer.from(value, 'hex');
  if (hex.length === 32 && /^[0-9a-f]{64}$/i.test(value)) return hex;
  const base64 = Buffer.from(value, 'base64');
  if (base64.length === 32) return base64;
  throw new BackupError('INVALID_KEY');
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateSnapshotMetadata(metadata) {
  if (!isPlainObject(metadata)) throw new BackupError('INVALID_METADATA');
  if (metadata.format_version !== 1) throw new BackupError('INCOMPATIBLE_VERSION');
  if (typeof metadata.created_at !== 'string' || Number.isNaN(Date.parse(metadata.created_at))) {
    throw new BackupError('INVALID_METADATA');
  }
  if (typeof metadata.database !== 'string' || !metadata.database) throw new BackupError('INVALID_METADATA');
  if (!Array.isArray(metadata.tenant_ids) || !metadata.tenant_ids.every((id) => typeof id === 'string')) {
    throw new BackupError('INVALID_METADATA');
  }
  if (!Array.isArray(metadata.migrations)) throw new BackupError('INVALID_METADATA');
  for (const migration of metadata.migrations) {
    if (
      !isPlainObject(migration) ||
      typeof migration.version !== 'string' ||
      typeof migration.checksum !== 'string' ||
      !/^[0-9a-f]{64}$/i.test(migration.checksum)
    ) {
      throw new BackupError('INVALID_METADATA');
    }
  }
  if (!isPlainObject(metadata.row_counts)) throw new BackupError('INVALID_METADATA');
  return metadata;
}

export function encryptSnapshot({ metadata, sql, key, iv = randomBytes(IV_LENGTH) }) {
  const validMetadata = validateSnapshotMetadata(metadata);
  if (typeof sql !== 'string') throw new BackupError('INVALID_METADATA');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify({ metadata: validMetadata, sql }), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptSnapshot(buffer, key) {
  if (!Buffer.isBuffer(buffer) || buffer.length <= MAGIC.length + IV_LENGTH + TAG_LENGTH) {
    throw new BackupError('SNAPSHOT_CORRUPT');
  }
  if (!buffer.subarray(0, MAGIC.length).equals(MAGIC)) throw new BackupError('SNAPSHOT_CORRUPT');
  const ivStart = MAGIC.length;
  const tagStart = ivStart + IV_LENGTH;
  const dataStart = tagStart + TAG_LENGTH;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, buffer.subarray(ivStart, tagStart));
    decipher.setAuthTag(buffer.subarray(tagStart, dataStart));
    const plaintext = Buffer.concat([decipher.update(buffer.subarray(dataStart)), decipher.final()]);
    const parsed = JSON.parse(plaintext.toString('utf8'));
    if (!isPlainObject(parsed) || typeof parsed.sql !== 'string') throw new BackupError('SNAPSHOT_CORRUPT');
    return { metadata: validateSnapshotMetadata(parsed.metadata), sql: parsed.sql };
  } catch (error) {
    if (error instanceof BackupError) throw error;
    throw new BackupError('SNAPSHOT_CORRUPT');
  }
}

function sorted(values) {
  return [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function assertSnapshotMatches({ metadata, current }) {
  if (sorted(metadata.tenant_ids).join(',') !== sorted(current.tenant_ids).join(',')) {
    throw new BackupError('TENANT_MISMATCH');
  }
  const snapshotMigrations = metadata.migrations.map((item) => `${item.version}:${item.checksum}`);
  const currentMigrations = current.migrations.map((item) => `${item.version}:${item.checksum}`);
  if (sorted(snapshotMigrations).join(',') !== sorted(currentMigrations).join(',')) {
    throw new BackupError('MIGRATION_MISMATCH');
  }
  for (const [table, count] of Object.entries(metadata.row_counts)) {
    if (current.row_counts[table] !== count) throw new BackupError('ROW_COUNT_MISMATCH');
  }
}
