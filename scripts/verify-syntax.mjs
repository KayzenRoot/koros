import { spawnSync } from 'node:child_process';

const files = [
  'src/app.mjs',
  'src/config.mjs',
  'src/main.mjs',
  'src/tenant-envelope.mjs',
  'scripts/ci-integrity.mjs',
  'scripts/db-migrate.mjs',
  'scripts/smoke.mjs',
  'scripts/verify-syntax.mjs',
  'test/app.test.mjs',
  'test/ci-integrity.test.mjs',
  'test/data-model.test.mjs',
  'test/tenant-envelope.test.mjs',
];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.info(`Syntax verified: ${files.length} JavaScript modules`);
