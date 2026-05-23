# Phase A R4 — Review (Audit-on-mutation lint rule)

> Custom Node-based lint that walks every `apps/api/src/**/*.controller.ts` and fails CI if any `@Post` / `@Put` / `@Patch` / `@Delete` handler lacks an audit decision (`@AuditAction` / `@AuditSkip` / `this.audit.log(...)` body call). Zero new npm deps; reuses the api workspace's pinned `typescript@5.6.3` for AST parsing. Wires into `npm test` (pretest) and `scripts/remote.ps1 test` (pre-step) so every CI path catches violations before jest even starts.

## What shipped

| Commit | Files | Notes |
|---|---|---|
| `39bc2cd` | memo | Plan locked before code |
| pending | 6 files | rule + spec + backfill + plumb |

### New files

- **`tools/eslint-rules/audit-on-mutation.js`** (~245 lines incl. doc-comment) — standalone Node script using `ts.createSourceFile` to walk the TS AST. Resolves `typescript` from `apps/api/node_modules` so it works from the repo root without hoisting. CLI exit codes: 0 = pass, 1 = violations, 2 = internal error. Exports `scanFile`, `listControllerFiles`, etc. for testability.
- **`tools/eslint-rules/audit-on-mutation.spec.js`** (~190 lines) — 9 test cases using Node's built-in `node:test` runner. Covers all 3 positive paths (AuditAction / AuditSkip / body-call), both negative paths (bare mutation, every verb), and three edges (Get never flagged, foreign logger doesn't count, nested arrow with audit.log counts).
- **`docs/PHASE_A_R4_BACKFILL.md`** — log of the 3 handlers in `auth.controller.ts` that received `@AuditSkip()` during R4. Rationale + rollback notes so future contributors don't strip the decoration without thinking.
- **`docs/PHASE_A_R4_MEMO.md`** — pre-code plan (already committed).
- **`docs/PHASE_A_R4_REVIEW.md`** — this file.

### Modified files

- **`apps/api/src/auth/auth.controller.ts`** — backfill: imported `AuditSkip`, added `@AuditSkip()` + a justifying 3-4-line comment to each of `register` / `login` / `refresh`. No runtime change (the global `AuditInterceptor` was already short-circuiting these because `req.user` is undefined for `@Public()` routes); R4 records the intent explicitly so the lint rule passes and future readers don't have to reverse-engineer the interceptor's user-presence check.
- **`apps/api/package.json`** — added 3 npm scripts:
  - `"lint:audit": "node ../../tools/eslint-rules/audit-on-mutation.js"`
  - `"lint:audit:test": "node --test ../../tools/eslint-rules/audit-on-mutation.spec.js"`
  - `"pretest": "npm run lint:audit"` — so `npm test` (which runs inside the `api-test` Docker profile) auto-runs lint before jest.
- **`scripts/remote.ps1`** — added `lint` to the action `ValidateSet`, a new `lint` action that runs both the rule + its self-tests, and a pre-step in the existing `test` action that runs the lint locally on Windows before the remote `docker compose run` so a violation fails fast without burning a build.

## Why a standalone Node script and not a true ESLint plugin

The api workspace doesn't have ESLint installed. Adding it for one custom rule means a ~50MB dep tree. Phase A "Foundation Repair" is explicitly about removing technical debt, not adding new tool chains.

The standalone script:

| Property | Standalone Node + TS AST | True ESLint plugin |
|---|---|---|
| New npm deps | **0** | ~30 packages (eslint, @typescript-eslint/parser, @typescript-eslint/utils, plus transitive) |
| Disk footprint | 0 KB (reuses existing typescript) | ~50 MB |
| CI runtime | ~250ms (20 files) | ~3s (ESLint cold start + parser init) |
| Enforcement strength | identical — exit non-zero with file:line:col | identical |
| Editor integration | none built-in (run via npm script) | inline squiggles via ESLint VSCode plugin |
| Migration cost to a real ESLint plugin later | ~30 min — port `scanFile()` to `context.report()` | n/a |

The plan's file path (`tools/eslint-rules/audit-on-mutation.js`) is preserved so a Phase B+ migration to a real plugin is a renaming change, not a rewrite.

## Survey + backfill numbers

| Metric | Before R4 | After R4 |
|---|---|---|
| Controller files with mutation handlers | 17 | 17 |
| Total `@Post`/`@Put`/`@Patch`/`@Delete` handlers | 49 | 49 |
| Handlers with `@AuditAction(...)` | 44 | 44 |
| Handlers with `@AuditSkip()` | 2 | **5** (+3 backfill) |
| **Unaudited handlers (gap)** | **3** | **0** |

