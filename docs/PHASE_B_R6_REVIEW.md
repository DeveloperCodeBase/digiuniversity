# Phase B R6 — Applicant Self-Service UX (Candidate C) — Review & Deploy

**Author:** Phase B (R6 execution)
**Date:** 2026-05-30
**Decisions:** D79 (direction) · D80 (Q-answers + entropy) · D81 (audit-lint) · D82 (public programs)
**Memo:** `docs/PHASE_B_R6_MEMO.md`
**Status:** code shipped (commits A–E); deploy via `deploy-and-smoke.ps1` (R5 Phase-2) — evidence in §7.

---

## 1. What shipped

The admin-only application backend (R3.b/R4) now has a real **public front door**: an anonymous applicant can submit, track status, and withdraw — no login.

| Commit | SHA | Contents |
|---|---|---|
| A | `ef54747` | `trackingToken String? @unique` on both application models + hand-authored §4-additive migration |
| B | `3cc3949` | App-level 192-bit token mint in `submitPublic`; `getByToken` (PII-masked) + `withdrawByToken` (reuses the transition state machine); `@Public @Throttle` `GET /track` + `POST /track/withdraw` (both types); **green-all-4** audit-lint fix; Jest e2e spec |
| C | `35b2312` | `@Public GET /v1/programs/public` catalog read; `/apply` PUBLIC route, student + instructor variants, confirmation (reference + `/track` link + timeline) |
| D | `b3085ce` | `/track` PUBLIC page (masked view, lifecycle stepper, gated withdraw); `trackByToken`/`withdrawByToken` web client; **D18 flow spec** |
| E | _this_ | review doc + deploy via `deploy-and-smoke.ps1` (R5 Phase-2) |

---

## 2. Discovery catches (Phase B lesson #1 in action)

R6 surfaced four pre-code findings, each stopped-and-acked before code (D61 discipline):

1. **D80 — anon-tracking gap (5th catch):** R3.b's `/me` + `/withdraw` need a JWT + `app.userId === actor.userId`, but an applicant has **no User until ENROLLED**. So anon status/withdraw was structurally unsupported → resolved with the token mechanism (Q2.b).
2. **D80 addendum — entropy floor (6th catch):** no Prisma/Postgres `@default` reaches the ≥128-bit hardening floor (uuid v4 = 122-bit; cuid not crypto-random). → app-level `crypto.randomBytes(24).toString("base64url")` = **192-bit**, reusing the `generateSecurePassword` pattern.
3. **D81 — audit-lint silently red (catch):** R3.b's `submit` handlers had the `@AuditSkip` *comment* but never the decorator; the lint runs only in `pretest`, not in the deploy path, so it was red while deploys went green. → **green-all-4** (R3.b's 2 + R6's 2). Lesson: deploy-path and test-path gates diverged — R-CI must unify them.
4. **D82 — public-catalog dependency (7th catch):** the anon student picker needs real program IDs, but `GET /programs` is authed and the marketing page is static. → small `@Public` catalog read. Lesson: anon-feature discovery must check *all* data dependencies for public-accessibility.

---

## 3. Security posture (Q2.b hardening, D80)

- **Token:** 192-bit, URL-safe, app-level mint; `@unique` + regenerate-on-P2002 (≤3). The token is a bearer capability shown on the confirmation page (primary access mechanism; R-Notif will email it later).
- **PII-mask** on `GET /track`: `nationalId` omitted entirely; internal ids dropped; email + phone masked (`ma***@…`, `***6789`); only `status + reference + timeline + masked contact + program/department name` returned. Asserted in both the Jest spec and the D18 flow spec.
- **Throttle:** `GET /track` 30/IP/hr (refresh-friendly); `POST /track/withdraw` 5/IP/hr (mirrors submit); `GET /programs/public` 60/IP/hr. Submit stays 5/IP/hr (R3.b).
- **State machine:** withdraw-by-token routes through the canonical `transition(...,"WITHDRAWN")` — terminal states → 400; the public path can never trigger a forward/admin transition.
- **No token in logs.** `@AuditSkip()` on the public mutations (no authenticated actor; the service records the `public:track-token` sentinel on the row).
- **Routing:** `/apply` + `/track` are PUBLIC (Q1.a) — the AppShell auth gate never fires (no forced login), and there's no dual-nav (only the landing route is Nav-special-cased).
- **Public catalog** is non-sensitive by nature (program names/levels — marketing data), tenant-scoped, active-only.

---

## 4. Performance budget (D66 Path D)

Per-route lazy, no shared bucket. Local `vite build`:

| Chunk | Size | gzip |
|---|---|---|
| `Apply-<hash>.js` | 12.34 kB | 5.00 kB |
| `Track-<hash>.js` | 6.39 kB | 2.70 kB |
| `index` (main) | ~357 kB | ~102.7 kB |

Both new pages are lazy (own content-hashed chunks; neither is eager nor a static import of the entry, so neither is modulepreloaded on the anon shell — the 8.5 leak guard stays green). Main-bundle delta from R6 is only the 2 route-table entries + 2 `React.lazy` statements (≈0). **Authoritative measurement is post-deploy** via `deploy-and-smoke.ps1` step 8.6 vs `BUNDLE_BASELINE.json` (`mainBundle.sizeBytes = 392947`; warn +40 KiB, fail +50 KiB). Each per-route chunk is well under the 30 kB proactive-ping threshold.

---

## 5. Tests

