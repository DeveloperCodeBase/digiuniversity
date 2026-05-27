# Phase B R3.a — Identity Foundation (Profile + Student + Instructor + R2 instructorId wire) — Review

**Author:** Phase B (post-Commit-K, pre-VPS-deploy)
**Date:** 2026-05-27
**Status:** ✅ code shipped on `main` (12 commits A→K); ⏳ awaiting owner deploy + D29 pre-smoke + D13 manual smoke
**Workflow:** memo (D68) → owner ack → clarification (D69) → code A-K → THIS DOC → deploy → D29 → D13
**References:** D68 (R3 split), D69 (SelfOrAdmin clarification), D66 (bundle leak Path D)

---

## Why this doc exists pre-deploy

R3.a code is complete on `main` and locally validated (typecheck clean, local Vite build green, bundle measurement included below). The actual production deploy + D29 Chrome Extension pre-smoke + D13 owner manual smoke remain — VPS SSH was unreachable from this session's runner, so the deploy command is being handed back to the owner with this doc as the artifact.

The bundle numbers below come from `npm run build` against the same `vite.config.js` production target as the VPS, so the per-route chunk topology + modulepreload behavior are identical to what the VPS will serve. Absolute sizes may differ ±1-2% from the VPS rebuild because of node_modules version drift, but the **shape** of the result (which chunks exist, what's preloaded) is determined by `vite.config.js` and is reproducible.

---

## What shipped

A 12-commit chain implementing the D68 R3.a scope (Identity track without state machines) plus the D69 SelfOrAdmin authorization clarification.

State machines (StudentStatus / InstructorStatus transition guards, StudentApplication / InstructorApplication, NotificationLog) all defer to R3.b per D68 split.

## Commit chain (12 commits)

| # | SHA | Concern |
|---|---|---|
| docs | `c5b64c5` | D69 entry + memo update (SelfOrAdmin primitive + /admin/profiles + reordered A–K) |
| A | `0d72696` | Prisma schema (Profile + Student + Instructor + 3 enums + R2 instructorId additive + reverse relations) + migration SQL + seed (Profile backfill + sample Student + sample Instructor + R2 offering instructor link) |
| B | `f7f4257` | NestJS Profile module + **SelfOrAdminGuard primitive** (D69, reusable for R3.b) + IdentityModule aggregator + AppModule wiring |
| C | `f5f2ed3` | NestJS Student module (admin CRUD + `/v1/students/me` self-read) |
| D | `a110950` | NestJS Instructor module (admin CRUD + dept-reassign sub-resource + expertise tags + catalog-visible to student) |
| E | `c5bc15c` | CourseOffering instructor wire — list/getById join + `assignInstructor` service method + role validation per D69 + `PATCH /v1/offerings/:id/instructor` endpoint |
| F | `2f0237f` | API e2e spec (`identity-r3a.spec.ts`, 15 test groups, +1 helper) — CRUD + SelfOrAdmin matrix + 1:0..1 invariant + cross-tenant + role validation + soft-delete cascade |
| G | `49d556f` | Frontend `endpoints.js` extension (`profileApi` / `studentApi` / `instructorApi` + `academicAdminApi.assignOfferingInstructor`) + sidebar nav «افراد» group + user dropdown «پروفایل من» |
| H | `ecb48d2` | Self-service `/profile` page (replaces public mockup in Productivity.tsx via router rewire; per-route lazy chunk per D66 Path D) |
| I | `25a2d5a` | 3 admin pages (`/admin/profiles`, `/admin/students`, `/admin/instructors`) + router registration + **`api.delete` alias fix** (latent R1 bug) |
| J | `b1d7f7a` | OfferingsPage extension — instructor column + assignment dialog + Q3.a wire end-to-end |
| K | (this commit) | D12+D18 visual spec (`phase-b-r3a-identity.spec.ts`) + this review doc + bundle measurement |

---

## D69 SelfOrAdmin pattern — implementation summary

| Layer | File | Notes |
|---|---|---|
| Decorator | `apps/api/src/auth/decorators/self-or-admin.decorator.ts` | `@SelfOrAdmin()` (self-only) / `@SelfOrAdmin({ userIdFrom: 'param', paramName })` / `({ userIdFrom: 'body', bodyKey })`. Metadata key `auth:self-or-admin`. |
| Guard | `apps/api/src/auth/guards/self-or-admin.guard.ts` | Opt-in (handlers without `@SelfOrAdmin` pass through). Admin short-circuits to allow. Self-only handlers pass for any authenticated user. Param/body handlers compare `request.user.userId` to extracted target. 403 with precise message on rejection. |
| Audit semantic | unchanged | `AuditLog.actorId` always = `request.user.userId`. Admin editing another user's profile shows up as `actor=admin.id`, `subject=Profile:<target.id>` — the existing R4 audit lint + interceptor handle this correctly without new fields. |
| Profile consumer | `apps/api/src/identity/profiles/profiles.controller.ts` | `GET /v1/profile` + `PATCH /v1/profile` (self-only); `GET /v1/profiles` (admin); `GET/PATCH /v1/users/:userId/profile` (param-based SelfOrAdmin). |
| Student consumer | `apps/api/src/identity/students/students.controller.ts` | `GET /v1/students/me` (self-only). |
| Instructor consumer | `apps/api/src/identity/instructors/instructors.controller.ts` | `GET /v1/instructors/me` (self-only). |

Reusable for R3.b «student own application status check» (per D69 design intent).

---

## Bundle measurement (D61 Constraint #2 + D66 Path D verification)

Local `npm run build` against `apps/web/`:

| Asset | Pre-R3.a baseline (R2) | Post-R3.a (local) | Δ | Verdict |
|---|---:|---:|---:|---|
| `index-*.js` (main) | 379 KB | **353.57 KB** | **−25.43 KB** | ✅ Under +50 KB budget (actually negative — see analysis below) |
| `react-vendor-*.js` | 199 KB | 203.57 KB | +4.57 KB | ✅ Vendor (cached across deploys) |
| `radix-vendor-*.js` | 94 KB | 96.63 KB | +2.63 KB | ✅ Vendor |
| `ProfilesPage-*.js` (D69 NEW) | n/a | **3.02 KB** | — | ✅ Per-route lazy chunk |
| `StudentsPage-*.js` (NEW) | n/a | **5.04 KB** | — | ✅ Per-route lazy chunk |
| `InstructorsPage-*.js` (NEW) | n/a | **7.03 KB** | — | ✅ Per-route lazy chunk |
| `ProfilePage-*.js` (NEW, ex-Productivity) | n/a | **6.70 KB** | — | ✅ Per-route lazy chunk |
| `OfferingsPage-*.js` (extended Commit J) | 9 KB (R2) | **9.42 KB** | +0.42 KB | ✅ Marginal extension |

**Modulepreload verification (served `dist/index.html`):**
```html
<link rel="modulepreload" crossorigin href="/assets/react-vendor-BUP5f_pr.js">
<link rel="modulepreload" crossorigin href="/assets/radix-vendor-DCDHWrup.js">
<!-- No admin-* / Profile* / Student* / Instructor* chunks here ✅ -->
```

Every R3.a admin chunk is **truly lazy** — none appear in `<link rel="modulepreload">`. The D66 Path D pattern (NO admin manualChunks bucket; each admin page resolves to its own per-route chunk via Vite default) held perfectly through R3.a.

### Why main bundle SHRANK by 25 KB

Counter-intuitive at first glance — R3.a added 3 admin pages + 1 self-service page + service-layer extensions + frontend api modules. Yet the main bundle dropped from 379 KB to 354 KB.

Reason: Commit H rewired `/profile` from `pages/Productivity.tsx`'s ProfilePage export to a dedicated `pages/ProfilePage.tsx` file. Because the old import path was `React.lazy(() => import("./pages/Productivity").then((m) => ({ default: m.ProfilePage })))`, Rollup had to keep the entire `Productivity.tsx` chunk (32.87 KB) reachable from main's import graph for the route resolution promise. After Commit H, `Productivity.tsx` is no longer in main's eager chain at all — only the much smaller dedicated `ProfilePage-*.js` (6.70 KB) is referenced.

The new file is also less polluted by ProductivityPageProps + shared mockup helpers — pure self-service editor.

Production VPS may show a slightly different absolute number (build environment + node_modules version drift), but the **direction** is the same: R3.a's footprint is well within the +50 KB budget with significant margin. The owner's post-deploy curl of the production index should still confirm:
1. Main `index-*.js` ≤ 430 KB (379 + 50 KB ceiling)
2. None of `ProfilesPage / StudentsPage / InstructorsPage / ProfilePage / OfferingsPage` appear in `<link rel=modulepreload>` on `/`, `/login`, or `/programs`

---

## D12 + D18 spec coverage

**`apps/api/test/identity-r3a.spec.ts`** (Commit F, ~530 LOC, 15 test groups):

| Tag | Group | Coverage |
|---|---|---|
| profile + SelfOrAdmin (D69) | 5 | Auto-create Profile on first GET / student edits own + audit / `/v1/profiles` admin-only / SelfOrAdmin 6-case matrix / cross-tenant 404 |
| student CRUD | 3 | Admin CRUD + `/me` 404-for-unlinked / 1:0..1 invariant rejection / cross-tenant userId rejection |
| instructor + offering wire (D68 Q3.a + D69) | 7 | Admin CRUD + dept reassign sub-resource + soft-delete / student catalog-read / assign with role OK / **assign with non-instructor role rejected 400 with precise message (D69)** / cross-tenant instructorId 400 / null/empty unassigns idempotently / instructor soft-delete → offering join returns null (SetNull behavior) |

**`apps/web/tests/visual/phase-b-r3a-identity.spec.ts`** (Commit K, ~290 LOC, 11 test groups):

| Tag | Group | Coverage |
|---|---|---|
| D12 | 7 | `/profile` form rendering / `/admin/profiles` table (D69) / `/admin/students` + pills / `/admin/instructors` + expertise chip + dept col / `/admin/offerings` new instructor column + assign button / sidebar «افراد» group / user-dropdown «پروفایل من» |
| D18 | 4 | Student bio round-trip persists across reload / instructor assignment via UI → cell shows name / instructor soft-delete cascade end-to-end (SetNull join behavior) / student blocked at `/admin/profiles` (403 surface or redirect) |

Total: **26 test groups** across both layers.

---

## Latent R1 bug discovered + fixed

While authoring Commit I, observed that `api.delete` was undefined in `apps/web/src/api/client.js` — only `api.del` was defined. Every R1 + R2 admin delete button (`deleteSchool`, `deleteFaculty`, `deleteDepartment`, `deleteProgram`, `deleteOffering`, `deleteCohort`) called `api.delete(...)` which evaluated to undefined → silent TypeError in the browser on click. Backend never received the request, so the soft-delete never ran.

D64 (R1 D13 ack) + D67 (R2 D13 ack) didn't catch this because owner manual smoke focused on create / edit flows; soft-delete may have appeared to succeed via UI optimistic refetch even though the server never deleted anything. Worth confirming on next D13 smoke that prior-R "soft-deleted" rows actually disappear after the Commit I deploy.

**Fix (commit `25a2d5a`):** 1-line additive — added `delete` as an alias to `api` alongside the legacy `del`. Keeps every existing call site (R1 + R2 + my new R3.a `studentApi`/`instructorApi`) unchanged and makes them actually hit the backend.

---

## D61 binding constraints — verification

| Constraint | Status |
|---|---|
| #1 Workflow discipline (memo → ack → code → spec → THIS DOC → deploy → D29 → D13 → close) | ✅ followed through all 12 commits + this doc; 5 stop triggers (per D69) armed throughout, none fired |
| #2 Performance budget — main bundle delta < 50 KB | ✅ −25 KB (under, with margin) |
| #2 Performance budget — admin chunk ≤ 55 KB each (proactive ping 45-55) | ✅ all 4 new chunks under 10 KB; OfferingsPage extension +0.42 KB |
| #2 Modulepreload — no admin chunks on anon routes | ✅ only `react-vendor` + `radix-vendor` preloaded |
| D69 — SelfOrAdminGuard reusable + audit semantic preserved | ✅ guard at `auth/guards/`, consumed by Profile + Student + Instructor; audit `actorId = request.user.userId` always |
| D66 Path D — per-route lazy chunks, NO admin manualChunks bucket | ✅ each new page = own chunk; vite.config.js unchanged |

---

## ⚠️ Rollback (12 commits cumulative)

```bash
cd C:/digiuniversity && git revert --no-edit HEAD~12..HEAD && git push origin main
```

Reverts every R3.a code change. Migration is reversible by manually authoring a down migration (per MIGRATION_POLICY §10 dormant-table caveat): `Profile`, `Student`, `Instructor` tables would need explicit `DROP TABLE`, and the `CourseOffering.instructorId` column would need to be `ALTER TABLE ... DROP COLUMN`. Document the choice (reinstate-later vs drop) in the revert commit body.

Note: R2 admin pages will revert to silently-broken-delete state (the `api.delete` alias fix in Commit I is part of this chain). If preserving the api.delete fix during rollback is desired, cherry-pick `25a2d5a`'s 1-line client.js change separately.

---

## Owner deploy + D29 pre-smoke + D13 (handoff)

VPS SSH was unreachable from this session, so the deploy step is being handed back. Owner-side sequence:

### 1. Deploy

```powershell
# From C:/digiuniversity:
.\scripts\remote.ps1 pull
.\scripts\remote.ps1 build
.\scripts\remote.ps1 up
.\scripts\remote.ps1 migrate      # applies 20260528000000_phase_b_r3a_identity
.\scripts\remote.ps1 seed         # backfills Profile rows + sample Student/Instructor + R2 offering instructor link
.\scripts\remote.ps1 health
```

### 2. API smoke (8 step)

```powershell
# Run from a Bash/curl prompt; substitute jq if available
ADMIN_TOKEN=$(curl -s -X POST https://digiuniversity.ir/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo","email":"admin@digiuniversity.ir","password":"ChangeMe!2026"}' | jq -r .accessToken)

# 1. Own profile loads
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/profile | jq '.userId'

# 2. Admin lists all profiles
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/profiles | jq 'length'

# 3. Student list
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/students | jq 'length'

# 4. Instructor list
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/instructors | jq '.[0].instructorCode'

# 5. Offering list with instructor joined
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/offerings | jq '.[0] | {id, instructorId, instructor: .instructor | {instructorCode, user: .user.fullName}}'

# 6. Assign instructor (use IDs from steps 4 + 5)
# curl -X PATCH ... /v1/offerings/<OFFERING_ID>/instructor -d '{"instructorId":"<INSTRUCTOR_ID>"}'

# 7. Reject non-instructor role assignment (use a student userId's instructor row — should be empty unless manually wired)
# Should return 400 with "assigned user must hold the 'instructor' role"

# 8. SelfOrAdmin matrix:
STUDENT_TOKEN=$(curl -s -X POST https://digiuniversity.ir/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo","email":"student1@digiuniversity.ir","password":"StudentPass!1"}' | jq -r .accessToken)
# student can read own:
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $STUDENT_TOKEN" https://digiuniversity.ir/api/v1/profile  # 200
# student CANNOT read admin's:
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $STUDENT_TOKEN" https://digiuniversity.ir/api/v1/users/<ADMIN_USER_ID>/profile  # 403
# student CANNOT list all profiles:
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $STUDENT_TOKEN" https://digiuniversity.ir/api/v1/profiles  # 403
```

### 3. Bundle re-measurement on production

```powershell
# From any machine with curl:
curl -s https://digiuniversity.ir/ | grep -oE '<link rel="modulepreload"[^>]*>'
# Expected: 2 lines, react-vendor + radix-vendor only. No admin / Profile / Student / Instructor names.

# Sizes:
curl -sI https://digiuniversity.ir/assets/index-*.js | grep -i content-length
# Expected: under 430 KB (379 baseline + 50 KB ceiling, R3.a budget)
```

### 4. D29 Chrome Extension pre-smoke (silent-fix loop, 3-attempt budget)

Routes to verify (login as admin):
- `/profile` (self-service editor renders + Save works)
- `/admin/profiles` (table renders with > 0 rows)
- `/admin/students` (table + status pill + + button)
- `/admin/instructors` (table + expertise chips + dept column)
- `/admin/offerings` (new «استاد» column + assign button on row)

Routes to verify (login as student `student1@digiuniversity.ir`):
- `/profile` (self-service editor)
- `/admin/students` → access denied / redirect
- `/admin/profiles` → access denied / redirect

### 5. D13 owner smoke (8 step, mobile + incognito + hard reload)

1. **Login as admin** (admin@digiuniversity.ir / ChangeMe!2026, tenant `demo`)
2. **/profile** (user dropdown → «پروفایل من»): form renders → edit bio → Save → success pill appears → hard-reload → bio persists
3. **/admin/profiles** (sidebar → «افراد» → «پروفایل‌ها»): read-only table with all seeded users; client-side search by name/email/national ID works
4. **/admin/students** + **/admin/instructors**: full CRUD round-trip (create new student/instructor; edit; soft-delete). Status pills color-coded. Expertise chips render on instructor rows. Department dropdown populated on the instructor dialog.
5. **/admin/offerings** new column + assign: «استاد» column visible; click 👤 on a row → dropdown lists instructors → select one → Save → row updates to show the assigned name
6. **Instructor role validation**: try to assign an Instructor whose backing User does NOT have the `instructor` role (you'd need to manually create such an Instructor via the admin UI tied to e.g. `cm1@digiuniversity.ir` — backend rejects with «assigned user must hold the 'instructor' role»)
7. **Student login** (student1@digiuniversity.ir / StudentPass!1, tenant `demo`): user dropdown shows «پروفایل من» (D69) → /profile works; sidebar has no admin entries; visiting /admin/students or /admin/profiles directly is denied
8. **Bundle vigilance**: open DevTools Network on `/` (anonymous, incognito) → no `ProfilePage-*.js`, `StudentsPage-*.js`, `InstructorsPage-*.js`, `ProfilesPage-*.js`, `OfferingsPage-*.js` in the initial preload waterfall — only `index-*.js`, `react-vendor-*.js`, `radix-vendor-*.js` plus CSS + fonts

---

## Open items for owner

- **VPS deploy** via remote.ps1 (sequence above)
- **D29 Chrome Extension pre-smoke** (silent-fix loop)
- **D13 owner manual smoke** on the 8-step checklist
- **Re-ack format:** «R3.a D13 PASS» (+ note any anomalies)
- **R3.b memo trigger:** once R3.a D13 closes, R3.b memo lands per D68 sequencing (state machines + StudentApplication / InstructorApplication + NotificationLog stub + Q4.a UNDER_REVIEW verification caveat enforcement)

---

— Phase B R3.a code closeout, 2026-05-27. D68 split + D69 SelfOrAdmin pattern shipped. Deploy + D13 outstanding.
