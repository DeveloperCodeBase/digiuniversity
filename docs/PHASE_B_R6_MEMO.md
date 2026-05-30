# Phase B R6 — Applicant Self-Service UX (Candidate C) — Scoped Memo

**Author:** Phase B (post-D79)
**Date:** 2026-05-30
**Status:** ⏳ DRAFT — awaiting owner ack on Q-decisions. **No code until ack** (D61 #1).
**Direction:** D79 — R6 = Candidate C; sequence C → R-CI-Cleanup → A.
**Predecessors:** R3.a (Identity foundation, D70), R3.b (Applications + public submit + state machine, D72), R4 (Enrollment lifecycle, D75), R5 (deploy-and-smoke.ps1, D78).
**Workflow:** this scoped memo → owner picks Q-options → ack → code (Commit A migration first) → spec → deploy via `deploy-and-smoke.ps1` → D29 → D13 → close.

---

## 0. Purpose & headline finding

Candidate C turns the **admin-only** application backend (R3.b/R4) into a **public front door**: a real applicant visits a page (no login), submits an application, and can later check status + withdraw. This closes Phase B (Onboarding) per Compass.

The mandatory schema+code discovery (Phase B lesson #1) surfaced **one finding that changes the shape of C** and was *not* anticipated in the planning memo:

> **⚠ The R3.b "self-service" endpoints (`GET …/me`, `POST …/:id/withdraw`) cannot serve an anonymous applicant.** Both require a JWT, and `withdrawSelf` additionally requires `app.userId === actor.userId`. But an applicant has **no User account until ENROLLED** — `StudentApplication.userId` is `null` from SUBMITTED through ACCEPTED (the `find-or-create-or-link` only runs in the ACCEPTED→ENROLLED side effect). So today, **only an admin (or an applicant who happened to submit while already logged in) can read or withdraw an application.** A true anonymous applicant has no way to track or withdraw what they submitted.

This makes "status page + withdraw button for anon applicants" a genuine design decision (Q2 below), not a wiring exercise. Everything else (the form itself) is well-supported by the existing public submit endpoint.

---

## 1. Schema + code discovery (Phase B lesson #1 — mandatory pre-write)

### 1.1 What already exists (read this session — file:line)

| Area | Fact | Source |
|---|---|---|
| **AppStatus enum** | `SUBMITTED, UNDER_REVIEW, INTERVIEW, ACCEPTED, ENROLLED, REJECTED, WITHDRAWN` | `schema.prisma:1149` |
| **State machine** | `SUBMITTED→{UNDER_REVIEW,WITHDRAWN}`, `UNDER_REVIEW→{INTERVIEW,ACCEPTED,REJECTED,WITHDRAWN}`, `INTERVIEW→{ACCEPTED,REJECTED,WITHDRAWN}`, `ACCEPTED→{ENROLLED,WITHDRAWN}`, terminals `ENROLLED/REJECTED/WITHDRAWN→[]` | `applications.types.ts:35-43` |
| **Public submit (student)** | `@Public() @Throttle(5/IP/hr) @Post()` → resolves tenantSlug, calls `submitPublic`, 201 (new) / 200 (`_idempotent`) | `student-applications.controller.ts` |
| **Public submit (instructor)** | Parallel `@Public() @Throttle @Post()`, passes `actorUserId: null` | `instructor-applications.controller.ts:102-132` |
| **`submitPublic`** | Idempotent on `(tenantId, applicantEmail, programId)`; creates row `status:SUBMITTED`, `userId: actorUserId ?? null`; queues `application.submitted` NotificationLog stub; calls spam-flag | `student-applications.service.ts:279-367` |
| **Spam stub** | `maybeFlagSpam`: >3 submissions/email/hr → queue `application.spam.suspected` NotificationLog (dedup per app) | `student-applications.service.ts:369-410` |
| **`getOwn` (`/me`)** | Matches by `userId` — **404 for anon** (no User, `app.userId` null) | `student-applications.service.ts:416-425` |
| **`withdrawSelf`** | SelfOrAdmin: throws `Forbidden` unless admin **or** `app.userId === actor.userId`; then routes through `transition(...,"WITHDRAWN")` | `student-applications.service.ts:438-459` |
| **Verification gate** | Forward exits from `UNDER_REVIEW` require BOTH `applicantEmailVerifiedAt` + `applicantPhoneVerifiedAt`. **Admin-set only** (`@Roles("admin")` verify-email/verify-phone); self-verify UX "defers to R-Notif per D71 Q3.a" | `service.ts:214-250`, `controller` `@Roles` |
| **ENROLLED side effect** | `find-or-create-or-link` User at enroll time; sets `resultingStudentId` (+ `resultingEnrollmentId` if `targetOfferingId`) | `application-enrollment.service.ts:84-187` |
| **`userId` nullability** | `StudentApplication.userId String?` — null until ENROLLED | `schema.prisma:1159+`, `enrollment svc:165-176` |
| **Web API client** | `studentApplicationsApi` + `instructorApplicationsApi` exist; `publicSubmit` uses `publicApi` (no auth), `getOwn`/`withdraw` use `api` (JWT) | `endpoints.js:339-397` |
| **`publicApi`** | `apiPublic = rawFetch` — **no `Authorization` header, no credentials** | `client.js:140-165` |
| **Route classification** | `PUBLIC = {"",home,programs,about,pricing,admissions,help,honor-code}`; `AUTH_FLOW = {login,register,forgot,verify-email,2fa-setup,onboarding}`; **WORKSPACE = everything else (deny-by-default)** | `route-classification.ts:7-31` |
| **AppShell auth gate** | `if (isWorkspace && !auth.isAuthenticated) go("login")` + holding skeleton | `AppShell.tsx:128-138` |
| **AppShell chrome** | PUBLIC → global `<Nav mode="public">` + `<Footer>`. Landing (`/`,`/home`) special-cased to *skip* global Nav (Home renders its own — the D49 dual-nav fix) | `AppShell.tsx:148-166,228` |
| **Per-route lazy** | `React.lazy(() => import(...))` per page; eager = Home/Programs/Admissions/Auth only (cold-paint) | `router.tsx:70-177` |
| **/admissions today** | PUBLIC marketing mockup — a 5-step progress UI, **no real form, no API call** | `pages/Admissions.tsx` |

### 1.2 Schema change classification (process reminder: §2 greenfield / §3 modification / §4 additive)

**For the recommended path (Q2.b — token-based anon tracking):**

| Model | Change | Class |
|---|---|---|
| `StudentApplication` | **ADD** `trackingToken String? @unique` | §4 additive |
| `InstructorApplication` | **ADD** `trackingToken String? @unique` | §4 additive |

No greenfield tables. No column modifications. **One hand-authored migration** (Commit A) adds two nullable unique columns + backfill is unnecessary (null for legacy rows; admins already track those via the inbox). Migration is reversible (drop columns).

> **If the owner picks Q2.a (defer tracking) instead → ZERO schema change** (pure frontend; the form reuses the existing `publicSubmit` only). The schema table above applies *only* if Q2.b/Q2.c is chosen.

---

## 2. Scope C — what ships

Three applicant-facing surfaces, all **anonymous (no login)**, plus a small backend slice to make anon tracking possible:

1. **`/apply` — the public application form** (anon WRITE route).
   - Student variant (program picker, full name, email, phone, national id, bio) + Instructor variant (adds preferred department, desired rank, expertise tags, CV URL). Field constraints mirror the existing `class-validator` DTOs.
   - Submits via `publicApi` (no auth). Handles 201 (new) and 200 (`_idempotent` — "you already applied; here's your existing reference").
   - On success → **confirmation state** (Q5): reference id + tracking link + "what happens next" timeline + the `application.submitted` email note.

2. **`/track` — token status page** (anon READ + the one anon WRITE: withdraw).
   - Reads status by tracking token (Q2.b). Renders the full lifecycle as a read-only stepper (SUBMITTED → … → ENROLLED) with the current state highlighted.
   - **Withdraw button** — the only applicant-triggerable action; enabled only on non-terminal states (per the state machine §6). Confirm dialog → `WITHDRAWN`.

3. **Backend slice (Q2.b)** — `trackingToken` generation in `submitPublic` (both services) + two new `@Public @Throttle` endpoints per type: `GET …/track?token=` (status) and `POST …/track/withdraw` (token-gated withdraw). Reuses the existing `transition(...,"WITHDRAWN")` path so state-machine validation stays in one place.

**Explicitly OUT of scope for R6 (deferred, consistent with R3.b's deferrals):**
- **Applicant self-verification** of email/phone (token redemption). Verification stays admin-set; defers to R-Notif (Q3). The form *collects* email/phone; it does not verify them.
- **Email delivery** of the tracking link / claim. R6 shows the link on-screen + "save this link"; R-Notif emails it later. R6 has **no dependency on R-Notif**.
- **Account claim** landing page (password set). Stays an R-Notif concern; the ENROLLED side effect already queues the `user.password.claim` stub.

---

## 3. Q-decisions

> Q1 is the owner-staged headline (anon route in AppShell). **Q2 is the discovery surprise** (§0) and is arguably the bigger call — please weigh it first in practice even though it's numbered second.

### Q1 — How is the anon applicant route classified in AppShell? *(owner-staged headline)*
- **Q1.a (Recommended)** — Classify `/apply` + `/track` as **PUBLIC** (add their ids to `PUBLIC_ROUTE_IDS`, `route-classification.ts`). They get the standard public `<Nav>` + `<Footer>` chrome, exactly like `/programs` and `/admissions`. **No new `RouteKind`. No AppShell branch. No auth-gate conflict** (PUBLIC never trips `isWorkspace && !authed`). **No dual-nav risk** — only the landing route is Nav-special-cased; `/apply` uses the one global Nav.
  - *Note — correcting the brief's wording:* the brief called this the "first anon **workspace** route." Architecturally it must **not** be WORKSPACE (WORKSPACE forces a login redirect, `AppShell.tsx:129`). It is a **PUBLIC-classified anon route**. What's genuinely new is that it's the first anon **write** route (a form that POSTs), where existing PUBLIC routes are anon **read** (marketing). The novelty is the attack surface (§4), not the routing mechanism.
- **Q1.b** — Introduce a 4th `RouteKind` `ANON_FORM` with minimal chrome (logo only, no full Nav/Footer) for a distraction-free form. More focused UX, but adds a classification dimension + an AppShell branch — reintroduces exactly the kind of chrome-composition surface that caused the R-Landing-v2 dual-nav bug. Higher risk for marginal UX gain.

### Q2 — How does an anon applicant track + withdraw without an account? *(⚠ discovery surprise — see §0)*
- **Q2.a** — **Defer tracking + withdraw to R-Notif; R6 ships submit + confirmation only.** Zero backend, zero schema. Honest and minimal, but under-delivers the planning memo's promise (it promised a status page + withdraw button), and leaves the "self-service" front door as submit-only.
- **Q2.b (Recommended)** — **Token-based anon tracking.** `submitPublic` mints a high-entropy `trackingToken`; the confirmation page shows a `/track?token=…` link ("save this link"). New `@Public @Throttle` `GET …/track` (status) + `POST …/track/withdraw`. Delivers the full candidate vision; small, well-bounded backend slice (§1.2 = two nullable columns + 2 endpoints/type reusing existing service logic); **no R-Notif dependency** (link shown on-screen now, emailed later). Bonus: the migration makes R6 a migration-bearing deploy → exercises `deploy-and-smoke.ps1`'s migration gate fully (a *complete* R5 Phase-2 first run, not the no-op path).
- **Q2.c** — Pull R-Notif's email-link/account-claim forward into R6 so tracking is via a real authed account. Largest lift; drags R-Notif scope into C; rejected (breaks the C→R-CI→A sequence intent).

### Q3 — Applicant self-verification of email/phone?
- **Q3.a (Recommended)** — **Defer; keep verification admin-set** (R3.b's explicit position — "self-verification UX defers to R-Notif per D71 Q3.a"). The form collects email/phone as plain fields; the verification gate (`UNDER_REVIEW`→forward) is unchanged and still satisfied by admins (or R-Notif later). R6 does not touch the gate.
- **Q3.b** — Build self-verify now (email/phone token redemption + landing page). This is effectively half of R-Notif; rejected for R6.

### Q4 — Student-only, or Student + Instructor forms?
- **Q4.a (Recommended)** — **Both.** Backends + web API clients are symmetric and already exist (`endpoints.js:339-397`); the form is parameterized by type, with the instructor variant adding rank/expertise/cvUrl fields. Marginal extra cost; delivers the complete front door (Phase B Onboarding covers both intake paths).
- **Q4.b** — Student-only for R6; instructor form follows. Shrinks ~400–500 LOC; leaves the instructor public path admin-only a bit longer.

### Q5 — Post-submit confirmation + how the applicant gets their tracking handle
- **Q5.a (Recommended)** — Confirmation page shows: the **reference id**, the **`/track` tracking link** (Q2.b token URL) with a "save/copy this link — we'll also email it once notifications launch" note, and a **what-happens-next timeline** (review ~14 days, verification, decision). Idempotent re-submit (200) routes to the same confirmation with the existing reference.
- **Q5.b** — Minimal confirmation (reference id + "we'll email you") with no on-screen tracking link. Smaller, but strands the Q2.b token (applicant can't reach `/track` until R-Notif emails it) — undercuts Q2.b's value.

---

## 4. First anon-WRITE-route caution (IMPORTANT)

All existing PUBLIC routes are anon **reads** (marketing). `/apply` + `/track` are the first anon routes that **accept input and mutate state**. Each concern, with how it's handled:

- **Routing / AppShell auth-gating** — Resolved by Q1.a: PUBLIC classification means the auth gate (`AppShell.tsx:128-138`) never fires and no login is forced. **Confirmed no dual-nav risk** (only landing is Nav-special-cased; `AppShell.tsx:155`). An authed user *may* also see `/apply` (PUBLIC routes aren't authed-redirected except landing) — acceptable; the public submit treats everyone as anon (`actorUserId: null`), so an authed visitor simply submits like anyone else.
- **Rate-limit** — Reuse `@Throttle(5/IP/hr)` on submit (exists, `controller`/`SUBMIT_THROTTLE`). Add throttles on the new public track endpoints: status read modest (e.g. 30/IP/hr), `track/withdraw` strict (e.g. 5/IP/hr). All limits stated in the memo, enforced in Commit B.
- **Spam** — The `maybeFlagSpam` stub already fires on submit (`service.ts:369-410`, >3/email/hr → admin-visible NotificationLog). Reused unchanged; no new spam logic in R6 (R-Notif promotes it later).
- **CSRF / token security** — `publicApi` sends **no cookie and no `Authorization`** (`client.js:140-165`), so classic session-riding CSRF does not apply. `track/withdraw` is a **bearer-capability** POST — the token *is* the authorization. Requirements (Commit B): `trackingToken` ≥128-bit from `crypto`, `@unique`, non-sequential/non-enumerable; the token grants **read of the applicant's own submitted fields only** (no cross-applicant leak — scoped by the unique token) and **withdraw only** (it can trigger `WITHDRAWN` and nothing else — never a forward/admin transition). Tokens never logged.
- **Input validation** — The web form mirrors the existing server DTO constraints (lengths, email format, national-id length, expertise array caps — `controller` DTOs). Server validation is authoritative and unchanged; the client mirror is UX-only.
- **Tenant** — The public submit resolves `tenantSlug → tenantId` server-side (`controller`). The web app supplies its configured tenant slug (single-tenant prod). Stated where the slug is sourced in Commit C.

---

## 5. Performance budget (D66 Path D)

- **Per-route lazy, no shared bucket.** `/apply` + `/track` ship as their **own `React.lazy` chunks** (`ApplyPage-<hash>.js`, `TrackPage-<hash>.js`), following the workspace-page pattern (`router.tsx:107-177`). They are **not** added to the eager set (Home/Programs/Admissions/Auth) — an applicant form is not cold-paint-critical, so a brief Suspense fallback is acceptable. **No admin/shared `manualChunks` bucket** (D66 Path D).
- **Main-bundle Δ target ≈ 0 KiB** (form/track code is lazy; only the route-table entries + the tiny API-client additions touch the main chunk). Hard gate: warn +40 KiB, **fail +50 KiB** (D61 #2), measured post-deploy by `deploy-and-smoke.ps1` step 8.6 against `BUNDLE_BASELINE.json` (`mainBundle.sizeBytes = 392947`).
- **modulepreload allow-list (8.5):** the anon shell may preload only `react-vendor` + `radix-vendor`. `/apply` may use Radix primitives (Select/Dialog) — already allowed. The lazy `ApplyPage`/`TrackPage` chunks are **not** static imports of the entry, so they will **not** appear in the landing modulepreload — the D66 leak guard stays green. (Verified by the existing 8.5 check; any leak fails the deploy at exit 30.)

---

## 6. State machine — applicant-facing subset

The applicant can trigger exactly **two** transitions; everything else is admin (R3.b). Reuses `ALLOWED_TRANSITIONS` (`applications.types.ts:35-43`) unchanged — R6 adds **no** new states or edges, it only exposes a *subset* to anon callers.

| From (current) | Applicant action available | Result |
|---|---|---|
| (none) → SUBMITTED | **Submit** (`/apply`) | new row, `SUBMITTED` |
| SUBMITTED | **Withdraw** | `WITHDRAWN` |
| UNDER_REVIEW | **Withdraw** | `WITHDRAWN` |
| INTERVIEW | **Withdraw** | `WITHDRAWN` |
| ACCEPTED | **Withdraw** | `WITHDRAWN` |
| ENROLLED / REJECTED / WITHDRAWN | *(none — terminal)* | Withdraw button hidden/disabled |

- The `/track` page **displays** the full status (read), but the only **action** is Withdraw, gated to the 4 non-terminal states (matches `WITHDRAWN ∈ ALLOWED_TRANSITIONS[from]` for those states). On terminals the button is disabled with a reason.
- `track/withdraw` server-side still goes through `transition(...,"WITHDRAWN")`, so an illegal withdraw (terminal state) returns the canonical 400 — defense in depth even if the UI is bypassed.
- Forward transitions (UNDER_REVIEW, INTERVIEW, ACCEPTED, ENROLLED, REJECTED) remain **admin-only** via the inbox — R6 does not expose them.

---

## 7. D18 flow assertion — the applicant journey

A single Playwright flow spec asserts the **multi-step journey** end-to-end (not just "form renders"):

1. Visit `/apply` (anon, no auth redirect) → form renders with the program picker populated.
2. Fill + submit → 201 → confirmation state shows a reference id **and** a `/track?token=…` link.
3. Navigate to the `/track` link → status reads **SUBMITTED**, lifecycle stepper highlights step 1, Withdraw enabled.
4. Click Withdraw → confirm → status flips to **WITHDRAWN**, Withdraw now disabled (terminal).
5. (Negative) Re-submit same (email, program) → 200 `_idempotent` → confirmation routes to the *same* reference (no duplicate row).

Per the visual-assertion contract (memory): each visible claim asserts DOM presence + computed style + in-viewport position + no-overlap + snapshot diff ≤0.1%. `toBeVisible()` alone is not sufficient.

---

## 8. D13 manual-smoke checklist (explicit withdraw per D70; deploy via deploy-and-smoke.ps1)

Per-surface create / read / **destroy**, with the destructive op explicit (D70):

- **`/apply` (student)** — submit a new application (create) → land on confirmation (read the reference + token link).
- **`/apply` (instructor)** — submit instructor variant (create) → confirmation.
- **`/track`** — open the token link (read status) → **Withdraw** (the D70 explicit destructive op — the applicant's "delete"-equivalent) → confirm status `WITHDRAWN` → button disabled.
- **Idempotency** — re-submit same (email, program) → 200, same reference (no dup).
- **Admin cross-check** — the new rows appear in `/admin/applications`; admin soft-delete still works (existing R3.b destroy path, unchanged).
- **Negative** — withdraw on an already-terminal token → 400; bad/forged token → 404 (no leak).

**Deploy mechanics (R5 Phase 2 — first real run):** deploy with the **one** command —
```
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-and-smoke.ps1 -Yes
```
The script runs build → up → **migrate** → seed → health → smoke → bundle. Because Commit A adds a migration, the **migration gate (step 2)** fires (warn + countdown, proceeds under `-Yes`) and **8.2 `prisma migrate status`** confirms it applied — exercising the gate path, not just the no-op path. Owner's only manual step is the **~2-min mobile visual** of `/apply` + `/track`.

---

## 9. R5 Phase 2 — this is the trigger

Per D78/D79, **R6 is the first sub-R to deploy via `deploy-and-smoke.ps1`.** A clean run (exit 0; or a green run with documented warnings) **closes R5 D13 Phase 2** concurrently with R6. Because R6 carries a migration (Q2.b), this is a *complete* first exercise of the script — migration gate (step 2) + post-deploy `prisma migrate status` (8.2) both run for real, not the `-DryRun`/no-migration path that Phase 1 dogfooded. The R6 review doc records the script's report (exit code + bundle delta + smoke results) as the R5 Phase-2 evidence.

---

## 10. Estimated LOC, timeline, atomic commits

**Estimate (recommended path: Q1.a + Q2.b + Q3.a + Q4.a + Q5.a):** ~2,800–3,400 LOC, **5–7 days**. (Planning memo said ~2,500–3,000 — the +token backend slice accounts for the delta.) If the owner picks Q2.a (defer tracking) and/or Q4.b (student-only), subtract ~700–1,000 LOC and ~1.5 days.

| Commit | Contents | Gates |
|---|---|---|
| **A — schema + migration** | Add `trackingToken String? @unique` to `StudentApplication` + `InstructorApplication`; **hand-authored migration SQL**; `prisma validate` + `generate`. (Migration-bearing → drives §8's migration gate.) | `tsc --noEmit`, `prisma validate`, `prisma generate` clean |
| **B — backend slice** | `trackingToken` minting in `submitPublic` (both services, ≥128-bit `crypto`); `getByToken` + `withdrawByToken` service methods (reuse `transition(...,"WITHDRAWN")`); `@Public @Throttle` `GET …/track` + `POST …/track/withdraw` (both types); unit + e2e spec (incl. forged-token 404, terminal-withdraw 400). | tsc, API e2e green |
| **C — apply form** | `studentApplicationsApi`/`instructorApplicationsApi` already exist — add `getByToken`/`withdrawByToken` (~40 LOC); `/apply` page (student + instructor variants, client-mirror validation, submit→confirmation Q5.a); route + PUBLIC classification (Q1.a). | tsc, web build |
| **D — track page + flow** | `/track` token status page (read-only lifecycle stepper + Withdraw §6); confirmation/timeline polish; **D18 flow spec** (§7). | tsc, flow spec green |
| **E — close-out** | D29 e2e sweep; **D13 run via `deploy-and-smoke.ps1`** (§8) = R5 Phase-2 evidence; review doc with bundle delta (§5) + the script report; bundle measured post-deploy. | full smoke green, exit 0 |

Each commit ends `tsc --noEmit` + (where schema touched) `prisma validate`/`generate` clean, per the settled contract.

---

## 11. Ack format

Reply with the chosen options, e.g.:
> «R6 = Q1.a + Q2.b + Q3.a + Q4.a + Q5.a، شروع code از Commit A»

or override any Q (e.g. «Q2.a» to ship submit-only and defer tracking, «Q4.b» for student-first). On ack, code starts at **Commit A (migration)**; nothing before ack (D61 #1).

---

— Phase B R6 scoped memo, 2026-05-30. Headline: anon applicants can't use R3.b's `/me`+`/withdraw` (no User until ENROLLED); Q2 decides how anon tracking works. Recommended blend delivers the full front door + closes Phase B + closes R5 D13 Phase 2 on a migration-bearing first real deploy.
