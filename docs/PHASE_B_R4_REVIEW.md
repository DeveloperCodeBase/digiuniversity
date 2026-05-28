# Phase B R4 — Enrollment Lifecycle (closes the D72 spine gap) — Review

**Author:** Phase B (post-Commit-G, pre-VPS-deploy)
**Date:** 2026-05-28
**Status:** ✅ code shipped on `main` (7 commits A→G + D73/D74 docs); ⏳ awaiting owner deploy + D29 + 8-step D13 (with D74 regression + D70 explicit-delete)
**Workflow:** memo → ack (D73) → Q2 hold + resolve (D74) → code A-G → THIS DOC → owner deploy → D29 → D13
**References:** D72 (the gap), D73 (Q-answers), D74 (Q2 = service-layer), MIGRATION_POLICY, PHASE_B_RETROSPECTIVE.md

---

## What shipped

A 7-commit chain closing the D72 spine gap: an accepted `StudentApplication` now produces a real **Enrollment** (not just a Student), via the Q0.a two-shape model (program-term admission). Plus the admin `/admin/enrollments` surface + a service-layer state machine (D74).

The apply → accept → **enroll** → learn spine is now connected end-to-end.

## Q0 resolution recap (the headline finding)

Schema discovery surfaced that `Enrollment.courseId` is **required** but a `CourseOffering` (what an application targets, via Program) has **no courseId**. Resolved via **Q0.a**: relax `courseId` to nullable → two shapes:
- **course-level** (legacy, Phase-3): `courseId` set
- **program-term admission** (R4 new): `offeringId` set + `courseId` null

Backward-compatible (nullable widening never invalidates existing rows). A partial unique index guards program-term collisions.

## Q2 resolution recap (the second catch)

The memo's Q2.a assumed existing `Enrollment.status` values «already match» an enum. Schema **+ code** discovery (D74) found they're lowercase strings + the existing Phase-7 RBAC status controller is built on them. Resolved: **status stays a String**; the state machine (`ALLOWED_TRANSITIONS` + illegal-400) lives at the **service layer** in the new R4 admin transition endpoint. Existing flow untouched. Zero migration, zero prod-data risk, zero existing-code rewrite. (Third pre-deploy catch after D63 + R2 @Header.)

## Commit chain (7 + docs)

| # | SHA | Concern |
|---|---|---|
| docs | `7701fc0` / `8a5e6f5` | D73 ack + Q2 hold; R4 memo |
| A | `37157c5` | Schema: Enrollment.courseId nullable (Q0.a) + targetOfferingId + resultingEnrollmentId on StudentApplication + reverse rels; migration SQL (nullable widening + partial unique index + new columns/FKs); seed program-term enrollment demo |
| B | `7cec380` | EnrollmentsService (state machine + adminList/getById/manualEnroll/transition/softDelete) + admin endpoints on the existing controller (existing flow untouched, D74) + offeringId/programId filters |
| C | `f4da12c` | ENROLLED side effect creates the program-term Enrollment in the `$transaction` + resultingEnrollmentId back-link + setTargetOffering path (closes D72) |
| D | `7a96eb6` | API e2e spec (`enrollments-r4.spec.ts`, 16 groups) incl. the D74 existing-flow regression block |
| E | `04ba3ca` | Frontend `enrollmentsAdminApi` + sidebar «ثبت‌نام‌ها» + EnrollmentsPage (list + filters + manual-enroll + transitions + soft-delete) + router |
| F | `01afd7d` | ApplicationsPage drawer target-offering selector (admin sets it pre-ENROLLED) + setTargetOffering endpoint |
| G | (this) | D12+D18 visual spec (`phase-b-r4-enrollments.spec.ts`, incl. D70 + D74) + this review + bundle measurement |

## Bundle measurement (D61 #2 + D66 Path D)

Local `npm run build`:

| Asset | R3.b baseline | R4 | Δ | Verdict |
|---|---:|---:|---:|---|
| `index-*.js` (main) | 355.61 KB | **356.64 KB** | **+1.03 KB** | ✅ << +50 KB |
| `react-vendor-*.js` | 203.57 KB | 203.57 KB | 0 | ✅ |
| `radix-vendor-*.js` | 96.63 KB | 96.63 KB | 0 | ✅ |
| `EnrollmentsPage-*.js` (NEW) | n/a | **7.49 KB** | new | ✅ < 25 KB target |
| `ApplicationsPage-*.js` (Commit F +selector) | 12.96 KB | 14.46 KB | +1.50 KB | ✅ |

**Modulepreload (`dist/index.html`):** only `react-vendor` + `radix-vendor`. No admin chunks. D66 Path D holds through R4.

## D12 + D18 + D70 + D74 spec coverage

**`apps/api/test/enrollments-r4.spec.ts`** (Commit D, 16 groups):
- manual enroll (program-term / course-level / neither-400 / cross-tenant-400 / duplicate-400 partial-unique / re-enroll-after-soft-delete)
- state machine (active→completed legal + completedAt; illegal terminal-lock 400)
- ENROLLED side effect (targetOffering→Enrollment + back-link; no-target→Student-only; cross-program-400)
- **D74 regression** (self-enroll still works / withdraw still works / listMine returns both shapes)
- soft-delete + cross-tenant 404

**`apps/web/tests/visual/phase-b-r4-enrollments.spec.ts`** (Commit G, 9 groups):
- D12: table + filters + manual-enroll button + sidebar / dialog selectors / program-term shape pill
- D18: legal-transition graph (active = 3 moves) / ENROLLED side effect → enrollment appears / active→completed UI
- **D70**: admin soft-delete → row gone + GET 404
- **D74**: existing self-enroll + withdraw regression (API-level)
- access guard (student → 403 / denial surface)