The 3 backfill cases are all `@Public()` routes (no `req.user` → interceptor was already skipping them). R4 makes the intent explicit in source.

## Self-test results

`node --test tools/eslint-rules/audit-on-mutation.spec.js`:

```
✔ positive: mutation handler with @AuditAction passes
✔ positive: mutation handler with @AuditSkip passes
✔ positive: mutation handler with this.audit.log() body call passes
✔ positive: mutation handler with this.auditService.write() body call passes
✔ negative: mutation handler with no audit hook is flagged
✔ negative: every mutation verb is flagged when undecorated
✔ edge: @Get is never flagged (read-only)
✔ edge: random this.foo.log() does NOT count as audit
✔ edge: nested function expression with audit.log() still counts

tests 9 | pass 9 | fail 0 | duration_ms ~330
```

## CI integration

Three entry points all trigger the rule:

1. **Direct**: `node tools/eslint-rules/audit-on-mutation.js` — fastest, repo-root invocation, no npm.
2. **Workspace**: `cd apps/api && npm run lint:audit` — same script, npm-scripts-aware.
3. **Test pipeline**: `cd apps/api && npm test` — `pretest` hook runs lint before jest.
4. **Remote ops**: `.\scripts\remote.ps1 lint` — rule + self-tests. `.\scripts\remote.ps1 test` runs lint locally before the remote docker build.

Lint failure exit code propagates through all four paths.

## What R4 deliberately did NOT do

- **Rewrite existing `@AuditAction` names to a canonical taxonomy.** Current names are already verb-noun (`course.create`, `enrollment.status.change`). A future R can normalize if Phase B reveals naming gaps.
- **Add a pre-commit hook (husky/lint-staged).** Phase A doesn't add new tool chains. The remote.ps1 pipeline + the in-IDE feedback loop (run the rule manually after a controller edit) is enough.
- **Extend the rule to the web side.** Audit is api-only.
- **Catch missing rate-limits or missing JWT guards.** Out of R4 scope — separate rules in a future R.
- **Lint the `audit.controller.ts` itself.** It only has `@Get` handlers (read-only AuditLog viewer), which the rule correctly ignores.

## Metrics

| Metric | Before R4 | After R4 | Δ |
|---|---|---|---|
| Mutation handlers with explicit audit decision | 46 / 49 (94%) | **49 / 49 (100%)** | +3 |
| New npm deps | 0 | 0 | 0 |
| New disk footprint | 0 MB | 0 MB | 0 MB |
| Lint runtime (local Windows, 20 files) | n/a | ~250 ms | new |
| Self-test runtime | n/a | ~330 ms (9 tests) | new |
| Active `@ts-nocheck` | 2 | 2 | 0 |

## Owner manual smoke — 3-step checklist

Per D13, the manual gate after every sub-R. Don't skip:

1. **Plant a violation**: edit any controller to add `@Post("test") test() { return {} }` without a decorator. Run `.\scripts\remote.ps1 lint`. Confirm exit 1 with the file:line:col + "method=test  decorators=@Post" output. Revert.
2. **Confirm clean tree passes**: `.\scripts\remote.ps1 lint` returns "PASS (20 controller files scanned, 0 violations)" + all 9 self-tests green.
3. **Confirm test pipeline gates on lint**: temporarily plant a violation as in step 1, run `.\scripts\remote.ps1 test`. Confirm the action exits BEFORE pushing to the VPS or starting docker. Revert.

If any step looks off, screenshot + tell me which.

## Awaiting

Owner manual smoke per D13. If all 3 steps look right, R4 is shipped. Next:

**Gate A dossier** aggregates everything from R1-R5:
- Lighthouse mobile ≥ 90 on 3 sampled pages (/, /login, role-typical dashboard)
- axe-core: 0 critical/serious on all 49 routes
- TypeScript: 2 `@ts-nocheck` (both in `docs/PHASE_A_DEFERRED_TYPES.md`, both under the 5-cap)
- Playwright: 13 + 7 + 12 + 12 = 44/44 across R1.1/R1.4/R5/R3
- 10 role dashboards visually distinct (R3 ship + 4 pre-existing surfaces)
- Audit-on-mutation lint enforced in CI (R4, this sub-R)
- Owner manual smoke ack on every sub-R (R1.1, R1.4, R2, R3, R5, R4)
