import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src', 'scripts', 'test', 'public'];
const extensions = new Set(['.js', '.mjs', '.cjs']);
const files = roots
  .flatMap((root) =>
    readdirSync(root, { recursive: true })
      .filter((name) => extensions.has(name.slice(name.lastIndexOf('.'))))
      .map((name) => join(root, name)),
  )
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.info(`Syntax verified: ${files.length} JavaScript modules`);
