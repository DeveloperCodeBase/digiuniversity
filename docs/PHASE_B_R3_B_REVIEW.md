# Phase B R3.b — Applications + State Machines + NotificationLog stub — Review

**Author:** Phase B (post-Commit-I, pre-VPS-deploy)
**Date:** 2026-05-28
**Status:** ✅ code shipped on `main` (9 commits A→I + D71 docs prelude); ⏳ awaiting owner deploy + D29 pre-smoke + 9-step D13 manual smoke
**Workflow:** memo (R3.b directive) → ack (D71) → code A-I → THIS DOC → deploy → D29 → D13
**References:** D68 (R3 split + Q4.a caveat), D70 (R3.a close + explicit-delete D13 lesson), D71 (R3.b Q-answers locked + Q5.a/Q8.a refinements), D66 (bundle Path D)

---

## What shipped

A 9-commit chain implementing the D71 R3.b scope: two parallel application models + AppStatus state machine + Q4.a verification gate + Q5.a transactional find-or-create-or-link side effect (with Q6.a instructor role grant) + Q8.a public submission with rate-limit + spam-detection stub + Q7.a SelfOrAdmin WITHDRAW.

R3.b closes the Identity track. R-Notif (post-Phase-B) will wire actual email/SMS senders to the NotificationLog stub; R-Identity-Applicant-UX (post-Phase-B) will build the applicant-facing submission/withdraw UI on top of the public API surface.

## Commit chain (9 commits + docs prelude)

| # | SHA | Concern |
|---|---|---|
| docs | `c7581fe` | D71 entry + memo update (Q5.a find-or-create-or-link + Q8.a rate-limit + reordered A–I) |
| A | `60b37d8` | Prisma schema (2 application models + NotificationLog + AppStatus + reverse relations on 8 models) + migration SQL + seed (5 student apps + 2 instructor apps across all 7 AppStatus values + 2 NotificationLog samples) |
| B | `7d312a6` | NestJS Applications module — controller + service + **state-machine validator** only. ENROLLED stub-rejected with 501 until Commit D. Both Student + Instructor parallel modules sharing AppStatus map. |
| C | `5defcef` | **Verification gate guard (Q4.a)** — service-layer rejects UNDER_REVIEW → forward without both flags set, with precise «Q4.a caveat» message. Admin verify-email + verify-phone PATCH endpoints land here. |
| D | `e0ca1db` | **ENROLLED side effect service** (`ApplicationEnrollmentService`) — transactional find-or-create-or-link per Q5.a refinement; Q6.a parallel for Instructor (creates Instructor + grants `instructor` role via `ensureRoleGrant`). |
| E | `f9ec6f0` | **Public submission endpoint** (`@Public()` + `@Throttle` 5/IP/hr per Q8.a refinement) + idempotency on `(tenantId, applicantEmail, programId)` + spam-flag NotificationLog stub when >3 submissions in 1-hour window. SelfOrAdmin GET/me + WITHDRAW also here. |
| F | `5918f46` | API e2e spec (`applications-r3b.spec.ts`, 14 test groups) — public submission + rate-limit 429 + state machine + Q4.a gate + Q5.a CREATE/LINK/idempotency + Q6.a role grant + Q7.a SelfOrAdmin matrix + cross-tenant + soft-delete |
| G | `beb9d9a` | Frontend `endpoints.js` extension (`studentApplicationsApi` + `instructorApplicationsApi`) + sidebar nav entry «درخواست‌ها» + ApplicationsPage list with type-tab + status + program/department filters |
| H | `d0bad4d` | Application drawer (row click) with applicant snapshot + Q4.a verification toggles + state-machine transition controls (only legal next-states shown) + ENROLLED side-effect confirmation modal + Q7.a admin-on-behalf WITHDRAW + soft-delete |
| I | (this commit) | D12+D18 visual spec (`phase-b-r3b-applications.spec.ts`, 8 test groups including D70 explicit-delete-or-withdraw clause) + this review doc + bundle measurement |

## State machine summary (Q1.a)

