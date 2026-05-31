# R-CI-Cleanup — async progress log

One line per bucket: `timestamp · bucket · tsc before→after · commit · STOP flags`.
Standing authorization (owner, 2026-05-31): autonomous bucket-by-bucket to tsc=0, no per-bucket permission. Anti-`any` binding (real per-site types; justified inline exceptions only).

- 2026-05-31 08:28 · conservative codemod (errorMessage helper + {go}:Go) · 198→185 · `f77adee` · —
- 2026-05-31 08:40 · Catalog.tsx (data/state interfaces + typed params + user guard) · 185→161 · `a65762b` · —
- 2026-05-31 08:50 · CourseLive.tsx (AiEnvelope/CourseDetail/Module/Lesson types + typed params + Icon span-wrap) · 161→139 · `0d774b2` · —
- 2026-05-31 09:00 · Settings.tsx (helper props + toast msg + go prop; removed dead danger flag) · 139→123 · `4ea9e8d` · —
- 2026-05-31 09:10 · ⛔ **STOP-FLAG (shared-contract / #5)**: Stage(14) + AIPanel(12) + icons(2 dup-key) = **28 errors gated** on adding `className?`+`style?` to the shared `IconProps`. Recommend doing it (Icon should accept both; fixes all 26 className rejections + the 5 style usages app-wide). Awaiting owner call; grinding non-Icon buckets meanwhile.
- 2026-05-31 09:15 · Admissions.tsx (Step onNext + FormField + Upload prop types) · 123→109 · `0ac76d5` · —
- 2026-05-31 09:25 · University.tsx (VIRTUAL_LABS keyof cast + tuple coercions) · 109→96 · `e75cf31` · —
- 2026-05-31 09:30 · ✅ **Q5.a AUDIT RESOLVED** — AssessmentLive.tsx has NO active `@ts-nocheck` (line 59 is only a *comment* referencing one; the directive was already removed). The debt-report "overlap" was a false flag (grep matched the comment). → AssessmentLive is a NORMAL 13-error bucket, **not gated**.
- **Status @ 96**: only the Icon shared-contract fork (28: Stage 14 + AIPanel 12 + icons 2) is owner-gated. Remaining ~68 (Productivity, AssessmentLive, Dashboard, Course, Analytics, Academic, Progress, Instructor, + tail) are freely grindable. Final phases (verify/gate-flip/deploy) need tsc=0 → need the Icon fork resolved.
- 2026-05-31 09:40 · icons.tsx (D86 Option A — Icon className+style forward + chev dedup) · 96→61 (−35: Stage/AIPanel/icons + 7 scattered Icon-prop errors) · `2c66e77` · —
- 2026-05-31 09:50 · AssessmentLive.tsx (AnswerValue/Question types + typed handlers/map) · 61→49 · `e994743` · —
- 2026-05-31 10:00 · Productivity.tsx (array String() coercions + keyof index casts + ChatBubble props + toast msg + xp ??0) · 49→38 · `5ff234f` · —
- 2026-05-31 10:10 · Dashboard+Course+Analytics (helper-component props + ModuleRow type + Number()/String() coercions for loose arrays) · 38→20 · `647acb6` · —
- 2026-05-31 10:20 · tail (Academic, Assessment, Authoring, Community, Instructor, More, Progress, Roles + landing-v2 spec) — prop/param types, keyof casts, Number()/String() coercions, selectedSlot number|null + guard, inline factor/event types · 20→**0** · _(this commit)_ · 🎉 **WEB TSC GREEN**

## ✅ Milestone — `apps/web` tsc = 0 (was 198, all R0.5-era debt)
13 buckets, every one verified (count down exactly, zero new error codes, **zero new `any`** across the whole sub-R). API tsc + audit-lint already green. Remaining R-CI capstone: unified `verify` script (Q3.a) → R5 gate flip lean→full-CI (Q4.a) → deploy → review doc.

---

## Capstone phase 1 — unified `verify` script (Q3.a)
- 2026-05-31 12:25 · `scripts/verify.ps1` written + dogfooded · 4 gates: web tsc / api tsc / audit-lint / api jest (DB-backed via `remote.ps1 test`) · `+ apps/api typecheck script` · _(this commit)_
  - **Mechanism works.** Static gates GREEN: web tsc 0, api tsc 0 (new `apps/api` `npm run typecheck` = `tsc --noEmit -p tsconfig.build.json`), audit-lint 27 controllers / 0 violations. `-SkipJest` static-only path exits 0, report + `logs/verify/*.md` written. Mirrors `deploy-and-smoke.ps1` conventions (Add-Step, ASCII-only, UTF8-no-BOM log, per-gate exit codes 10/20/30/40).
  - ⛔ **STOP-FLAG (#1 unexpected discovery + Q1.a / stop-trigger #4 escape-hatch):** first full run surfaced **api jest RED on the VPS — 20/122 fail across 4 suites** (applications-r3b, course-offerings, identity-r3a, academic-hierarchy; 9 suites + 102 tests pass). **Silently-red** because the deploy path never runs jest — the *exact* D81 divergence `verify` exists to expose. The script worked on its first run.
  - **Root cause (confirmed, read-only — the "Postgres CI env" Q1.a named):** non-hermetic suite. (1) **Throttler active in tests** — global `ThrottlerGuard` (600/min default + 10/min on auth/submit, in-memory per `req.ip`); `helpers.ts` boots the real `AppModule` and never disables/resets it; `--runInBand` → all 122 tests share one bucket + one loopback IP → cumulative volume trips `429` (~13 `expected 201, got 429`). (2) **Tests run against the PROD database** — `api-test` `DATABASE_URL` == prod `api`'s (`digiuniversity` / schema `public`); no teardown → fixed-slug collisions on re-run (`Unique constraint (tenantId, slug)`) + test tenants accumulate in prod. (3) ~3 genuine **test-vs-code drifts** (studentCode min-len 2, empty-PATCH now 200, audit-subject id). No product regression — the running app is fine (static green; deploy smoke/health pass).
  - **Recommend path A (R-CI-Api split, the pre-acked Q1.a escape hatch):** finish capstone with `verify` + a deploy-gate flip that **hard-enforces the 3 static gates** and runs the **jest gate ADVISORY (reported, non-blocking)** until a follow-up **R-CI-Api** greens it (skip/reset throttle in test env, point tests at a disposable DB not prod, add teardown, fix the ~3 drifts). Closes the static D81 divergence now + makes jest visible, without blocking deploys (avoids stop-trigger #3). **Awaiting owner ruling before phase 2 (gate flip).**
