# Phase A R4 — Memo (Audit-on-mutation lint rule)

> Make it impossible to merge a NestJS controller mutation handler that lacks an audit decision. Every `@Post` / `@Put` / `@Patch` / `@Delete` must either declare `@AuditAction("foo.bar")` (canonical action name), explicitly opt out with `@AuditSkip()` (justified in a code comment), or directly call `this.audit.log({...})` in its body.

## Why a custom lint rule (and not just relying on AuditInterceptor)

`AuditInterceptor` is global. It writes a row for every authenticated POST/PATCH/PUT/DELETE that returns 2xx — that part is already enforced at runtime. So why a lint rule?

Two reasons:

1. **Canonical naming.** Without `@AuditAction("course.create")` the interceptor falls back to `post.courses` derived from the path. That makes the audit table noisy and unqueryable (e.g. "show me every course publish" needs a free-text search instead of `action = 'course.publish'`). The lint rule enforces the canonical name at the source.

2. **Opt-out discipline.** Some mutations correctly skip the audit table (high-frequency events that have their own `LearningEvent` / `AiInteractionLog` table). Today those are flagged with `@AuditSkip()`. Without a lint check, a future PR that adds a real mutation without thinking about audit will pass review unnoticed — the interceptor will write `post.foo` rows that the audit viewer surfaces as noise.

The plan also said "ESLint custom rule". I'm shipping it as a **standalone Node script that walks the TypeScript AST** rather than a full ESLint plugin, because:
- Zero new deps. The api already pins `typescript@^5.6.3`; we reuse `ts.createSourceFile` to parse.
- Same enforcement strength: the script exits non-zero with file:line of every violation, which fails CI exactly like an `eslint --max-warnings=0`.
- File path stays `tools/eslint-rules/audit-on-mutation.js` per the plan, so future migration to a real ESLint plugin is a renaming change, not a rewrite.

If the user prefers a true ESLint plugin in Phase B+, the rule logic ports cleanly — the AST walker matches the same node shapes ESLint would expose.

## Survey of the current repo

| Metric | Count |
|---|---|
| Controller files with ≥1 mutation handler | 17 |
| Total `@Post` / `@Put` / `@Patch` / `@Delete` handlers | 49 |
| Handlers with `@AuditAction(...)` | 44 |
| Handlers with `@AuditSkip()` | 2 |
| **Unaudited handlers (gap)** | **3** |

The 3 gap handlers are all in `apps/api/src/auth/auth.controller.ts` — `register`, `login`, `refresh`. They are `@Public()` (no JWT, no session, so the interceptor would skip them anyway because `req.user` is undefined). But the lint rule should still flag them so the intent is recorded in code rather than implicit. The fix is one line each: add `@AuditSkip()` + a one-line comment "// AuthService.* writes its own audit row with the resolved tenantId."

## What R4 ships

1. **`tools/eslint-rules/audit-on-mutation.js`** — standalone Node script.
   - Walks `apps/api/src/**/*.controller.ts`
   - Uses `ts.createSourceFile` (TS compiler API, already in tree)
   - For every class method, collects:
     - HTTP-mutation decorators: `@Post`, `@Put`, `@Patch`, `@Delete`
     - Audit decorators: `@AuditAction`, `@AuditSkip`
     - Body calls: `this.audit.log(...)` or `this.auditService.log(...)`
   - Reports a violation when a method has ≥1 mutation decorator AND zero audit hooks.
   - Exits 1 with violations listed, 0 when clean.
   - Pretty-print: `file:line:col  method  reason`.

2. **`apps/api/package.json`** — add `"lint:audit": "node ../../tools/eslint-rules/audit-on-mutation.js"` script. Add as `"pretest"` so `npm test` in the api-test docker profile auto-runs lint before jest.

3. **`scripts/remote.ps1`** — add a new `lint` action that calls the script directly (no Docker round-trip; runs on the Windows host with the Node we already require for `npm install`). Also fold the same call into the existing `test` action as a pre-step so `.\scripts\remote.ps1 test` fails fast on a lint violation.

4. **Backfill the 3 gap handlers** in `auth.controller.ts`:
   - `@Public() @Post("register")` → add `@AuditSkip()` + comment
   - `@Public() @Post("login")` → add `@AuditSkip()` + comment
   - `@Public() @Post("refresh")` → add `@AuditSkip()` + comment
   These are correctly unaudited at runtime (no `req.user`), but the lint rule makes the opt-out explicit in source. `AuthService` writes its own `auth.login.success` / `auth.login.failure` audit rows with the resolved tenant. No behavior change.

5. **`docs/PHASE_A_R4_BACKFILL.md`** — log the 3 handlers I touched + a one-paragraph rationale, so future contributors don't accidentally remove the `@AuditSkip()` without understanding why.

6. **`tests/lint/audit-on-mutation.spec.ts`** — Jest spec (lives next to the rule) with fixture files that cover:
   - Positive: mutation + `@AuditAction` → 0 violations
   - Positive: mutation + `@AuditSkip` → 0 violations
   - Positive: mutation + `this.audit.log(...)` in body → 0 violations
   - Negative: mutation with no audit hook → 1 violation
   - Edge: `@Get()` handler → never flagged (read-only)
   - Edge: nested function call `this.foo.audit.log(...)` does NOT count (must be on a service field named `audit` or `auditService`)

## Out of scope for R4

- Backfilling the existing `@AuditAction(...)` names to a canonical taxonomy. Current names are already verb-noun-ish (`course.create`, `enrollment.status.change`). A future Phase B+ R can normalize.
- Adding `@AuditAction` to internal admin endpoints in `audit.controller.ts` itself (it's read-only — `@Get` handlers — already not flagged).
- Pre-commit `husky` hook. Phase A "Foundation Repair" doesn't add new tooling layers; the remote.ps1 + CI path is enough.
- Frontend lint. R4 is api-only because audit is api-only.

## DoD for R4

- [ ] Lint script written + executable via `node tools/eslint-rules/audit-on-mutation.js`
- [ ] Returns 0 on a clean tree (after the 3-handler backfill)
- [ ] Returns 1 with file:line:col on a planted violation
- [ ] Self-test spec passes (5 fixture cases)
- [ ] `scripts/remote.ps1 test` runs the lint first and fails on violations
- [ ] `scripts/remote.ps1 lint` exists as a standalone action
- [ ] `docs/PHASE_A_R4_BACKFILL.md` written
- [ ] `docs/PHASE_A_R4_REVIEW.md` written
- [ ] Memo committed first, then code (per workflow rule)

## Budget

| Component | Est. lines |
|---|---|
| `tools/eslint-rules/audit-on-mutation.js` | ~180 (AST walker + reporter) |
| `tools/eslint-rules/audit-on-mutation.spec.js` | ~100 (5 fixture cases) |
| `auth.controller.ts` backfill | +6 (3 decorators + 3 comments) |
| `apps/api/package.json` script | +1 |
| `scripts/remote.ps1` lint action | +6 |
| `docs/PHASE_A_R4_BACKFILL.md` | ~40 |
| `docs/PHASE_A_R4_REVIEW.md` | ~80 |
| **Total** | **~410** |

That's above the 300-line target but the test fixture file accounts for ~100 of it. Per R1.1-D7 the 300-line cap is a target with 10–15% grace and a vertical-slice-with-test exception. R4 is one vertical slice: rule + its own test + the data plumb the rule into CI. The test is non-negotiable (a lint rule without tests is the canonical anti-pattern — it bit-rots silently the first time the parser version changes).