```
SUBMITTED      → UNDER_REVIEW | WITHDRAWN
UNDER_REVIEW   → INTERVIEW | ACCEPTED | REJECTED | WITHDRAWN  ⚠️ Q4.a verification gate
INTERVIEW      → ACCEPTED | REJECTED | WITHDRAWN
ACCEPTED       → ENROLLED | WITHDRAWN              ⚠️ ENROLLED triggers Q5.a transactional side effect
ENROLLED       — terminal
REJECTED       — terminal
WITHDRAWN      — terminal
```

The verification gate only fires on FORWARD exits from UNDER_REVIEW (INTERVIEW / ACCEPTED / REJECTED). WITHDRAWN exit from UNDER_REVIEW is allowed unconditionally so applicants who never verified can still bail.

## D71 refinement implementations

| Refinement | Where it lives |
|---|---|
| **Q5.a find-or-create-or-link** | `apps/api/src/identity/applications/application-enrollment.service.ts` — `resolveOrCreateUser()` handles REUSE (existing userId set) / LINK (matching email in same tenant) / CREATE (new User + Profile + UserRole + NotificationLog `user.password.claim`). All inside `prisma.$transaction(...)`. P2002 race → `ConflictException` with retry hint pointing to LINK branch. |
| **Q8.a rate-limit + spam-flag** | `apps/api/src/identity/applications/student-applications.controller.ts` + `.service.ts` — `@Throttle({ default: { limit: 5, ttl: 3_600_000 } })` on `@Public()` POST. After successful create, `maybeFlagSpam()` counts submissions from `(tenantId, applicantEmail)` in last hour; if >3, queues `application.spam.suspected` NotificationLog row (deduped per application). |

## Bundle measurement (D61 Constraint #2 + D66 Path D verification)

Local `npm run build` against `apps/web/`:

| Asset | R3.a baseline | R3.b | Δ | Verdict |
|---|---:|---:|---:|---|
| `index-*.js` (main) | 353.57 KB | **355.61 KB** | **+2.04 KB** | ✅ << +50 KB budget |
| `react-vendor-*.js` | 203.57 KB | 203.57 KB | 0 | ✅ (vendor cached) |
| `radix-vendor-*.js` | 96.63 KB | 96.63 KB | 0 | ✅ |
| `ApplicationsPage-*.js` (NEW) | n/a | **12.96 KB** | new | ✅ < 25 KB target |
| `ProfilesPage-*.js` (R3.a) | 3.02 KB | 3.02 KB | 0 | ✅ |
| `StudentsPage-*.js` (R3.a) | 5.04 KB | 5.04 KB | 0 | ✅ |
| `InstructorsPage-*.js` (R3.a) | 7.03 KB | 7.03 KB | 0 | ✅ |
| `OfferingsPage-*.js` (R2/R3.a) | 9.42 KB | 9.46 KB | +0.04 KB | ✅ |
| `ProfilePage-*.js` (R3.a self-service) | 6.70 KB | 6.70 KB | 0 | ✅ |

**Modulepreload verification (served `dist/index.html`):**
```html
<link rel="modulepreload" crossorigin href="/assets/react-vendor-BUP5f_pr.js">
<link rel="modulepreload" crossorigin href="/assets/radix-vendor-DCDHWrup.js">
<!-- No ApplicationsPage or any other admin chunk here ✅ -->
```

