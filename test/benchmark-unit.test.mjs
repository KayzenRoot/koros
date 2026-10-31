import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareToBaseline, percentile, scaledRuns, summarize } from '../scripts/benchmark-stats.mjs';

test('percentiles and summary are deterministic', () => {
  const values = Array.from({ length: 100 }, (_, index) => index + 1);
  assert.equal(percentile(values, 0.5), 50);
  assert.equal(percentile(values, 0.95), 95);
  const summary = summarize(values);
  assert.equal(summary.count, 100);
  assert.equal(summary.min, 1);
  assert.equal(summary.max, 100);
  assert.equal(summary.p50, 50);
});

test('baseline comparison flags throughput and p95 regressions', () => {
  const baseline = {
    ai: { ops_per_sec: 100, latency_ms: { p95: 10 } },
    db: { ops_per_sec: 50, latency_ms: { p95: 100 } },
  };
  assert.deepEqual(compareToBaseline(baseline, baseline), []);
  const slower = {
    ai: { ops_per_sec: 40, latency_ms: { p95: 10 } },
    db: { ops_per_sec: 60, latency_ms: { p95: 300 } },
  };
  const regressions = compareToBaseline(slower, baseline);
  assert.equal(regressions.some((item) => item.workload === 'ai' && item.metric === 'ops_per_sec'), true);
  assert.equal(regressions.some((item) => item.workload === 'db' && item.metric === 'p95'), true);
});

test('scale selects a bounded synthetic queue size', () => {
  assert.equal(scaledRuns('small'), 200);
  assert.equal(scaledRuns('medium'), 1000);
  assert.equal(scaledRuns('other'), 200);
});
