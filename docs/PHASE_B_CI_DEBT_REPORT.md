# Phase B — CI Debt Characterization Report

**Author:** R-Infra prep (parallel doc, plan Action 4)
**Date:** 2026-05-28
**Status:** 📊 RESEARCH — inventories pre-existing CI debt; scopes a future R-CI-Cleanup sub-R
**Why this exists:** While verifying the security.yml fix (Task 1 of the R-Infra prep), I discovered the **CI (build+test) workflow has been red on every commit back to R0.5 (`3229758`, 2026-05-26) and earlier — long before R3.a/R3.b/R4.** This is **pre-existing tech debt**, NOT a regression from recent sub-Rs (all my R3.b/R4 files are clean — none contribute to the 198 errors). The R-Infra deploy gate is therefore being scoped to **lean deployability** (vite build + prisma migrate + api tsc build) rather than full CI; this doc characterizes the debt so a dedicated R-CI-Cleanup sub-R can be planned independently.

---

## 1. Inventory

### 1.1 Web typecheck (`apps/web` — `npm run typecheck`, what CI runs)

**198 errors** total. Concentrated in ~10 production files (~150 of the 198).

| Rank | File | Errors | Likely root |
|---:|---|---:|---|
| 1 | `src/pages/Catalog.tsx` | 26 | `useState({})` inference trap → TS2339 `Property 'id'/'level'/'description' does not exist on type '{}'` (×7+×3+×2). Phase-14.5 lesson #5 in MEMORY. |
| 2 | `src/pages/CourseLive.tsx` | 25 | `Property 'payload'` (×5) + same `useState({})` family + `'err' is unknown` catch narrowing (×3) + implicit-any params |
| 3 | `src/pages/Settings.tsx` | 16 | Toast contract drift (TS2322 `{title, kind}` missing `msg`) ×3 + `confirmAction` opts (TS2353 `danger`) + binding-element TS7031 ×6 |
| 4 | `src/pages/AssessmentLive.tsx` | 16 | `useState({}).selectedIndex` ×3 + `err: unknown` ×3 + binding-element. Note: file HAS `@ts-nocheck` but not at line 1 (or it would block these) |
| 5 | `src/pages/Admissions.tsx` | 16 | Binding-element TS7031 (`go`, `onNext` destructured without types) ×11 — clean codemod target |
| 6 | `src/pages/classroom/Stage.tsx` | 14 | Toast contract drift (TS2322 `... ; string; }'`) ×14 — entire file is one pattern |
| 7 | `src/pages/University.tsx` | 13 | Mixed: binding-element ×6 + TS7053 index-sig ×3 + TS7006 param-any |
| 8 | `src/pages/classroom/AIPanel.tsx` | 12 | Toast contract drift ×12 — same single-pattern shape as Stage.tsx |
| 9 | `src/pages/Productivity.tsx` | 11 | Toast contract (×3) + binding-element (×3) + arg-type mismatches |
| 10 | `src/pages/Dashboard.tsx` | 7 | Binding-element ×7 |
| 11 | `src/pages/Course.tsx` | 6 | Binding-element ×4 + variants |
| 12 | `src/pages/Analytics.tsx` | 5 | mixed |
| 13 | `src/pages/Academic.tsx` | 5 | TS2322 Icon prop shape + Key-or-undefined |
| 14 | `src/pages/Progress.tsx` | 4 | `Object is possibly null` ×2 + variants |
| 15 | `src/pages/Instructor.tsx` | 4 | Binding-element ×4 |
| 16–22 | (tail: Tutor, Roles, Community, More, Assessment, Authoring, classroom/CourseHeader, icons) | 2–3 each | scattered |
| Tests | `tests/visual/phase-a-landing-v2.spec.ts` | 1 | TS2345 — Playwright `URL` predicate returning `RegExpMatchArray\|null` not `boolean` |

### 1.2 Web typecheck — by TS error code