**D66 Path D pattern holds end-to-end for R3.b.** Every admin chunk remains truly lazy — none appear in the eager preload list. The new `ApplicationsPage-*.js` is 12.96 KB (under the 25 KB target + well below the 30 KB ceiling that would trigger a proactive ping per stop trigger #4).

Main bundle delta of +2 KB is the controller-side type imports + sidebar entry + new lazy-route registration — all expected. R3.a's massive -25 KB drop is preserved.

## D12 + D18 spec coverage

**`apps/api/test/applications-r3b.spec.ts`** (Commit F, ~650 LOC, 14 test groups):
| Tag | Group count | Coverage |
|---|---:|---|
| public submission (Q8.a) | 4 | 201 vs 200 idempotent / rate-limit 429 / unknown-tenant 400 / application.submitted NotificationLog queued |
| state machine + verification gate | 4 | happy path with verify cycle / WITHDRAWN bypasses gate / illegal-transition «Allowed from X» / terminal-state lock |
| ENROLLED side effect — student | 3 | CREATE branch (User + Profile + UserRole + notification) / LINK branch (no duplicate User; no password.claim queue) / idempotency rejection |
| ENROLLED side effect — instructor (Q6.a) | 1 | CREATE branch grants `instructor` role + carries expertise/rank from application |
| SelfOrAdmin /me + WITHDRAW (Q7.a) | 2 | applicant own /me + own withdraw + other 403 + admin on-behalf withdraw |

**`apps/web/tests/visual/phase-b-r3b-applications.spec.ts`** (Commit I, ~310 LOC, 8 test groups):
| Tag | Group count | Coverage |
|---|---:|---|
| D12 (UI contracts) | 3 | unified table + type tabs + sidebar entry / drawer opens with snapshot + verify pills + transition buttons / student-access-guard surface |
| D18 (flow + cross-layer) | 3 | ALLOWED_TRANSITIONS legal-graph drift (client mirror vs backend) on SUBMITTED row / Q4.a gate rejection surfaces in drawer error / idempotent re-submit returns 200 with `_idempotent: true` |
| **D70 explicit delete/withdraw clause** | 2 | admin soft-delete from drawer → row disappears + GET 404 / applicant WITHDRAW via /me + withdraw (or admin-on-behalf fallback) → status WITHDRAWN |

**Total: 22 test groups** across API + UI. Includes the D70 binding from R3.a's lesson — every D13 smoke must explicitly cover delete/destroy/withdraw, and this spec exercises both flavors.

## D61 binding constraints — verification

| Constraint | Status |
|---|---|
| #1 Workflow discipline (memo → ack → code → spec → THIS DOC → deploy → D29 → D13 → close) | ✅ followed through all 9 commits + this doc; 6 stop triggers (per D71) armed throughout, none fired |
| #2 Main bundle delta < 50 KB | ✅ +2 KB |
| #2 ApplicationsPage chunk < 25 KB (target) / < 30 KB (ceiling) | ✅ 12.96 KB |
| #2 Modulepreload — no admin chunks on anon routes | ✅ only vendor chunks |
| D69 SelfOrAdmin reused (no new auth primitive needed) | ✅ /me + WITHDRAW gated through D69 pattern |
| D70 explicit-delete clause in D13 checklist | ✅ §«D13 owner smoke» below includes 2 destructive paths |
| D66 Path D — per-route lazy, NO admin bucket | ✅ vite.config.js unchanged |

## Q-decisions verification matrix

| Q | Decision | Implementation evidence |
|---|---|---|
| Q1.a | 7-value AppStatus shared enum | `apps/api/prisma/schema.prisma` enum AppStatus; `applications.types.ts` ALLOWED_TRANSITIONS |
| Q2.a | Verification timestamps on Application | `applicantEmailVerifiedAt` + `applicantPhoneVerifiedAt` columns in both application tables |
| Q3.a | Admin PATCH for verification; self-verify deferred | `PATCH /v1/applications/student/:id/verify-email` + verify-phone in Commit C |
| Q4.a | Free-text Persian NotificationLog bodies | All `application.submitted` + `user.password.claim` + `application.spam.suspected` bodies are inline Persian |
| Q5.a (modified) | find-or-create-or-link | `ApplicationEnrollmentService.resolveOrCreateUser()` — REUSE → LINK → CREATE branches |
| Q6.a | Instructor: create + grant role; no auto-offering assignment | `enrollInstructor()` + `ensureRoleGrant()`; no CourseOffering touch |
| Q7.a | Applicant SelfOrAdmin WITHDRAW + admin on behalf | `withdrawSelf()` in service; 403 for non-owner non-admin |
| Q8.a (modified) | @Public + Throttle 5/IP/hr + spam-flag | `@Throttle(SUBMIT_THROTTLE)` on controllers; `maybeFlagSpam()` in services |
| Q9.a | Unified `/admin/applications` page | Single page with type tabs (student + instructor + همه) |

## ⚠️ Rollback (9 commits cumulative)

```bash
cd C:/digiuniversity && git revert --no-edit HEAD~9..HEAD && git push origin main
```

Reverts every R3.b code change. Migration reversible by manually authoring a down migration: `DROP TABLE "NotificationLog"`, `DROP TABLE "InstructorApplication"`, `DROP TABLE "StudentApplication"`, `DROP TYPE "AppStatus"`. Per MIGRATION_POLICY §10 dormant-table caveat — document choice in revert commit body.

R3.a primitives (SelfOrAdminGuard, api.delete alias fix) survive the R3.b revert untouched.

## Owner deploy + D29 pre-smoke + D13 (handoff)

VPS SSH unreachable from this session per R3.a precedent. Deploy + smoke handed back to owner.

### 1. Deploy

```powershell
.\scripts\remote.ps1 pull
.\scripts\remote.ps1 build
.\scripts\remote.ps1 up
.\scripts\remote.ps1 migrate      # applies 20260529000000_phase_b_r3b_applications
.\scripts\remote.ps1 seed         # adds 5 student + 2 instructor sample apps + 2 NotificationLog stubs
.\scripts\remote.ps1 health
```

### 2. API smoke (10 step, full recipe)

```bash
ADMIN_TOKEN=$(curl -s -X POST https://digiuniversity.ir/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo","email":"admin@digiuniversity.ir","password":"ChangeMe!2026"}' | jq -r .accessToken)

# 1. Public submission succeeds 201
curl -s -X POST https://digiuniversity.ir/api/v1/applications/student \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo","programId":"<PROG_ID>","applicantFullName":"Smoke","applicantEmail":"smoke-'$(date +%s)'@test.local"}' | jq '.status'  # SUBMITTED

# 2. Idempotent re-submit returns 200 with _idempotent
# (same email + program as step 1) → response shows _idempotent: true

# 3. Admin list shows the new app
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/applications/student | jq 'length'

# 4. Transition SUBMITTED → UNDER_REVIEW
curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"to":"UNDER_REVIEW"}' https://digiuniversity.ir/api/v1/applications/student/<APP_ID>/transition

# 5. UNDER_REVIEW → INTERVIEW without verification → 400 with Q4.a message
curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"to":"INTERVIEW"}' https://digiuniversity.ir/api/v1/applications/student/<APP_ID>/transition | jq '.message'
# expect: contains "Q4.a caveat"

# 6. Admin verify-email + verify-phone
curl -s -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/applications/student/<APP_ID>/verify-email
curl -s -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" https://digiuniversity.ir/api/v1/applications/student/<APP_ID>/verify-phone

# 7. INTERVIEW → ACCEPTED → ENROLLED — verify side effect creates User + Student + NotificationLog
# (chain transition calls as above; then check /v1/profiles for the new User, /v1/students for the Student,
#  /v1/notification-logs for the user.password.claim row — but wait, the public notification-log endpoint
#  isn't exposed in R3.b; use admin Prisma query via remote.ps1 shell if needed.)

# 8. Illegal transition (ENROLLED → SUBMITTED) → 400
curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"to":"SUBMITTED"}' https://digiuniversity.ir/api/v1/applications/student/<APP_ID>/transition | jq '.message'
# expect: contains "Allowed from ENROLLED: [(none — terminal)]"

# 9. SelfOrAdmin WITHDRAW (student token; if owner-bind ok), else admin on behalf
STUDENT_TOKEN=$(curl -s -X POST https://digiuniversity.ir/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo","email":"student1@digiuniversity.ir","password":"StudentPass!1"}' | jq -r .accessToken)
curl -s -X POST -H "Authorization: Bearer $STUDENT_TOKEN" https://digiuniversity.ir/api/v1/applications/student/<OTHER_APP_ID>/withdraw
# expect: 403 (not own)

# 10. Cross-tenant defense + rate-limit 429
# (rapid 6 POST → 6th returns 429)
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://digiuniversity.ir/api/v1/applications/student \
    -H 'Content-Type: application/json' \
    -d '{"tenantSlug":"demo","programId":"<PROG_ID>","applicantFullName":"RL '$i'","applicantEmail":"rl-'$i'-'$(date +%s)'@test.local"}'
done
# expect: 201 x5 then 429
```

### 3. Production bundle re-measurement

```bash
curl -s https://digiuniversity.ir/ | grep -oE '<link rel="modulepreload"[^>]*>'
# expected: 2 lines — react-vendor + radix-vendor only
# NO ApplicationsPage, NO Profile/Student/Instructor chunks

curl -sI https://digiuniversity.ir/assets/index-*.js | grep -i content-length
# expected: ≤ 430 KB (R3.a baseline 380 KB + 50 KB R3.b budget)
```

### 4. D29 Chrome Extension pre-smoke (silent-fix loop, 3-attempt budget)

Routes to verify (login as admin):
- `/admin/applications` — table renders with seeded rows, type tabs work, status filter narrows
- Click a row → drawer opens with applicant snapshot
- Click ✉ pill on UNDER_REVIEW row → turns green (verifyEmail PATCH 200)
- Click → ارجاع به مصاحبه — backend response surfaces in drawer (success or Q4.a error inline)
- Click → ثبت‌نام نهایی on an ACCEPTED row → confirmation modal explains side effect → confirm → row updates to ENROLLED

Routes to verify (login as student1):
- `/admin/applications` → access-denied surface OR redirect

### 5. D13 owner smoke checklist (9 step, **includes D70 explicit-delete/withdraw clause**)

1. **Login as admin** (admin@digiuniversity.ir / ChangeMe!2026, tenant `demo`); sidebar shows «درخواست‌ها» under «افراد»
2. **/admin/applications** — table renders with 7 seeded rows; type tabs (همه/دانشجو/استاد) narrow correctly; status filter works
3. **Transition SUBMITTED → UNDER_REVIEW** — click row `applicant.submitted@digiuniversity.ir` → drawer → click → آغاز بازبینی → row status updates to UNDER_REVIEW
4. **Q4.a gate blocks INTERVIEW without verify** — on the now-UNDER_REVIEW row (or seed sample `applicant.review.partial`), click → ارجاع به مصاحبه → drawer shows red error containing «Q4.a caveat» and the missing channel name
5. **Set verification flags via drawer pills** — click ✉ then ☎; both turn green; reload drawer to verify
6. **Retry INTERVIEW transition** — succeeds 200, status flips to INTERVIEW
7. **ACCEPTED → ENROLLED side effect** — advance to ACCEPTED, then click → ثبت‌نام نهایی; confirmation modal explains User find-or-create-or-link + Student + NotificationLog; confirm; verify (a) new User appears at /admin/profiles, (b) new Student row at /admin/students, (c) application status now ENROLLED with resultingStudentId link in the drawer
8. **Public submission idempotency + rate-limit** — manually `curl -X POST /v1/applications/student` 6 times with different emails from your IP; 6th returns 429. Then re-submit the first email — returns 200 with `_idempotent: true` in the body.
9. **D70 explicit delete/withdraw**: (a) admin clicks «انصراف به نمایندگی» on a SUBMITTED row → status → WITHDRAWN; (b) admin clicks «حذف (soft)» on a WITHDRAWN row → confirm → row disappears from table; reload page → row still absent; admin GET `/v1/applications/student/<id>` → 404. **Both destructive paths verified.**

## Open items for owner

- **VPS deploy** via remote.ps1 sequence above
- **API smoke** (10-step recipe in §2)
- **D29 Chrome Extension pre-smoke**
- **9-step D13 manual smoke** (includes D70 binding clause)
- **Production bundle re-measurement** + modulepreload verification
- **Re-ack format:** «R3.b D13 PASS» (+ note any anomalies)
- **R3.b retrospective entry** in `docs/PHASE_B_RETROSPECTIVE.md` once close cycle completes (D70 + R3.b lessons consolidate there)
- **R3.c / R-Identity-Applicant-UX** memo trigger — applicant-facing submission/withdraw UI is the natural next sub-R after R3.b closes; not in current scope

---

— Phase B R3.b code closeout, 2026-05-28. D71 Q-decisions all honored (incl. Q5.a + Q8.a refinements). Deploy + 9-step D13 outstanding.