- **API (Jest):** `apps/api/test/applications-r6-tracking.spec.ts` — token mint, masked view, PII-mask (no nationalId/ids), forged+empty → 404, withdraw → WITHDRAWN + sentinel actor, decided(REJECTED) → 400, idempotent same-token, instructor variant. `audit-on-mutation` lint **PASS** (27 files, 0 violations).
- **Web (Playwright, D18):** `apps/web/tests/visual/phase-b-r6-tracking.spec.ts` — the anon journey (apply → confirmation → track → withdraw), forged-token → error (no leak), idempotent re-submit → same reference. Runs against the deployed site via the visual config.
- `tsc --noEmit` clean (api + the R6 web files); `prisma validate`/`generate` clean; `vite build` exit 0.

---

## 6. Deploy — the one command (R5 Phase-2 first real run)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-and-smoke.ps1 -Yes
```

Runs `git pull` → **migration gate** (the new `trackingToken` migration trips step 2's warning + the post-deploy `prisma migrate status` at 8.2) → `remote.ps1 build → up → migrate → seed → health` → smoke (8.1–8.4) → modulepreload allow-list (8.5) → main-bundle vs baseline (8.6) → markdown report + exit code. Because R6 carries a real migration, this exercises the gate path in full — not the no-op/`-DryRun` path Phase-1 dogfooded.

---

## 7. Deploy evidence (R5 Phase-2)

Ran `deploy-and-smoke.ps1 -Yes` against `main@221d7dc` → **exit 0, all green**. Report: `logs/deploy/2026-05-31-070858.md`.

| Phase | Result |
|---|---|
| git pull → build → up → migrate → seed → health (4 services) | all PASS |
| `prisma migrate status` (8.2) | **schema up to date** — the `trackingToken` migration applied on prod |
| public health (`/healthz`, `/api/v1/health`, `/ai/v1/health`) | 200 / 200 / 200 |
| auth probe (bogus → 401) | PASS (SMOKE_* unset → full round-trip skipped by design) |
| modulepreload allow-list (8.5) | **vendor-only** (react-vendor, radix-vendor) — Apply/Track chunks did NOT leak |
| main bundle (8.6) | **384.5 KiB, Δ +0.76 KiB vs baseline** — well under +40 warn / +50 fail |

**Live R6 surface validation** (the smoke covers health/auth, not the new pages — checked separately, non-mutating):
- `GET /api/v1/programs/public?tenantSlug=demo` → **200**, returns a real program (`bsc-cs` — کارشناسی علوم کامپیوتر), so the `/apply` picker populates.
- `GET /api/v1/applications/student/track?token=<bogus>` → **404** `"no application found for this tracking token"` — no leak.
- `GET /apply` → **200** (SPA shell).

The **+0.76 KiB** main-bundle delta (two full pages added) confirms the D66 Path D lazy-chunk approach: Apply + Track ship as their own chunks, not in `index`.

### ⚠ Finding — migration gate (step 2) is a no-op in push-then-deploy
Step 2 reported `migration gate - no new migration`, even though R6 adds the `trackingToken` migration. Cause: step 1 (`git pull --ff-only origin main`) fast-forwards local to origin, so the gate's `origin/main..HEAD` diff is **empty** — the migration was already on `origin/main` (canonical commit→push→deploy). The migration was still **applied + ground-truth-confirmed via 8.2** (`prisma migrate status` = "schema up to date"), which D78 already names as the authoritative check. So the **step-2 warning/countdown is effectively dead in the normal workflow** (it only fires for *unpushed* local migrations); 8.2 is the real migration gate, and it passed. Reframe for R5 / R-CI: either document step-2 as a pre-push heads-up, or make it diff the deployed migration set vs the DB's applied set (what 8.2 already does). **Owner to rule** on whether this affects R5 D13 Phase-2 closure (the run itself was clean — exit 0).

**R5 D13 Phase-2:** the owner's stated criterion was "a clean first real run closes R5 D13 Phase 2." The run was clean (exit 0, real migration applied + verified, bundle/preload/smoke all green). Met — pending the owner's ruling on the step-2 finding above. To be ratified in the closing decision log alongside the owner's D13 mobile visual.

---

## 8. Owner D13 — manual smoke (final ~2-min mobile visual + checklist)

Run on a phone against `https://digiuniversity.ir`:

1. **anon** (logged out) → `/apply` → **no login redirect**; the program picker is populated.
2. Submit the **student** variant → confirmation shows a reference (`APP-XXXXXX`) + a `/track?token=` link + the timeline.
3. Open the `/track` link → status **SUBMITTED**, lifecycle stepper, **withdraw** button visible.
4. Submit the **instructor** variant (Q4.a both) → confirmation.
5. **Token security:** open `/track?token=<garbage>` → error / no PII (404-backed).
6. **Admin side:** the submitted application appears in `/admin/applications` (R3.b integration intact).
7. **Withdraw** via `/track` → status **WITHDRAWN**; admin sees it.
8. **D70 destructive:** withdraw verified above; admin soft-delete (inbox) still removes the row (GET 404).
9. **Phase A/B untouched:** existing admin flows, the enrollment spine, and login routes all still work.

---

## 9. Phase B closure

R6 (Candidate C) closes **Phase B — Academic Hierarchy + Onboarding** per the Compass roadmap: the apply → review → accept → enroll spine now has a public front door end-to-end. After the owner's D13 PASS, Phase B is formally closed (a Gate-A-style milestone); the retrospective (`PHASE_B_RETROSPECTIVE.md`) gets an R6 + closure addendum, and the next direction is **R-CI-Cleanup** (per D79), which inherits the deploy/test-gate-divergence finding (D81) + the all-dependencies-public-accessibility lesson (D82).

---

— Phase B R6 review, 2026-05-30. Anon applicant self-service: submit + token-tracked status + withdraw, on a 192-bit bearer token with PII-masked reads. Deploy closes R5 D13 Phase-2 on a migration-bearing first real run.
