import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditManifest, auditActionPins, auditSourceText, auditRepository } from '../scripts/ci-integrity.mjs';

const safePackage = {
  name: 'example-synthetic', version: '0.1.0', private: true,
  license: 'UNLICENSED', type: 'module', scripts: { test: 'node --test' },
};

test('manifest allows only the exact reviewed pg dependency and remains private', () => {
  assert.deepEqual(auditManifest(safePackage), []);
  assert.deepEqual(auditManifest({ ...safePackage, dependencies: { pg: '8.23.1' } }), []);
  assert.deepEqual(auditManifest({ ...safePackage, dependencies: { pg: '8.23.0' } }), ['DEPENDENCY_REVIEW_REQUIRED:dependencies:pg@8.23.0']);
  assert.deepEqual(auditManifest({ ...safePackage, dependencies: { bad: '*' } }), ['DEPENDENCY_REVIEW_REQUIRED:dependencies:bad@*']);
  assert.deepEqual(auditManifest({ ...safePackage, devDependencies: { pg: '8.23.1' } }), ['DEPENDENCY_REVIEW_REQUIRED:devDependencies:pg@8.23.1']);
  assert.deepEqual(auditManifest({ ...safePackage, private: false }), ['PACKAGE_MUST_BE_PRIVATE']);
  assert.deepEqual(auditManifest({ ...safePackage, license: 'MIT' }), ['PACKAGE_LICENSE_CHANGED']);
});

test('unpinned action is rejected, pinned commit is accepted', () => {
  assert.deepEqual(auditActionPins('- uses: actions/checkout@1234567890abcdef1234567890abcdef12345678'), []);
  assert.deepEqual(auditActionPins('    - uses: actions/checkout@v4'), ['ACTION_NOT_SHA_PINNED:actions/checkout@v4']);
});

test('fake secret-looking fixture is detected without storing a credential', () => {
  const fake = 'ghp_' + 'A'.repeat(30);
  assert.deepEqual(auditSourceText(fake), ['POSSIBLE_CREDENTIAL']);
  assert.deepEqual(auditSourceText('const value = 123;'), []);
});

test('repository integrity negative cases fail closed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'koros-ci-'));
  try {
    for (const name of ['src', 'scripts', 'test', '.github', '.github/workflows']) mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify(safePackage));
    writeFileSync(join(dir, '.github/workflows/test.yml'), '- uses: actions/checkout@1234567890abcdef1234567890abcdef12345678\n');
    assert.deepEqual(auditRepository(dir), []);
    writeFileSync(join(dir, '.github/workflows/test.yml'), '- uses: actions/checkout@v4\n');
    assert(auditRepository(dir).some(x => x.includes('ACTION_NOT_SHA_PINNED')));
    writeFileSync(join(dir, '.github/workflows/test.yml'), '- uses: actions/checkout@1234567890abcdef1234567890abcdef12345678\n');
    writeFileSync(join(dir, 'src/leak.mjs'), 'const token = "' + 'ghp_' + 'A'.repeat(30) + '";\n');
    assert(auditRepository(dir).some(x => x.includes('POSSIBLE_CREDENTIAL')));
    rmSync(join(dir, 'src/leak.mjs'));
    writeFileSync(join(dir, 'src/unchecked.ts'), 'export const a: string = "ok";\n');
    assert(auditRepository(dir).some(x => x.includes('TYPESCRIPT_NEEDS_REAL_TYPECHECK')));
    rmSync(join(dir, 'src/unchecked.ts'));
    writeFileSync(join(dir, 'package-lock.json'), '{}');
    assert(auditRepository(dir).some(x => x.includes('LOCKFILE_WITHOUT_REVIEWED_DEPENDENCY')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
