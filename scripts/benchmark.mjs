import { performance } from 'node:perf_hooks';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { classifyLead, createMockAiAdapter } from '../src/ai/index.mjs';
import { fieldsForPayload, approvalHash } from '../src/approval/index.mjs';
import { createAgendorMock } from '../src/crm/mock-agendor.mjs';
import { closePool, isDatabaseConfigured, withTenant } from '../src/db.mjs';
import { getDashboardSummary } from '../src/dashboard/service.mjs';
import { claimNextAction } from '../src/outbox/index.mjs';
import { BACKUP_FORMAT_VERSION } from './backup-constants.mjs';
import { decryptSnapshot, encryptSnapshot } from './backup-format.mjs';
import { previewTemplateConfig, validateTemplateConfig } from '../src/templates/schema.mjs';
import { compareToBaseline, scaledRuns, summarize } from './benchmark-stats.mjs';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const LEAD_A = 'a0000000-0000-4000-8000-000000000004';
const WORKFLOW_VERSION_A = 'a0000000-0000-4000-8000-000000000002';
const BENCH_RUN = `${Date.now().toString(36)}-${process.pid}`;
const KEY = randomBytes(32);
const SCALE = process.argv.includes('--scale') ? process.argv[process.argv.indexOf('--scale') + 1] : 'small';
if (SCALE !== 'small' && SCALE !== 'medium') throw new Error('benchmark_scale_must_be_small_or_medium');
const OUT_INDEX = process.argv.indexOf('--out');
const OUT = OUT_INDEX >= 0 ? process.argv[OUT_INDEX + 1] : null;
const BASELINE_INDEX = process.argv.indexOf('--baseline');
const BASELINE = BASELINE_INDEX >= 0 ? process.argv[BASELINE_INDEX + 1] : null;

function iterations() {
  return SCALE === 'medium'
    ? { ai: 5000, hash: 20000, template: 5000, crypto: 50, db: 20 }
    : { ai: 1000, hash: 5000, template: 1000, crypto: 20, db: 10 };
}

function metric(name, samples, extra = {}) {
  const latency = summarize(samples);
  const total = latency.mean * latency.count || 1;
  return {
    name,
    ...extra,
    latency_ms: latency,
    ops_per_sec: Number(((latency.count / total) * 1000).toFixed(2)),
  };
}

function measureSync(fn, count) {
  const samples = [];
  const cpuStart = process.cpuUsage();
  const wallStart = performance.now();
  for (let index = 0; index < count; index += 1) {
    const start = performance.now();
    fn(index);
    samples.push(performance.now() - start);
  }
  const wall = performance.now() - wallStart;
  const cpu = process.cpuUsage(cpuStart);
  return {
    samples,
    wall_ms: Number(wall.toFixed(3)),
    cpu_ms: Number(((cpu.user + cpu.system) / 1000).toFixed(3)),
    rss_mb: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2)),
  };
}

async function collectAsync(fn, count, index, samples) {
  if (index >= count) return samples;
  const start = performance.now();
  await fn(index);
  samples.push(performance.now() - start);
  return collectAsync(fn, count, index + 1, samples);
}

async function measureAsync(fn, count) {
  const samples = [];
  const cpuStart = process.cpuUsage();
  const wallStart = performance.now();
  await collectAsync(fn, count, 0, samples);
  const wall = performance.now() - wallStart;
  const cpu = process.cpuUsage(cpuStart);
  return {
    samples,
    wall_ms: Number(wall.toFixed(3)),
    cpu_ms: Number(((cpu.user + cpu.system) / 1000).toFixed(3)),
    rss_mb: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2)),
  };
}

async function seedDatabase(scale) {
  const runCount = scaledRuns(scale);
  await withTenant(TENANT_A, async (client) => {
    await client.query(
      `INSERT INTO runs (tenant_id, lead_id, workflow_version_id, state, idempotency_key)
       SELECT $1, $2, $3, 'PENDING_APPROVAL', 'bench-' || $4 || '-' || g
         FROM generate_series(1, $5) AS g
       ON CONFLICT DO NOTHING`,
      [TENANT_A, LEAD_A, WORKFLOW_VERSION_A, BENCH_RUN, runCount],
    );
    await client.query(
      `INSERT INTO outbox_actions
         (tenant_id, run_id, operation_key, target, payload_hash, status, next_attempt_at)
       SELECT $1, $2, 'bench-outbox-' || $3 || '-' || g, 'benchmark', repeat('a', 64),
              'PENDING', now()
         FROM generate_series(1, $4) AS g
       ON CONFLICT DO NOTHING`,
      [TENANT_A, 'a0000000-0000-4000-8000-000000000005', BENCH_RUN, runCount],
    );
  });
  return runCount;
}