| TS code | Count | Meaning | Fix shape |
|---|---:|---|---|
| TS7031 | 46 | Binding element implicitly any (destructured params) | **Mechanical** — add types. Codemod-friendly. |
| TS2322 | 41 | Type not assignable | **Manual per case.** Bulk of these are the toast-contract drift (~26 in Stage+AIPanel — single pattern repeated, can be one-shot). |
| TS2339 | 32 | Property does not exist on type | **Mostly `useState({})`** inference trap — typing the initial state fixes the cluster. |
| TS7006 | 31 | Parameter implicitly any | **Mechanical** — add types or destructure with types. |
| TS2345 | 12 | Argument type mismatch | Manual review per case. |
| TS18046 | 10 | 'unknown' type | `catch (err: unknown)` narrowing — `(err as Error).message` or `err instanceof Error`. **Mechanical** (codemod). |
| TS7053 | 8 | Element implicitly any from indexed access | Either `[k: string]: T` index sig or refactor map literal. Per-case. |
| TS2741 | 4 | Missing required property | Interface evolution — add the prop or update consumer. |
| TS2353 | 3 | Unknown literal property | Caller passing prop not on type (e.g., `confirmAction({kind:"danger"})` where `ConfirmActionOptions` has no `kind`). |
| Others (TS2304/TS2362/TS2538/TS2571/TS2739/TS18047/TS1117) | 11 | Various — TS1117 = duplicate property, TS2304 = cannot find name | Per-case |

### 1.3 `@ts-nocheck` legacy

**13 files** still carry `@ts-nocheck` (suppressed, contribute 0 to the 198 count):
`App.tsx`, `auth/AuthContext.tsx`, `auth/ErrorBoundary.tsx`, `main.tsx`, `pages/AssessmentLive.tsx` (∗), `pages/Auth.tsx`, `pages/Classroom.tsx`, `pages/Home.tsx`, `role.tsx`, `router.tsx`, + 3 others.

(∗) `AssessmentLive.tsx` appears in BOTH the @ts-nocheck list AND the error list (16 errors). The directive likely isn't at line 1 (or another `// @ts-check`-style override). Worth a quick audit during cleanup.

### 1.4 API jest (separate failure)

Also failing in CI — has been failing on `8e7d782` (R3.a memo, pre-dating any of my api specs). **Not investigated in this doc** (reproducing needs a local Postgres + Prisma client). Likely candidates per recent additions:
- Pre-existing flake in the audit/rbac/ability/tutor specs
- Or a fixture/seed issue when run against the ephemeral CI pg
- A diagnostic pass would `npm test` locally against a docker-compose'd postgres + capture which describe blocks fail.

Recommendation: include the jest failure investigation in the R-CI-Cleanup sub-R OR split into a separate R-CI-Cleanup-Api one if scope balloons.

---

## 2. Root-cause categorization

| Bucket | Errors | Pattern | Effort |
|---|---:|---|---|
| **A. `useState({})` inference trap** (Phase-14.5 documented lesson) | ~30 | `const [x,setX]=useState({})` → `x` typed as `{}` → no properties accessible. Spread across Catalog, CourseLive, AssessmentLive. | Mechanical per file (3-5 hours total): define an interface, parameterize `useState<T>(...)`. |
| **B. Toast-contract drift** | ~30 | `window.toast({title, kind})` — `ToastMessage` requires `msg`; `kind`-only call sites missed when the contract changed. Concentrated in `Stage.tsx` (14) + `AIPanel.tsx` (12) + scattered. | Mechanical (~2 hours total). Single find-replace plus per-site message text. I hit + fixed the same pattern in R3.a Commit H and R3.b Commit H — known issue. |
| **C. Implicit-any params/binding** (TS7006 + TS7031) | ~77 | `.map((x)=>...)` / `({foo,bar})=>...` without types. The Phase-14.5 typing-sweep aftermath — files lifted `@ts-nocheck` but didn't add per-param types. | Mechanical, codemod-friendly. ~5-8 hours OR a one-shot ts-morph script (~half day). |
| **D. `err: unknown` catch narrowing** | 10 | Strict TS4.4+ — catch clauses default to `unknown`. Fix: `if (err instanceof Error)` or `(err as Error).message` (well-known). MEMORY: "feedback_phase14_5_lessons" already names this. | Mechanical (~1 hour). |
| **E. Interface evolution (TS2339 non-`{}` + TS2741 + TS2353)** | ~15 | Properties referenced that no longer exist on the type, OR required props missing. Includes `confirmAction({kind:"danger"})` (type has no `kind`), `Icon style` prop shape, etc. | Manual review per case (~3-4 hours). Some may indicate dead code paths. |
| **F. Index-signature gaps (TS7053)** | 8 | Indexing a map literal by string when the type doesn't declare `[k:string]: T`. In `University.tsx` (Anat/EE/etc. map). | Per-case (1 hour) — add index sig OR refactor to `Record<…>`. |
| **G. Misc (TS2345 + TS2304 + TS1117 + TS18047 + TS2362 + TS2538 + TS2571 + TS2739)** | ~28 | Argument-type mismatches, cannot-find-name, duplicate props. Mixed. | Per-case (~4-6 hours total). |

