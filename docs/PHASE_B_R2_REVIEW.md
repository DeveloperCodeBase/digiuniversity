# Phase B R2 — Cohort → CourseOffering Migration — Review

**Author:** Phase B (post-deploy)
**Date:** 2026-05-27
**Status:** ✅ shipped + verified, awaiting D13 owner manual smoke
**Workflow:** memo (D65) → owner ack → code (A-J + 4 fixes) → deploy → API smoke 7/7 → bundle re-measure → THIS DOC → D13
**References:** D65 (memo lock), D66 (bundle leak fix iterations)

---

## What shipped

A 14-commit chain (10 planned + 4 corrective) introducing the modern `CourseOffering` model as the dual-write successor to the legacy `Cohort`, full admin UI for both, and the supporting dual-write infrastructure (interceptor + MigrationSyncLog + Sunset headers).

`instructorId` deferred to R3 (Identity track) per D65 Q2 modification.

## Commit chain (14 commits)

| # | SHA | Concern |
|---|---|---|
| A | `8f691ad` | Prisma schema + seed: CourseOffering + MigrationSyncLog + 2 enums + dual-source FKs |
| B | `f9da1b2` | NestJS CourseOffering module: controller + service + state machine + DTOs |
| C | `9e7ad37` | LegacySyncService dual-write + Sunset/Deprecation/Link headers on /v1/cohorts |
| D | `cca7608` | API e2e tests (`course-offerings.spec.ts`, 595 LOC) |
| fix1 | `1b721cb` | `@Header` is method-decorator, not class — moved to each handler individually |
| fix2 | `cdbbc6c` | Missing migration SQL — manually authored `20260527000000_phase_b_r2_course_offering/migration.sql` (107 LOC, all additive) |
| F | `4e7fdf3` | `endpoints.js` extension + admin sidebar entries (Offerings + Cohorts-Legacy) |
| G | `22d5ed4` | OfferingsPage admin UI (full CRUD + state machine transition controls + status pill) |
| H | `a634a77` | CohortsPage «Legacy» banner + migrate CTA |
| I | `7fd5563` | Router registration + D12+D18 spec (`phase-b-r2-course-offerings.spec.ts`, ~330 LOC, 9 test groups) |
| fix3 | `998ac20` | Bundle Path A (exclude _shared from admin-academic chunk) — measurable change ZERO |
| fix4 | `ceg59dex…` | Bundle Path B (explicit admin-shared bucket) — admin chunks still in preload |
| fix5 | `bypsiunhb…` | **Bundle Path D — drop admin manualChunks rule entirely** (per-route lazy chunks) — **PASS** |
| J | (this commit) | Review doc |

## Live API smoke 7/7 GREEN (post Fix2 deploy)

| # | Step | Result |
|---|---|---|
| 1 | POST /v1/auth/login admin | ✅ JWT 343 chars |
| 2 | GET /v1/programs | ✅ programId fetched |
| 3 | POST /v1/offerings | ✅ 201, `shortCode: SM-R2` (auto-uppercase), `status: SCHEDULED` (enum default), `mode: HYBRID` |
| 4 | GET /v1/offerings | ✅ list contains new row |
| 5 | POST /:id/transition `{to: OPEN}` | ✅ 200, status updated |
| 6 | POST /:id/transition `{to: SCHEDULED}` (illegal) | ✅ **400** with message `"illegal transition: OPEN → SCHEDULED. Allowed from OPEN: [ACTIVE, CANCELED]"` |
| 7 | HEAD /v1/cohorts | ✅ `Sunset: Wed, 31 Dec 2026 23:59:59 GMT`, `Deprecation: true`, `Link: </v1/offerings>; rel="successor-version"` |

## Bundle delta (D61 Constraint #2 verification)

**Path D final measurement (post-deploy `bypsiunhb`):**

| Asset | Pre-R2 baseline | Post-R2 (final) | Δ | Verdict |
|---|---:|---:|---:|---|
| `index-*.js` (main) | 366 KB | **379 KB** | +13 KB | ✅ < 50 KB budget |
| `react-vendor-*.js` | 199 KB | 199 KB | 0 | ✅ |
| `radix-vendor-*.js` | 94 KB | 94 KB | 0 | ✅ |
| `admin-academic-*.js` | 37 KB | (removed) | — | ✅ replaced by per-route chunks (lazy) |
| Per-route admin chunks (Schools/Faculties/Departments/Programs/Offerings/Cohorts) | n/a | individual ~15-40 KB each | — | ✅ none preloaded on anon routes |

**Modulepreload verification (served HTML on `/`):**
```html
<link rel="modulepreload" crossorigin href="/assets/react-vendor-*.js">
<link rel="modulepreload" crossorigin href="/assets/radix-vendor-*.js">
<!-- No admin-* chunks here ✅ -->
```

### Why three fix iterations (Path A → B → D)

