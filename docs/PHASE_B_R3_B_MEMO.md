# Phase B R3.b — Applications + State Machines + NotificationLog stub — Memo

**Author:** Phase B post-R3.a-D13 (D70)
**Date:** 2026-05-27
**Status:** ⏳ DRAFT — awaiting owner ack before R3.b code
**Workflow:** memo → owner ack → code → spec → deploy → D29 pre-smoke → D13 owner smoke → close (D61 Constraint #1)
**Split-from:** `PHASE_B_R3_MEMO.md` (parent R3 memo) → R3.a (Identity foundation, closed D70) + R3.b (this — state machines + Applications)
**Predecessors operational:** D69 SelfOrAdminGuard primitive + audit semantic + R3.a models (Profile/Student/Instructor) shipped per D70.

---

## 🔒 Pre-locked answers (carried from D68 + D70 + owner R3.b directive)

| Source | Decision | R3.b impact |
|---|---|---|
| D68 Q4.a | Nullable `StudentApplication.userId` until ENROLLED side effect creates the User | Applicant can submit without a pre-existing account |
| D68 Q4.a caveat | UNDER_REVIEW gate requires email + phone verification before any forward transition | Service-layer guard on transitions out of UNDER_REVIEW |
| D70 lesson | Every D13 smoke must include explicit delete / soft-delete / withdraw test per surface | Added to R3.b D13 checklist (this memo §«D13 owner smoke») |
| R3.b directive | Shared `AppStatus` enum for both Student + Instructor applications | One enum, two parallel state machines |
| R3.b directive | NotificationLog is a **stub** — write rows on every transition, no actual email/SMS sender (R-Notif is post-Phase-B) | NotificationLog model + service that records what *would* be sent |
| R3.b directive | Transactional ACCEPTED → ENROLLED side effect: creates User + Student (or Instructor) + Enrollment row | Service-layer Prisma `$transaction`; all-or-nothing |
| R3.b directive | Admin UI: ApplicationsPage (unified table — student + instructor in one view with type+status filter + transition controls) | Single `/admin/applications` route |
| R3.b directive | Applicants can **view** their own application (SelfOrAdmin reuses D69) but **cannot delete** — they use the WITHDRAW state transition | No applicant-facing delete; WITHDRAW is the exit path |

---

## R1 + R2 + R3.a lessons applied

| Lesson | Source | R3.b application |
|---|---|---|
| Schema discovery BEFORE memo lock | R1 lesson | Done — see §«Schema discovery» below; all R3.b adds are greenfield except reverse relations |
| Per-route lazy chunking, NO admin manualChunks bucket | D66 Path D | The single new admin page (`/admin/applications`) ships as its own per-route chunk |
| Service-layer state machine (ALLOWED_TRANSITIONS map + isLegalTransition + 400 with «Allowed from X: [list]») | R2 precedent | Two parallel maps (Student / Instructor) sharing the AppStatus enum; identical illegal-transition error shape |
| SelfOrAdmin primitive operational | D69 | Reused for applicant-self-view + applicant-self-withdraw |
| Audit semantic preserved | D69 | `AuditLog.actorId` = `request.user.userId` on every transition (admin transitions on behalf of applicant log as `actor=admin, subject=Application:<id>`) |
| Explicit delete/withdraw test per surface in D13 | D70 | D13 checklist includes admin soft-delete of an application + applicant WITHDRAW test |
| Post-deploy bundle measurement REQUIRED in review doc | D66 lesson | `PHASE_B_R3_B_REVIEW.md` will include main-bundle delta + per-chunk size + modulepreload verification on `/`, `/login`, `/programs` |
| Migration must include explicit SQL (Prisma schema-only edit insufficient) | R2 hard lesson | Migration SQL hand-authored in Commit A |
| `api.delete` alias preserved (R3.a Commit I fix) | D70 lesson | New applicationApi.delete won't silent-fail |

---

## Schema discovery

| Model | State | R3.b action |
|---|---|---|
| `User` | ✅ EXISTS | Additive reverse relations: `studentApplications StudentApplication[]`, `instructorApplications InstructorApplication[]`. NO column change. |
| `Tenant` | ✅ EXISTS | Reverse relations: `studentApplications`, `instructorApplications`, `notificationLogs`. NO column change. |
| `Profile` | ✅ EXISTS (R3.a) | No change. (Applicant might not have a Profile until ENROLLED side effect creates User + Profile is auto-created on first /profile GET.) |
| `Student` | ✅ EXISTS (R3.a) | Reverse relation: `application StudentApplication?` (1:0..1 — created from the application that birthed this Student) |
| `Instructor` | ✅ EXISTS (R3.a) | Reverse relation: `application InstructorApplication?` |
| `Program` | ✅ EXISTS (R1) | Reverse relation: `studentApplications StudentApplication[]` (applicants apply to a Program) |
| `Department` | ✅ EXISTS (R1) | Reverse relation: `instructorApplications InstructorApplication[]` (instructor applicants target a Department) |
| `Enrollment` | ✅ EXISTS | No structural change. Side effect creates a row at ACCEPTED → ENROLLED (student case). |
| `StudentApplication` | ❌ greenfield | NEW (§2) |
| `InstructorApplication` | ❌ greenfield | NEW (§2) |
| `NotificationLog` | ❌ greenfield | NEW (§2) |
| `AppStatus` enum | ❌ greenfield | NEW (§2) |

All adds are greenfield (§2) or additive reverse relations (§4). No §3/§5/§6 patterns.

---

## ❓ Open Q-decisions (recommend → owner acks or overrides)

Defaults marked **(Recommended)**.

### Q1 — AppStatus enum values
- **Q1.a (Recommended)** — 7 values: `SUBMITTED, UNDER_REVIEW, INTERVIEW, ACCEPTED, ENROLLED, REJECTED, WITHDRAWN`. Matches owner directive verbatim. Single shared enum used by both Student + Instructor application services.
- **Q1.b** — Add `WAITLISTED` between `INTERVIEW` and `ACCEPTED` (admit overflow buffer). Adds one more legal transition but useful for Iranian university admit cycles.
- **Q1.c** — Different value list.

### Q2 — Verification gate trigger + storage (Q4.a caveat enforcement)
The Q4.a caveat says UNDER_REVIEW requires email + phone verification before any forward transition. Open: where do we store the verified-flags?

- **Q2.a (Recommended)** — Two timestamp columns on the Application row itself: `applicantEmailVerifiedAt DateTime?` + `applicantPhoneVerifiedAt DateTime?`. Both required non-null before any of {INTERVIEW, ACCEPTED, REJECTED} is reachable from UNDER_REVIEW. Reason: applicant may have no User yet per Q4.a, so verification state must live on the Application, not on Profile/User.
- **Q2.b** — Two columns + an admin override boolean (skip in dev/seed/legacy migrations). Risk: override drifts into routine bypass.
- **Q2.c** — Verification state on Profile (if userId is set) OR on Application (if userId is null). Two read paths complicates the guard.

### Q3 — Verification flow (how do we mark them verified?)
- **Q3.a (Recommended)** — R3.b ships the **schema + guard only**. The actual verification endpoints (POST /v1/applications/:id/verify-email{token} + POST /v1/applications/:id/verify-phone{otp}) ship as a tiny addendum or deferred to R3.b.1 / R-Notif. For R3.b, admins can set the verified-flags directly via PATCH (covers the smoke test path); a TODO comment in the service points to R-Notif for end-user verification UX.
- **Q3.b** — Full email-token + SMS-OTP flow lands in R3.b (adds ~600 LOC, mailer integration, R-Notif scope creep — likely STOP+ping if pursued).

### Q4 — NotificationLog stub body
- **Q4.a (Recommended)** — Free-text Persian body inlined per template type (e.g., for `application.submitted` we write: «درخواست شما با شماره X ثبت شد. مدت بازبینی: ۱۴ روز.»). Lets admins read what *would* go out without an external template service. Easy to migrate to template keys in R-Notif.
- **Q4.b** — Template-key only (`application.submitted`). Less informative for the admin reading the log; defers body composition.

### Q5 — ACCEPTED → ENROLLED side effect — User reuse
- **Q5.a (Recommended)** — If `Application.userId` is non-null at ENROLLED time, reuse that User. If null, create a new User in the transaction (random secure password; emit a `password.reset.needed` NotificationLog so applicant can claim the account). Then create Student/Instructor + Enrollment as appropriate. Whole thing inside `prisma.$transaction(...)` — atomic.
- **Q5.b** — Always create a new User row. Risk: collides on `(tenantId, email)` UNIQUE for applicants who registered earlier; fails the transaction.
- **Q5.c** — Reuse if non-null; reject the ENROLLED transition (admin must explicitly link a User first) if null. Loses the «apply without account» convenience.

### Q6 — InstructorApplication ENROLLED side effect
- **Q6.a (Recommended)** — Side effect mirrors Student: create User (if null) + Instructor row (with instructorCode auto-generated as `INS-<short>`, departmentId from Application) + grant the `instructor` role on UserRole. NO automatic CourseOffering assignment (that's R3.a's offerings/assignInstructor endpoint; not in R3.b scope).
- **Q6.b** — Also auto-assign to the offerings flagged by the Application. Couples R3.b to R3.a UI strongly; defer to a manual admin step.

### Q7 — WITHDRAW transition authorization
- **Q7.a (Recommended)** — Applicant can WITHDRAW their own (via SelfOrAdmin gate); admin can also WITHDRAW on behalf (e.g., timeout, request from school). The transition itself is the same; only the actor differs (audit log records who).
- **Q7.b** — Admin-only WITHDRAW. Applicants would have to email support to exit. Worse UX.

### Q8 — Applicant submission endpoint shape
- **Q8.a (Recommended)** — Public POST endpoint `/v1/applications/student` (and `/v1/applications/instructor`) gated by `@Public()` (no JWT required); body includes `tenantSlug` to scope. Idempotency via `(tenantId, applicantEmail, programId|departmentId)` — re-submitting the same applicant+target returns the existing application id.
- **Q8.b** — Authenticated-only submission. Requires applicant to register first → loses the Q4.a anonymous-applicant convenience.
- **Q8.c** — Anonymous OR authenticated; if authenticated, auto-fills userId.

### Q9 — Listing scope (admin)
- **Q9.a (Recommended)** — Single `/admin/applications` route showing student + instructor in one table; type column distinguishes them; status filter + type filter + program/department filter.
- **Q9.b** — Two routes: `/admin/applications/students` + `/admin/applications/instructors`. Aligns with backend split but doubles UI surface.

---

## Scope (R3.b)

### Data models (Prisma additive — all greenfield)

```prisma
enum AppStatus {
  SUBMITTED
  UNDER_REVIEW
  INTERVIEW
  ACCEPTED
  ENROLLED
  REJECTED
  WITHDRAWN
}

model StudentApplication {
  id                          String     @id @default(cuid())
  tenantId                    String
  // Q4.a (D68): nullable until ENROLLED side effect creates the User.
  userId                      String?
  programId                   String

  // Applicant snapshot — captured at submit time so admin still has
  // a meaningful row even if applicant later changes their User profile.
  applicantFullName           String
  applicantEmail              String
  applicantPhone              String?
  applicantNationalId         String?
  applicantBio                String?  @db.Text

  // Q2.a verification gate per D68 Q4.a caveat.
  applicantEmailVerifiedAt    DateTime?
  applicantPhoneVerifiedAt    DateTime?

  status                      AppStatus  @default(SUBMITTED)
  submittedAt                 DateTime   @default(now())
  decidedAt                   DateTime?
  decidedBy                   String?    // admin User.id

  // Linked artifacts created by ACCEPTED → ENROLLED side effect.
  // (per Q5.a, side effect populates these in the transaction).
  resultingStudentId          String?
  resultingEnrollmentId       String?

  // Audit + soft-delete
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  createdBy String?
  updatedBy String?

  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user     User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  program  Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  student  Student? @relation(fields: [resultingStudentId], references: [id], onDelete: SetNull)

  // Dedup per D68 Q4.a + Q8.a idempotency.
  @@unique([tenantId, applicantEmail, programId])
  @@unique([tenantId, applicantNationalId, programId])
  @@index([tenantId, status])
  @@index([userId])
  @@index([deletedAt])
}

model InstructorApplication {
  id                          String     @id @default(cuid())
  tenantId                    String
  userId                      String?
  departmentId                String?
  // Free-text department preference if applicant doesn't know the FK
  // (admin maps it on review). Parallel to StudentApplication.programId.
  preferredDepartmentSlug     String?

  applicantFullName           String
  applicantEmail              String
  applicantPhone              String?
  applicantNationalId         String?
  applicantBio                String?  @db.Text
  desiredRank                 InstructorRank?
  expertise                   String[]
  cvUrl                       String?

  applicantEmailVerifiedAt    DateTime?
  applicantPhoneVerifiedAt    DateTime?

  status                      AppStatus  @default(SUBMITTED)
  submittedAt                 DateTime   @default(now())
  decidedAt                   DateTime?
  decidedBy                   String?

  resultingInstructorId       String?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  createdBy String?
  updatedBy String?

  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  department   Department?  @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  instructor   Instructor?  @relation(fields: [resultingInstructorId], references: [id], onDelete: SetNull)

  @@unique([tenantId, applicantEmail, departmentId])
  @@unique([tenantId, applicantNationalId, departmentId])
  @@index([tenantId, status])
  @@index([userId])
  @@index([deletedAt])
}

model NotificationLog {
  id                String   @id @default(cuid())
  tenantId          String
  // What kind of notification was attempted. R3.b stub never sends —
  // R-Notif (post-Phase-B) flips status from "queued" → "sent" or "failed"
  // via an actual sender. For R3.b, status stays "queued" forever and
  // admin reads the body to see what *would* have gone out.
  kind              String   // "email" | "sms" | "in_app"
  template          String   // e.g. "application.submitted", "application.accepted"
  targetEmail       String?
  targetPhone       String?
  subject           String?
  body              String   @db.Text
  // FK references to the trigger source. Both nullable — same NotificationLog
  // table serves all future notification sources (R3.b applications for now;
  // R3.c grades, R3.d announcements later).
  studentApplicationId    String?
  instructorApplicationId String?
  userId            String?
  status            String   @default("queued")  // "queued" | "sent" | "failed"
  createdAt         DateTime @default(now())

  tenant                Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  studentApplication    StudentApplication?    @relation(fields: [studentApplicationId], references: [id], onDelete: SetNull)
  instructorApplication InstructorApplication? @relation(fields: [instructorApplicationId], references: [id], onDelete: SetNull)
  user                  User?                  @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([tenantId, createdAt])
  @@index([status])
  @@index([template])
}
```

### State machine (service layer)

```ts
// Shared AppStatus enum; two parallel ALLOWED_TRANSITIONS maps.
// Both are identical in structure — only the side-effect handlers differ
// (Student vs Instructor) on the ACCEPTED → ENROLLED transition.

const ALLOWED_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  SUBMITTED:    ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"],  // gated
  INTERVIEW:    ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED:     ["ENROLLED", "WITHDRAWN"],   // ENROLLED triggers side effect
  ENROLLED:     [],   // terminal
  REJECTED:     [],   // terminal
  WITHDRAWN:    [],   // terminal
};

// Q4.a caveat enforcement — the verification gate.
// Any forward transition FROM UNDER_REVIEW requires both
// applicantEmailVerifiedAt + applicantPhoneVerifiedAt set.
// Service-layer guard rejects with 400 + precise message
// listing which field is missing.

function assertVerifiedForReviewExit(app: { applicantEmailVerifiedAt: Date | null; applicantPhoneVerifiedAt: Date | null }) {
  const missing: string[] = [];
  if (!app.applicantEmailVerifiedAt) missing.push("email");
  if (!app.applicantPhoneVerifiedAt) missing.push("phone");
  if (missing.length > 0) {
    throw new BadRequestException(
      `cannot advance application past UNDER_REVIEW: applicant ${missing.join(" + ")} not verified (Q4.a caveat)`,
    );
  }
}
```

### Side effect — ACCEPTED → ENROLLED (transactional per Q5.a)

```ts
// Pseudocode for StudentApplication ENROLLED transition
await prisma.$transaction(async (tx) => {
  // 1. resolve User (reuse or create)
  let userId = app.userId;
  if (!userId) {
    const newUser = await tx.user.create({
      data: {
        tenantId: app.tenantId,
        email: app.applicantEmail.toLowerCase(),
        passwordHash: await hashPassword(generateSecurePassword()),
        fullName: app.applicantFullName,
        userRoles: { create: [{ roleId: studentRole.id }] },
      },
    });
    userId = newUser.id;
    // Queue a password-claim notification so the applicant can set their own password.
    await tx.notificationLog.create({
      data: {
        tenantId: app.tenantId, kind: "email", template: "user.password.claim",
        targetEmail: app.applicantEmail,
        subject: "حساب کاربری شما در دیجی‌یونیورسیتی ایجاد شد",
        body: `سلام ${app.applicantFullName}، ...`,
        userId, studentApplicationId: app.id, status: "queued",
      },
    });
  }
  // 2. create Student row
  const student = await tx.student.create({
    data: { tenantId: app.tenantId, userId, studentCode: nextStudentCode(),
            admissionDate: new Date(), status: "ENROLLED" },
  });
  // 3. create initial Enrollment in the program's default current offering (if any)
  //    OR skip if no current offering — admin enrolls manually later.
  //    Acceptable behavior: Student exists, Enrollment is deferred.
  // 4. update Application
  await tx.studentApplication.update({
    where: { id: app.id },
    data: { status: "ENROLLED", resultingStudentId: student.id, decidedAt: new Date(), decidedBy: actorUserId },
  });
});
```

Same pattern for InstructorApplication (creates User + Instructor + grants `instructor` role; no Enrollment).

### API surface (NestJS, R4 audit-lint compliant)

**Student applications:**
- `POST   /v1/applications/student`           — `@Public()` submit; idempotent on `(tenantId, applicantEmail, programId)`
- `GET    /v1/applications/student/me`        — `@SelfOrAdmin()` view own (any auth'd user; 404 if none)
- `POST   /v1/applications/student/:id/withdraw` — `@SelfOrAdmin({ userIdFrom: 'param' })` via app.userId lookup (or admin)
- `GET    /v1/applications/student`           — `@Roles("admin")` list (with `?status`, `?programId` filters)
- `GET    /v1/applications/student/:id`       — `@Roles("admin")` single
- `PATCH  /v1/applications/student/:id/verify-email` — `@Roles("admin")` set `applicantEmailVerifiedAt = now()`
- `PATCH  /v1/applications/student/:id/verify-phone` — `@Roles("admin")` set `applicantPhoneVerifiedAt = now()`
- `POST   /v1/applications/student/:id/transition` — `@Roles("admin")` state machine transition; UNDER_REVIEW gate enforced
- `DELETE /v1/applications/student/:id`       — `@Roles("admin")` soft-delete

**Instructor applications:** same shape under `/v1/applications/instructor/*`.

**NotificationLog (read-only stub):**
- `GET    /v1/notification-logs`              — `@Roles("admin")` list (with `?applicationId`, `?status`, `?template` filters)
- `GET    /v1/notification-logs/:id`          — `@Roles("admin")` single

### Admin UI (Q9.a — unified)

Single new page `/admin/applications`, **own per-route lazy chunk per D66 Path D**.

Layout:
- Type filter (tabs or chips): «دانشجو» / «استاد» / همه
- Status filter (chips per AppStatus value)
- Program / Department filter
- Table: applicant name, email, target (program / dept), status pill, submittedAt, action buttons
- Row click → drawer with full applicant snapshot + verification badges + transition controls (only legal next states shown, identical to R2 OfferingsPage pattern)
- Verification badges: ✉️ email-verified pill (green/grey) + ☎️ phone-verified pill; admin clicks to toggle (calls `verify-email` / `verify-phone` endpoint)
- ACCEPTED → ENROLLED action shows a confirmation listing what will be created (User if needed, Student/Instructor, optional Enrollment)

**Sidebar nav extension** (admin role, under «افراد» group from R3.a):
```ts
{ id: "admin/applications", t: "درخواست‌ها", ic: "inbox" },
```

### D12 + D18 spec coverage

`apps/web/tests/visual/phase-b-r3b-applications.spec.ts` (~320 LOC):

**D12 (4 assertions):**
- `/admin/applications` table renders + type + status filter pills
- Verification badges render with proper green/grey states
- Transition controls only show legal next-states per current state
- Drawer / row-detail surface shows applicant snapshot + decided-by/at metadata

**D18 / flow (7 assertions):**
- Parallel happy path: Student SUBMITTED → UNDER_REVIEW → INTERVIEW → ACCEPTED → ENROLLED (with both verification flags set)
- Illegal transition (e.g. ACCEPTED → SUBMITTED) rejects 400 with «Allowed from ACCEPTED: [ENROLLED, WITHDRAWN]»
- **Q4.a verification gate:** UNDER_REVIEW → INTERVIEW WITHOUT verification → 400 «applicant email + phone not verified (Q4.a caveat)»
- Set both flags → same transition succeeds 200
- **Side effect transactional:** ACCEPTED → ENROLLED on applicant with `userId=null` → User created + Student created + Application.resultingStudentId set + NotificationLog row for `user.password.claim` queued (all-or-nothing)
- WITHDRAW: applicant SelfOrAdmin can transition their own; cross-applicant attempt → 403
- Instructor application parallel: same matrix as above with role grant verification (resulting User has `instructor` role)

API e2e in `apps/api/test/applications-r3b.spec.ts` (~450 LOC) covers the matrix at the HTTP layer.

### Estimated scope

| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` | +160 (2 models + NotificationLog + 1 enum + reverse relations on 7 existing models) |
| `apps/api/prisma/migrations/20260529000000_phase_b_r3b_applications` | +130 SQL |
| `apps/api/src/identity/applications/applications-base.service.ts` (shared state machine + transactional helpers) | +260 |
| `apps/api/src/identity/applications/student-applications.*` (controller + service + DTOs + module) | +420 |
| `apps/api/src/identity/applications/instructor-applications.*` | +400 |
| `apps/api/src/identity/notifications/notification-log.*` (model wrapper + read controller + stub writer service) | +220 |
| `apps/api/src/prisma/seed.ts` extension (1 sample SUBMITTED student app + 1 ACCEPTED instructor app) | +90 |
| `apps/api/test/applications-r3b.spec.ts` | +450 |
| `apps/web/src/api/endpoints.js` extension (`applicationsApi`, `notificationLogsApi`) | +100 |
| `apps/web/src/pages/admin/ApplicationsPage.tsx` | +480 |
| `apps/web/src/sidenav.tsx` extension | +3 |
| `apps/web/src/router.tsx` (1 new lazy route, NO bucket per D66) | +5 |
| `apps/web/tests/visual/phase-b-r3b-applications.spec.ts` | +320 |
| `docs/PHASE_B_R3_B_REVIEW.md` (post-ship) | +240 |

**Total: ~3,278 LOC.** Aligns with R3.a's 3,517.

**Timeline: 6-7 days** (state-machine service-layer + transactional side effect + verification gate add complexity vs R3.a's pure CRUD; matches R2's cadence of 7 days).

### Commit ordering (atomic per D61 Constraint #1)

1. **A** — Prisma schema (2 application models + NotificationLog + AppStatus + reverse relations) + migration SQL + seed (sample SUBMITTED student app + sample ACCEPTED instructor app for D13 smoke)
2. **B** — NestJS `ApplicationsBaseService` (shared state machine + verification gate + transactional side-effect helpers) + Notification stub writer service (no actual sender)
3. **C** — NestJS `StudentApplicationsModule` (controller + service + DTOs) — includes public POST + SelfOrAdmin GET/me + WITHDRAW + admin list/get/transition/verify-email/verify-phone/soft-delete
4. **D** — NestJS `InstructorApplicationsModule` (parallel shape; differs only in Q6.a ENROLLED side effect granting `instructor` role)
5. **E** — NestJS `NotificationLogModule` (admin read-only list + getById)
6. **F** — API e2e spec (`applications-r3b.spec.ts`) — parallel state machine + illegal transitions + Q4.a gate + side effect transactional + cross-tenant + SelfOrAdmin matrix + idempotency + WITHDRAW
7. **G** — Frontend `endpoints.js` extension + sidebar nav extension
8. **H** — Admin `ApplicationsPage` (unified table + type/status filters + drawer + transition controls + verification badges) + router lazy registration + D12+D18 visual spec
9. **I** — Review doc (`PHASE_B_R3_B_REVIEW.md`) + bundle measurement + single complete-evidence ping

9 atomic commits. Tighter than R3.a's 12 because the single admin page + base service share infrastructure.

---

## What's OUT of scope for R3.b

- ❌ Actual email/SMS sender — R-Notif post-Phase-B (NotificationLog is a write-only stub for R3.b)
- ❌ Applicant-facing self-service UI (apply / view-status / withdraw via browser) — applicants interact with API only in R3.b; UX page deferred to R-Identity-Applicant-UX
- ❌ Email-token + SMS-OTP self-verification flow — Q3.a defers to R3.b.1 or R-Notif (admin can manually set verified-flags via PATCH for now)
- ❌ Bulk admin actions (multi-select transition / multi-select reject) — single-row only in R3.b
- ❌ Application analytics / funnel reporting — separate analytics R
- ❌ ACCEPTED → auto-Enrollment in a specific CourseOffering — side effect creates Student row only; admin enrolls manually via R-Enrollments
- ❌ File upload for CV / supporting docs — `cvUrl` is a URL field; upload pipeline post-Phase-B
- ❌ Interview scheduling / calendar integration — INTERVIEW status is informational only in R3.b

---

## Performance budget per D61 + D66 lessons

- **Main bundle delta target < 50 KB.** Baseline (R3.a production deploy from D70 reference): expected ≈354-380 KB depending on local build env.
- **Per-route chunking pattern from D66 Path D mandatory.** NO admin manualChunks bucket. ApplicationsPage = its own lazy chunk.
- **Post-deploy bundle measurement REQUIRED** in `PHASE_B_R3_B_REVIEW.md`:
  - Main `index-*.js` delta vs R3.a baseline
  - New per-route chunk: `ApplicationsPage-*.js` (target < 30 KB given drawer + table + 2 transition modals)
  - Modulepreload verification on `/`, `/login`, `/programs` — only vendor chunks
- **Proactive ping** if main delta > 40 KB OR ApplicationsPage chunk > 25 KB (early warning, not stop).

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Public POST endpoint could be spammed (no auth) | Throttler already provides per-IP rate limit (apps/api app.module.ts ThrottlerGuard); idempotency on `(tenantId, applicantEmail, programId)` deduplicates retries; admin can soft-delete spam apps |
| Side effect transaction fails partway (e.g., User creation OK, Enrollment fails) | `prisma.$transaction(...)` rolls back atomically. If `(tenantId, email)` collides on User creation, transaction aborts, application stays in ACCEPTED — admin retries with manual user-link path (future endpoint) |
| Verification gate bypass via direct DB / migrations | Service-layer guard is the only enforcement; admins with DB access could bypass. Acceptable for R3.b (R-Notif adds the actual verification flow which makes bypass a moot user-facing concern) |
| NotificationLog table grows unbounded | Each transition writes 1-2 rows; ~10 rows per full Application lifecycle. At 10k applications / year ≈ 100k rows / year. Indexed on `(tenantId, createdAt)` for retention queries; archival policy deferred to R-Notif |
| Two parallel application controllers duplicate code | `ApplicationsBaseService` extracts the shared state-machine + verification-gate + transactional helpers; concrete services subclass and override the ENROLLED side effect only. Tested via e2e for both paths in Commit F |
| /admin/applications drawer + state-machine + verification badges could push the chunk over 30 KB | Per-route lazy already isolated. If approached, lazy-load the drawer body via React.lazy at the page level (one additional micro-chunk) |
| Existing applicants who later register (different account, same email) | Q5.a says reuse User if `(tenantId, email)` match at ENROLLED time. If userId is set on the Application AND a different User exists with the same email, the create-User branch throws P2002 → transaction aborts, admin sees the error and resolves manually |
| InstructorApplication.preferredDepartmentSlug doesn't match any real Department | Admin manually sets `departmentId` via update before transitioning to ACCEPTED; until then, the field is informational only |

---

## Verification plan

### Pre-deploy
- `tsc --noEmit` clean (api + web)
- `prisma validate` clean + `prisma generate` clean
- Local Prisma migrate dev applies cleanly on fresh DB
- `npm run test` green
- D12+D18 spec green
- Existing R-Landing-v2 + R7.x + Phase-A + R1 + R2 + R3.a specs all still green (regression sweep)

### Post-deploy
- API smoke (10 steps):
  1. Public POST application/student succeeds 201
  2. Re-POST same email+program → returns existing id (idempotent)
  3. Admin GET list shows it
  4. Transition SUBMITTED → UNDER_REVIEW OK
  5. Transition UNDER_REVIEW → INTERVIEW fails 400 (verification gate)
  6. Admin verify-email + verify-phone, then transition → 200
  7. INTERVIEW → ACCEPTED → ENROLLED — verify User + Student + NotificationLog rows created in DB
  8. Illegal transition (ENROLLED → SUBMITTED) rejects 400
  9. WITHDRAW on a SUBMITTED app via applicant token (use SelfOrAdmin path)
  10. Cross-tenant attempt rejected
- D29 Chrome Extension pre-smoke on `/admin/applications`
- Bundle measurement curl → admin chunks absent from modulepreload
- AuditLog populated for every transition (verify via `/v1/audit/logs` admin endpoint)

### D13 owner smoke checklist (8 step, mobile + incognito + hard reload) — **with D70 explicit delete clause**

1. **Login as admin** (admin@digiuniversity.ir / ChangeMe!2026, tenant `demo`)
2. **/admin/applications** — table renders, type filter + status filter + program filter work, row count matches API
3. **Create test application via curl** (or use the seed sample) — refresh page, appears at top
4. **Verification badges** — both grey on SUBMITTED app; click ✉️ → turns green; click ☎️ → turns green
5. **Forward state machine**: SUBMITTED → UNDER_REVIEW → INTERVIEW → ACCEPTED → ENROLLED. At each step, verify only legal next-states show as buttons. On UNDER_REVIEW with one badge un-verified, attempt INTERVIEW → 400 surface with the Q4.a message.
6. **ENROLLED side effect verification**: after the ENROLLED transition for an app with `userId=null`, check (a) the newly-created User is visible at `/admin/profiles`, (b) a Student row exists at `/admin/students`, (c) a NotificationLog entry for `user.password.claim` exists at `/admin/notifications` (or via API GET if no UI surface for this)
7. **WITHDRAW + explicit delete (per D70 lesson)**: as applicant token, POST .../withdraw on a SUBMITTED app — status → WITHDRAWN. Then as admin, DELETE the WITHDRAWN application — row disappears; refresh; admin GET shows 404
8. **Phase A + R1 + R2 + R3.a routes untouched**: /, /login, /classroom, /dashboard, /admin/students etc. all render normally; Network tab on `/` (anon, incognito) shows no `ApplicationsPage-*.js` preloaded — admin chunk truly lazy

---

## Status

| Item | Status |
|---|---|
| Memo | ✅ this file |
| Schema discovery | ✅ all greenfield + additive reverse relations |
| Owner ack on R3.b memo | ⏳ pending — needs Q1–Q9 decisions |
| Code (Commits A–I) | ⏳ NOT STARTED |
| Spec | ⏳ post-ack |
| D29 pre-smoke | ⏳ post-deploy |
| Bundle measurement | ⏳ post-deploy |
| D13 owner smoke (incl. D70 explicit delete clause) | ⏳ post-deploy |
| R3.b retrospective (Phase B retrospective entry for D70 lesson + R3.b lessons) | ⏳ post-D13 |

**Re-ack format:** «Q1.x Q2.x Q3.x Q4.x Q5.x Q6.x Q7.x Q8.x Q9.x شروع» (or list edits / overrides).
If all defaults accepted, equivalent to: «Q1.a Q2.a Q3.a Q4.a Q5.a Q6.a Q7.a Q8.a Q9.a شروع».

— Phase B R3.b kickoff, 2026-05-27. R3.a closed per D70. D69 SelfOrAdmin primitive + audit semantic operational. Awaiting memo ack to begin code.