**Aggregate effort estimate: 20-30 hours of focused work**, OR ~half that if a ts-morph codemod is invested in for buckets A/C/D (which together = ~117 of 198 errors = 59%).

---

## 3. Recommended sub-R scope

### Option 1 — Single R-CI-Cleanup (recommended for first pass)

One sub-R, atomic commits per file (~15-20 commits), 3-5 days. Order:
1. **Codemod commits first** (buckets D + C + a slice of A) — the pure-mechanical ones land low-risk; expected to clear ~80-100 errors in 1-2 commits.
2. **Single-pattern bulk fixes** (bucket B — toast contract in Stage+AIPanel) — 1 commit, ~26 errors gone.
3. **Per-file remaining** (buckets A residue + E + F + G) — one commit per file.
4. **API jest investigation** as the final commit set (could split if the failure is structural).
5. CI gate flip: once green, the deploy gate (R-Infra) can optionally tighten from lean-deployability to full-CI in a follow-on R-Infra-v2.

### Option 2 — Two sub-Rs (split if API jest is structural)

- **R-CI-Cleanup-Web**: the 198 typecheck errors only.
- **R-CI-Cleanup-Api**: jest failure investigation + fix.

Pick Option 2 only if a quick diagnostic shows the api jest is a structural issue requiring its own scope (e.g., test-DB setup changes, migration ordering, RBAC seed mismatch).

### What is OUT of scope for R-CI-Cleanup
- ❌ Removing the remaining 13 `@ts-nocheck` files (those are deliberate suppression, not debt — separate R if desired).
- ❌ Strictening `tsconfig.json` flags (e.g., `strict: true` if not already, `noImplicitAny`) — would surface MORE errors. Future polish R.
- ❌ Migrating any architectural patterns (toast/confirmAction shapes are kept as-is — fix call sites only).

---

## 4. Process notes for R-CI-Cleanup

- **D70 explicit-delete clause is N/A** — no destructive admin surfaces are touched. (R-CI-Cleanup is pure typecheck/jest, no API/UI changes beyond per-call-site type fixes.)
- **Per-file commits + a re-run of `npm run typecheck` after each** so the running count goes down monotonically; CI re-runs on each commit confirm a clean trajectory.
- **No deploy needed** until the final commit (typecheck/jest don't affect runtime). The lean deploy gate that R-Infra ships handles deployability independent of this cleanup.
- **Acceptance:** `npm run typecheck` + `npm test` (web vitest) + api `npm test` (jest) all exit 0 in CI on main → CI workflow flips to ✅ → R-Infra can optionally tighten its gate.

---

## 5. Status

| Item | State |
|---|---|
| Web typecheck inventory | ✅ 198 errors, top 10 files, by-code breakdown captured |
| API jest inventory | ⏳ deferred — needs local pg reproduction (handled inside R-CI-Cleanup) |
| Effort estimate | ✅ 20-30 hours (lower with codemod) |
| Sub-R scope recommendation | ✅ Option 1 (single sub-R) for the first pass |
| Owner direction needed | ⏳ R-CI-Cleanup is a **separate sub-R**, not part of R-Infra. Trigger after R-Infra ships + R4 closes. |

— CI debt characterization, 2026-05-28. Independent of R-Infra impl. Future R-CI-Cleanup will use this doc as its scope-discovery baseline.
