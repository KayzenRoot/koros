# KOR-PM07-WO-001 | Evidence Bundle: CI gratuito de qualidade
**2026-10-30 · Issue [#61](https://github.com/KayzenRoot/koros/issues/61) · Escopo: CI de aplicação e verificações negativas com fixtures sintéticas.**
**Status do documento nesta branch:** `PROPOSED / CI_RESULT_PENDING` até read-back pós-commit. **NÃO** marcar sucesso de teste ou CodeQL por simples criação de arquivo.

## Context Lock
- `main` inicial: `3216dd88cd9cce764857962383e37f4422f016d0`, após squash normal das PRs #69 e #70, com WO #45 CLOSED/COMPLETED.
- PR #36 Draft: `d9f88b6a6087e395784b618d0b9e2967d228bcef`; PR #68 Draft: `b66181e9f2adf206aae2654e7c7056053eacca99`. **NÃO** tratar documentação da PR #68 como incorporada à main.
- Git blob fingerprints canônicos na main:
  - checkpoint `docs/14-checkpoint.md`: `7084c92ab99864199931ffc6b109f788aff5ac5d`
  - decisions `docs/13-decisions-ledger.md`: `5083a00f98092b52936d33eec295501906139ac4`
  - Scope `docs/02-scope.md`: `61387c18ce36f728d6b892bb6d91087e2c46e7bd`
  - Architecture `docs/03-architecture.md`: `ded63e104c2b16f0c44272251157eadeca08fb29`
  - DoD `docs/12-definition-of-done.md`: `ae20959a02e5b32651bc611d0907d7ae49967a9b`
  - Security `docs/04-security.md`: `abc01282a6f16025d0e3374761e8106f8d4684ff`
  - Test Plan `docs/08-test-benchmark-plan.md`: `40809e82910a5eb846c8b351d9212faf323571d1`
  - baseline CI `.github/workflows/koros-baseline.yml`: `a2a6cd36747e6e37a5d5389ccc837cf0a0b7033f`
  - package `package.json`: `2f1cd31c8404a416ae3c8c6ac06ec8d96b88b36e`
- Any change to the sources before work-order approval requires new Context Lock.

## Scope / Architecture
- **NECESSARY:** retain existing `m02-baseline` job name; execute after PR code changes **and push to main** on scoped paths, preserve `governance-docs` producer and ruleset untouched.
- Add `ci:integrity` with deny-by-default manifest (no dependencies added without future review), GitHub Actions SHA pin audit, heuristic source credential detection, TS-without-typecheck detector; real negative tests with `node:test` for malicious fixtures.
- CodeQL JavaScript/TypeScript source scan only in GitHub Actions with least-privilege `security-events: write`, no extra credentials; `github/codeql-action` tag v4.31.6 **dereferenced to commit** `fe4161a26a8629af62121b670040955b330f9af2` via GitHub tags API. Existing checkout `3d3c42e5aac5ba805825da76410c181273ba90b1` and setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1` unchanged.
- **No npm install, no lockfile, no external package added, no shell/Docker privilege escalation, no account/gasto, no data or CRM real.** CodeQL action is the only new CI upstream action, SHA pinned.
- Strict limitation: plain JS ESM, so `tsc TYPECHECK=NOT_APPLICABLE` until TS introduced and supported; `lint` = syntax-only, not ESLint; `build` = syntax-only, not deploy artifact. Auth, DB, CRM, LLM, RLS, T-01..T-12, CRM-R01..R12 remain NOT_RUN/NOT_IMPLEMENTED.

## Tests & negative obligations
| Test obligation | Expected proof | Status initially |
|---|---|---|
| Manifest reject runtime/dev/peer/optional dependencies | `test/ci-integrity.test.mjs` and live `npm run ci:integrity` | PENDING CI |
| Unpinned Github Actions | negative fixture rejects tag rather than SHA | PENDING CI |
| Secret-like text | negative fixture flags synthetic token | PENDING CI |
| TypeScript without real typecheck | negative fixture flagged | PENDING CI |
| Lockfile added without review | negative fixture flagged | PENDING CI |
| Main/PR baseline 10 existing unit tests + 4 new tests | `npm test`, show counts | PENDING CI |
| 10 JS modules syntax, build syntax, HTTP smoke | `npm run lint/build/smoke` | PENDING CI |
| CodeQL JavaScript scan | `codeql-js` actual check run tied to exact head | PENDING CI |
| Required `governance-docs` unchanged | check producer App 15368 and CI run | PENDING CI |
| Socket Security | checks informational (NOT comprehensive SCA) | PENDING CI |
| Actual TypeScript tsc check, production compile, DB/CRM E2E, pnpm/npm audit | `NOT_APPLICABLE` / `NOT_RUN`; no misleading PASS | NOT_APPLICABLE / NOT_RUN |

## Riscos / STOP
- CodeQL failure, missing permission or disabled code scanning is `BLOCKED/CORRECTION_REQUIRED`, not equivalent to passing scan; do not disable it merely to make CI green.
- The manifest guard is **scope-specific**. When a later WO needs dependencies/TypeScript, update policy and genuine typecheck with tests and license/SCA in that new WO, rather than bypassing this control.
- Heuristic secret scan is NOT complete secret scanning, SCA or supply-chain security; CodeQL finding requires manual severity review, and HIGH/CRITICAL cannot be waived.
- Existing `governance-docs` required check and main ruleset #26074776 must not be modified.
- All technical tests in this WO are synthetic/local CI; no deployment, INPI, company registration, contact, account, spending, PR Ready, merge or next Work Order authorized here.

## Checkpoint Delta PROPOSTO
`KOR-PM07-WO-001: add free CI integrity/negative tests, CodeQL SAST JS, push-main regression test; preserve required governance-docs and Socket informative. After actual CI audit, record exact HEAD/check results and remaining limitations. No release or other WO.`
