function compareNumbers(a, b) {
  return a - b;
}

export function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('invalid_percentile');
  const sorted = [...values].sort(compareNumbers);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

export function summarize(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { count: 0, min: 0, p50: 0, p95: 0, p99: 0, max: 0, mean: 0 };
  }
  const sorted = [...values].sort(compareNumbers);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    count: sorted.length,
    min: sorted[0],
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted[sorted.length - 1],
    mean: Number((sum / sorted.length).toFixed(3)),
  };
}

/**
 * A regression is a lower throughput or a higher p95 than the baseline with
 * generous, documented tolerances. This is a local guard, not an SLA.
 */
export function compareToBaseline(current, baseline, { opsFloor = 0.5, p95Ceiling = 2 } = {}) {
  const regressions = [];
  for (const [name, currentValue] of Object.entries(current)) {
    const baselineValue = baseline[name];
    if (!baselineValue) continue;
    if (currentValue.ops_per_sec < baselineValue.ops_per_sec * opsFloor) {
      regressions.push({ workload: name, metric: 'ops_per_sec', current: currentValue.ops_per_sec, baseline: baselineValue.ops_per_sec });
    }
    if (currentValue.latency_ms.p95 > baselineValue.latency_ms.p95 * p95Ceiling) {
      regressions.push({ workload: name, metric: 'p95', current: currentValue.latency_ms.p95, baseline: baselineValue.latency_ms.p95 });
    }
  }
  return regressions;
}

export function scaledRuns(scale) {
  return scale === 'medium' ? 1000 : 200;
}