## D61 constraints

| Constraint | Status |
|---|---|
| #1 Workflow discipline (memo→ack→code→spec→THIS DOC→deploy→D29→D13) | ✅ + 7 stop triggers armed; the Q2 hold (D74) is the disciplined STOP-and-ping in action |
| #2 main bundle Δ < 50 KB | ✅ +1 KB |
| #2 EnrollmentsPage chunk < 25 KB | ✅ 7.49 KB |
| #2 no admin chunks in modulepreload | ✅ vendor only |
| D66 Path D per-route lazy | ✅ |
| D70 explicit-delete in D13 | ✅ §D13 below |
| D74 existing-flow regression mandate | ✅ spec + D13 step |

## Q-decisions verification matrix

| Q | Decision | Evidence |
|---|---|---|
| Q0.a | nullable courseId, two-shape | schema.prisma Enrollment.courseId String? + migration ALTER DROP NOT NULL + partial unique |
| Q1.a | targetOfferingId, null=Student-only | StudentApplication.targetOfferingId + setTargetOffering + side-effect branch |
| Q2 (D74) | service-layer state machine, String status | enrollments.service.ts ALLOWED_TRANSITIONS; status stays String |
| Q3.a | course-level @@unique + partial unique | migration Enrollment_program_term_admission_key WHERE courseId IS NULL AND deletedAt IS NULL |
| Q4.a | full /admin/enrollments | EnrollmentsPage list+filters+manual-enroll+transitions+soft-delete |
| Q5.a | resultingEnrollmentId back-link | StudentApplication.resultingEnrollmentId + side-effect populates it |
| dual-write | offering-only, no cohort back-write | side effect + manualEnroll set offeringId only; no cohortId touch |

## ⚠️ Rollback (7 commits)

```bash
cd C:/digiuniversity && git revert --no-edit HEAD~7..HEAD && git push origin main
```

Migration reversal (manual down): re-tighten `Enrollment.courseId` to NOT NULL is ONLY safe if no program-term (courseId-null) rows exist — so a down migration must first delete/convert them. Drop the partial unique index + the StudentApplication columns/FKs. Per MIGRATION_POLICY §10 — document the choice in the revert body. (R3.b + earlier survive the R4 revert.)

## Owner deploy + D29 + D13 (handoff — VPS SSH unreachable from session)

### Deploy
```powershell
.\scripts\remote.ps1 pull
.\scripts\remote.ps1 build
.\scripts\remote.ps1 up
.\scripts\remote.ps1 migrate    # applies 20260530000000_phase_b_r4_enrollment
.\scripts\remote.ps1 seed       # adds the program-term enrollment demo
.\scripts\remote.ps1 health
```

⚠️ **Migration note (per owner Commit A directive + stop trigger #6):** the `courseId` nullable widening is a pure `DROP NOT NULL` — existing rows are untouched by definition. The `status` column is NOT migrated (D74). No enum cast on existing data → none of the R2 migration-failure risk. If `remote.ps1 migrate` reports anything other than clean success on the partial-unique index or the column relax, STOP and ping before retrying.

### 8-step D13 smoke (incl. D74 regression + D70 explicit-delete)
1. **Login admin** → `/admin/enrollments` renders + filters work; sidebar «ثبت‌نام‌ها» visible
2. **Manual enroll**: «+ ثبت‌نام دستی» → pick a student + an offering → row appears as «پذیرش دوره‌ای» (program-term), status فعال
3. **State machine**: on an active row, click → پایان‌یافته (completed); verify it leaves the active-filter view; on a completed row there are no transition buttons (terminal). Illegal moves aren't offered (UI mirrors backend; backend also rejects 400)
4. **Application-driven (closes D72)**: open `/admin/applications`, click a student application → drawer → set «دوره‌ی هدف» → verify both Q4.a badges green → ACCEPTED → ثبت‌نام نهایی (ENROLLED) → confirm. Then verify: (a) new Student at `/admin/students`, (b) new program-term Enrollment at `/admin/enrollments`, (c) the application drawer shows «ثبت‌نام انجام‌شده: #…» (resultingEnrollmentId)
5. **Student self-view**: login student1 → the existing enrollments surface (`/enrollments/me`) shows the seed program-term admission
6. **⚠️ D74 REGRESSION (critical — Q2 kept the existing flow)**: as a student, the EXISTING self-enroll into a course + self-withdraw must still work. Verify: student enrolls in a course (existing flow), then withdraws themselves — both succeed. This confirms the new R4 admin surface didn't break the Phase-7 student flow.
7. **D70 explicit delete**: admin soft-deletes an enrollment from `/admin/enrollments` → row disappears → reload → still absent → admin GET `/v1/enrollments/<id>` → 404
8. **Bundle + untouched routes**: DevTools Network on `/` (anon) → no `EnrollmentsPage-*.js` preloaded; Phase A/R1/R2/R3 routes render normally

**Re-ack:** «R4 D13 PASS» (+ note anomalies, especially any regression in the existing student enrollment flow).

## Open items
- VPS deploy + 8-step D13 (incl. D74 regression + D70 delete)
- Phase B retrospective addendum (R4 + the D74 third-catch lesson) once R4 closes
- Next: per the R-Next memo sequencing → Candidate C (applicant self-service UX) or Candidate A (content enrichment); owner picks after R4 D13

---

— Phase B R4 code closeout, 2026-05-28. D72 spine gap closed: apply → accept → enroll now connected. Q0.a + Q2-service-layer both resolved via pre-deploy schema/code discovery. Deploy + D13 outstanding.
