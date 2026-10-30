import { existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Baseline-only integrity gate. This is NOT a general-purpose secrets scanner,
 * SCA engine, type checker, or production build verifier.
 */
export function auditManifest(pkg) {
  const findings = [];
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) return ['INVALID_PACKAGE'];
  if (pkg.private !== true) findings.push('PACKAGE_MUST_BE_PRIVATE');
  if (pkg.license !== 'UNLICENSED') findings.push('PACKAGE_LICENSE_CHANGED');
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (pkg[key] !== undefined && (typeof pkg[key] !== 'object' || pkg[key] === null || Array.isArray(pkg[key]) || Object.keys(pkg[key]).length > 0)) {
      findings.push('DEPENDENCY_REVIEW_REQUIRED:' + key);
    }
  }
  return findings;
}

export function auditActionPins(text) {
  const findings = [];
  for (const match of text.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)) {
    if (!/^[^\s@]+@[0-9a-f]{40}$/.test(match[1])) {
      findings.push('ACTION_NOT_SHA_PINNED:' + match[1]);
    }
  }
  return findings;
}

export function auditSourceText(text) {
  const patterns = [
    /ghp_[A-Za-z0-9]{20,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /sk-[A-Za-z0-9_-]{20,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ];
  return patterns.some((pattern) => pattern.test(text)) ? ['POSSIBLE_CREDENTIAL'] : [];
}

function walk(root, dir, results) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'coverage', 'dist'].includes(entry.name)) continue;
    const pathname = join(dir, entry.name);
    if (entry.isSymbolicLink() || lstatSync(pathname).isSymbolicLink()) {
      results.push({ pathname, symlink: true });
    } else if (entry.isDirectory()) {
      walk(root, pathname, results);
    } else if (entry.isFile()) {
      results.push({ pathname, symlink: false });
    }
  }
}

export function auditRepository(root) {
  const findings = [];
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  findings.push(...auditManifest(manifest));
  for (const name of ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml']) {
    if (existsSync(join(root, name))) findings.push('LOCKFILE_REVIEW_REQUIRED:' + name);
  }
  const source = [];
  for (const dir of ['src', 'scripts', 'test', '.github']) walk(root, join(root, dir), source);
  for (const item of source) {
    const name = relative(root, item.pathname).replaceAll('\\', '/');
    if (item.symlink) { findings.push('SYMLINK_REVIEW_REQUIRED:' + name); continue; }
    const ext = extname(name).toLowerCase();
    if (['.ts', '.tsx', '.mts', '.cts'].includes(ext)) {
      findings.push('TYPESCRIPT_NEEDS_REAL_TYPECHECK:' + name);
    }
    if (!['.js', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.ts', '.tsx', '.mts', '.cts'].includes(ext)) continue;
    const body = readFileSync(item.pathname, 'utf8');
    for (const hit of auditSourceText(body)) findings.push(name + ':' + hit);
    if (name.startsWith('.github/workflows/') && ['.yml', '.yaml'].includes(ext)) {
      for (const hit of auditActionPins(body)) findings.push(name + ':' + hit);
    }
  }
  return findings;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const findings = auditRepository(process.cwd());
    if (findings.length) {
      for (const f of findings) console.error('INTEGRITY_FAIL ' + f);
      process.exitCode = 1;
    } else {
      console.info('PASS: no declared npm dependencies, unpinned workflow actions, TypeScript files without typecheck, or obvious credentials in scoped source');
    }
  } catch (error) {
    console.error('INTEGRITY_FAIL ' + error.message);
    process.exitCode = 1;
  }
}