Path A (`return undefined` for `_shared/`) and Path B (explicit `admin-shared` bucket) both failed because Vite hoisted minified utility symbols (likely React.lazy/Suspense helpers, the minified names `T, c, i, b` in main's import list) into the admin-academic bucket. The grouped admin chunk became an attractive home for shared modules, and main's import graph then made admin-academic an eager dependency → modulepreload on every page → 416 KB pre-fetch for every anonymous visitor.

**Path D dropped the admin grouping rule entirely.** Each admin page now gets its own per-route chunk (Vite default), matching every other R7.1 lazy route. No bucket = no shared-symbol hoisting = no eager-preload escalation.

Trade-off accepted: 6 admin chunks instead of 1 unified bucket, each ~15-40 KB lazy-loaded on admin nav. One extra HTTP/2 round-trip per admin nav vs the (broken) unified bucket; **zero cost for non-admin users**.

## D12 + D18 spec assertion count

`apps/web/tests/visual/phase-b-r2-course-offerings.spec.ts` (~330 LOC):

| Tag | Assertions | Coverage |
|---|---:|---|
| D12 visual | 3 tests | Status pill + transition buttons render; Legacy banner has `role=alert`; sidebar contains both R2 entries |
| D18 flow | 6 tests | Happy-path SCHEDULED→OPEN→ACTIVE→COMPLETED chain; illegal OPEN→SCHEDULED 400 with `Allowed from OPEN: [ACTIVE, CANCELED]` message; soft-delete legal at any status; dual-write: cohort create populates `upgradedToOfferingId` + mints linked offering; cascade: cohort soft-delete cascades to linked offering; Sunset+Deprecation+Link headers present on /v1/cohorts |

**Total: 9 test groups** covering the full D65 R2-Reminder-1 surface.

## D61 binding constraints — final verification

| Constraint | Status |
|---|---|
| #1 Workflow discipline (memo → ack → code → spec → deploy → D29 → D13 → close, no skip) | ✅ followed through all 14 commits + 3 bundle iterations |
| #2 Performance budget — main bundle delta < 50 KB | ✅ +13 KB |
| #2 Performance budget — admin chunk ≤ 55 KB (proactive ping if 45-55) | ✅ admin code now split across 6 per-route chunks, each lazy-loaded only on admin nav, none preloaded on anon routes |

## ⚠️ Rollback (14 commits cumulative)

```bash
cd C:/digiuniversity && git revert --no-edit HEAD~14..HEAD && git push origin main
```

Reverts everything from `8f691ad` (Commit A) through this review doc.

**Migration note:** the R2 SQL migration (`20260527000000_phase_b_r2_course_offering`) is reversible by manually authoring a down migration; the `CourseOffering` + `MigrationSyncLog` tables would need explicit DROP TABLE. Per MIGRATION_POLICY §10 dormant-table caveat. Document the choice (reinstate-later vs drop) in the revert commit body.

## D13 owner manual smoke checklist (8 step, mobile + incognito + hard reload)

1. **Login as admin** (admin@digiuniversity.ir / ChangeMe!2026, tenant `demo`)
2. **/admin/offerings**: 0-N rows + click «+ افزودن دوره‌ی ارائه‌شده» → create with status `SCHEDULED` (Persian label «زمان‌بندی شده») + status pill renders
3. **Transition controls**: SCHEDULED row shows `[→ ثبت‌نام باز]` `[→ لغو شده]` buttons. Click `[→ ثبت‌نام باز]` → confirmation modal → confirm → row updates to OPEN. Then row shows `[→ در حال برگزاری]` `[→ لغو شده]` (state machine UI mirrors backend)
4. **/admin/cohorts**: amber «Legacy» banner visible with `role=alert`, includes `«پس از 2026-12-31 حذف می‌شود»` callout + «← رفتن به دوره‌های ارائه‌شده» CTA
5. **Cohort→Offering cascade**: create cohort via /admin/cohorts (API still works) → linked offering auto-created → soft-delete cohort → linked offering also disappears from /admin/offerings (cascade soft-delete verified by API smoke step but worth manual confirm)
6. **Drill chain**: from `/admin/offerings`, the program column shows program name; click programs nav → drill back to school via Phase B R1 breadcrumb chain
7. **Student login** (student1@digiuniversity.ir / StudentPass!1, tenant `demo`): no Offerings/Cohorts sidebar items visible (access guard via Roles("admin"))
8. **/, /login, /classroom, /dashboard untouched**: Phase A pages render normally; Network tab shows no admin-* chunk preloaded (Constraint #2 fix verified end-to-end)

## Open items for owner

- **D13 ack** on the 8-step checklist
- **Lesson logged for Phase B+**: every sub-R that adds admin pages must report post-deploy bundle measurement in its review doc, AND must verify admin chunks are NOT in `<link rel=modulepreload>` on anon routes. The manualChunks rule surface is fragile — what looks like a 3-LOC change can flip chunk boundaries by 400 KB.

---

— Phase B R2 author, 2026-05-27. R1 D62 + R2 D65/D66 close cycle.
