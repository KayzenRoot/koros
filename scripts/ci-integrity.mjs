import { existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Baseline-only integrity gate. This is NOT a general-purpose secrets scanner,
 * SCA engine, type checker, or production build verifier.
 *
 * The single reviewed runtime dependency is pinned here. Any other change to
 * dependencies, devDependencies, optionalDependencies or peerDependencies is
 * rejected until a new review updates this allowlist and the lockfile.
 */
const ALLOWED_DEPENDENCIES = Object.freeze({ pg: '8.23.1' });

export function auditManifest(pkg) {
  const findings = [];
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) return ['INVALID_PACKAGE'];
  if (pkg.private !== true) findings.push('PACKAGE_MUST_BE_PRIVATE');
  if (pkg.license !== 'UNLICENSED') findings.push('PACKAGE_LICENSE_CHANGED');
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const deps = pkg[key];
    if (deps === undefined) continue;
    if (typeof deps !== 'object' || deps === null || Array.isArray(deps)) {
      findings.push('INVALID_DEPENDENCY_MAP:' + key);
      continue;
    }
    for (const [name, version] of Object.entries(deps)) {
      if (key !== 'dependencies' || ALLOWED_DEPENDENCIES[name] !== version) {
        findings.push(`DEPENDENCY_REVIEW_REQUIRED:${key}:${name}@${version}`);
      }
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
  const direct = manifest.dependencies && typeof manifest.dependencies === 'object' ? manifest.dependencies : {};
  const lockfile = join(root, 'package-lock.json');
  if (Object.keys(direct).length > 0) {
    if (!existsSync(lockfile)) {
      findings.push('LOCKFILE_REQUIRED');
    } else {
      try {
        const lock = JSON.parse(readFileSync(lockfile, 'utf8'));
        const rootDeps = lock.packages?.['']?.dependencies ?? {};
        if (JSON.stringify(rootDeps) !== JSON.stringify(direct)) findings.push('LOCKFILE_MANIFEST_MISMATCH');
        const lockedPg = lock.packages?.['node_modules/pg']?.version;
        if (lockedPg !== ALLOWED_DEPENDENCIES.pg) findings.push('LOCKFILE_PG_VERSION_MISMATCH:' + String(lockedPg));
      } catch {
        findings.push('LOCKFILE_INVALID');
      }
    }
  } else if (existsSync(lockfile)) {
    findings.push('LOCKFILE_WITHOUT_REVIEWED_DEPENDENCY');
  }
  for (const name of ['npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml']) {
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
      console.info('PASS: only the reviewed pg dependency is declared; actions are SHA-pinned; no TypeScript without typecheck or obvious credentials in scoped source');
    }
  } catch (error) {
    console.error('INTEGRITY_FAIL ' + error.message);
    process.exitCode = 1;
  }
}