async function dbWorkload(scale, dbIterations) {
  if (!isDatabaseConfigured()) return null;
  const runCount = await seedDatabase(scale);
  const summary = await measureAsync(
    () => getDashboardSummary({ tenantId: TENANT_A, role: 'owner' }),
    dbIterations,
  );
  const claims = await measureAsync(() => claimNextAction({ tenantId: TENANT_A }), runCount);
  return {
    dashboard: metric('db-dashboard-summary', summary.samples, {
      queued_runs: runCount,
      wall_ms: summary.wall_ms,
      cpu_ms: summary.cpu_ms,
      rss_mb: summary.rss_mb,
    }),
    claim: metric('outbox-claim', claims.samples, {
      queued_actions: runCount,
      wall_ms: claims.wall_ms,
      cpu_ms: claims.cpu_ms,
      rss_mb: claims.rss_mb,
    }),
  };
}

async function main() {
  const counts = iterations();
  const adapter = createMockAiAdapter();
  const aiRun = await measureAsync(async () => {
    const result = await classifyLead({
      tenantId: TENANT_A,
      input: { intent: 'Quero uma demonstração', consent_status: 'GRANTED' },
      adapter,
      timeoutMs: 1000,
    });
    if (result.classification.intent !== 'demo') throw new Error('benchmark_ai_mismatch');
  }, counts.ai);

  const payload = { external_id: 'bench-1', email: 'bench@example.invalid', name: 'Bench' };
  const fields = fieldsForPayload(payload);
  const hash = measureSync(
    (index) => approvalHash({ scope: 'crm.contact.upsert', operation: 'crm.contact.upsert', payload: { ...payload, name: `Bench ${index}` }, fields, payloadVersion: 1 }),
    counts.hash,
  );
  const config = validateTemplateConfig({
    schema_version: 1,
    name: 'Benchmark template',
    source: { provider: 'synthetic-webhook', account: 'benchmark' },
    required_fields: ['external_id', 'email'],
    field_map: { external_id: 'external_id', email: 'email', name: 'name' },
    crm: { operation: 'crm.contact.upsert', target: 'crm:agendor' },
    approval: { required: true, scope: 'crm.contact.upsert', ttl_seconds: 900 },
    limits: { max_tokens: 1000, max_cost: 10 },
  });
  const template = measureSync(
    (index) => previewTemplateConfig(config, { external_id: `bench-${index}`, email: 'bench@example.invalid', name: 'Bench' }),
    counts.template,
  );
  const sql = 'SELECT 1;\n'.repeat(4096);
  const encrypted = encryptSnapshot({
    metadata: {
      format_version: BACKUP_FORMAT_VERSION,
      created_at: new Date().toISOString(),
      database: 'koros_local',
      tenant_ids: [TENANT_A],
      migrations: [{ version: '0001_init', checksum: 'a'.repeat(64) }],
      row_counts: { organizations: 1 },
    },
    sql,
    key: KEY,
  });
  const crypto = measureSync(() => {
    const snapshot = encryptSnapshot({
      metadata: {
        format_version: BACKUP_FORMAT_VERSION,
        created_at: new Date().toISOString(),
        database: 'koros_local',
        tenant_ids: [TENANT_A],
        migrations: [{ version: '0001_init', checksum: 'a'.repeat(64) }],
        row_counts: { organizations: 1 },
      },
      sql,
      key: KEY,
    });
    decryptSnapshot(snapshot, KEY);
  }, counts.crypto);

  const db = await dbWorkload(SCALE, counts.db);
  const workloads = {
    'ai-classify': metric('ai-classify', aiRun.samples, {
      iterations: counts.ai,
      wall_ms: aiRun.wall_ms,
      cpu_ms: aiRun.cpu_ms,
      rss_mb: aiRun.rss_mb,
    }),
    'approval-hash': metric('approval-hash', hash.samples, { iterations: counts.hash, wall_ms: hash.wall_ms, cpu_ms: hash.cpu_ms, rss_mb: hash.rss_mb }),
    'template-preview': metric('template-preview', template.samples, { iterations: counts.template, wall_ms: template.wall_ms, cpu_ms: template.cpu_ms, rss_mb: template.rss_mb }),
    'snapshot-crypto': metric('snapshot-crypto', crypto.samples, { iterations: counts.crypto, wall_ms: crypto.wall_ms, cpu_ms: crypto.cpu_ms, rss_mb: crypto.rss_mb }),
  };
  if (db) {
    workloads['db-dashboard-summary'] = db.dashboard;
    workloads['outbox-claim'] = db.claim;
  }

  const result = {
    generated_at: new Date().toISOString(),
    scale: SCALE,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
    },
    config: counts,
    workloads,
    db: db ? 'MEASURED' : 'NOT_RUN',
    benchmark_encrypted_bytes: encrypted.length,
  };

  if (OUT) writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
  if (BASELINE) {
    const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
    const regressions = compareToBaseline(result.workloads, baseline.workloads);
    console.info(JSON.stringify({ status: regressions.length ? 'REGRESSION' : 'OK', regressions }, null, 2));
    if (regressions.length) process.exitCode = 1;
  } else {
    console.info(JSON.stringify(result, null, 2));
  }
  if (isDatabaseConfigured()) await closePool();
}

await main();
