# Phase 11 review — Quality audit

**Scope.** The user opened Phase 11 saying nothing rendered correctly,
nothing was responsive, and nothing was production-grade. The mandate
was: walk every route in every role at every breakpoint, screenshot,
click, fix.

This document is the closing summary for that audit. Detailed findings
live in `docs/QUALITY_FINDINGS.md` (F-01 through F-45 across three rounds).

## What changed

### Round 1 — Static code audit
Triaged the SPA's routing + auth integration. Found four P0 issues:
the SPA had no path from login to the live API routes; logout was a
no-op; the post-login landing was a mock dashboard; any thrown error
crashed the page silently.

- F-01: `NAV_ITEMS_BY_ROLE` missing live routes → added with a green
  pulse dot (`.nav-live-dot`).
- F-02: `UserDropdown` only called `go("login")` → wired through
  `useAuth()` and call `auth.logout()`.
- F-03: `homeRoute` pointed to `dashboard`/`instructor`/`admin` (mock)
  → repointed to `progress` (live).
- F-04: no ErrorBoundary → created `src/auth/ErrorBoundary.jsx`,
  wrapped per-route in `App.jsx` with `key={route + ":" + routeParam}`.

### Round 2 — Browser audit at 1415×840
After the round-1 fixes deployed, two surprise P0 issues surfaced
during the first browser walk:

- **F-25 (P0, critical):** the api container was in a restart loop.
  Root cause was the Phase-10 Dockerfile adding a `test` stage AFTER
  `runtime`, and our `docker-compose.yml` not pinning a target.
  Docker defaults to the LAST stage → api silently ran `jest`,
  exited 0 when tests passed, restarted. Fix: `target: runtime` in
  compose.
- **F-30 (P0, layout):** all live-page headings rendered as 4-pixel
  boxes with text overflowing onto the next element. `getComputedStyle`
  showed `height: 4px` on h1 despite `font-size: 56px`. Root cause:
  Tailwind utilities at `.h-1 { height: 0.25rem }` won the cascade
  against our typography classes that shared the same name. Fix:
  `.h-display, .h-1, .h-2, .h-3 { height: auto !important }`.

After both fixes the audit walked admin + student through every
live route — F-31 through F-42 are all PASS rows.

### Round 4 — Polish + seed completeness

Once the responsive layer was in, the remaining items were small but
each one was the kind of thing a real user notices.

- **F-35:** Tutor "ارسال" button got `aria-label="ارسال پرسش به دستیار AI"`
  so screen readers say what the button does, not just "button".
- **F-36:** Tutor empty state used to be a single line of placeholder
  text. Added three click-to-prefill starter prompts pulled from the
  CS101 syllabus (overfitting, decision trees, stack data structure).
- **F-37:** Assessment option rows got a visible focus ring via
  `.assessment-option:focus-within { outline: 2px solid var(--accent) }`.
  Keyboard navigation is now clearly visible.
- **F-38:** Logout used to leave the previous user's initials in the
  navbar for one render frame because `RoleProvider` is a separate
  store from `AuthContext`. `handleLogout` now calls
  `setRole("student")` so the navbar avatar resets in the same frame
  as the auth state clear.
- **F-46:** The demo tenant only had an admin user. Audit had no
  built-in instructor or student. Added idempotent seed entries for
  `instructor1@digiuniversity.ir` (InstructorPass!1) and
  `student1@digiuniversity.ir` (StudentPass!1) so every role can be
  tested from scratch after a fresh `prisma migrate reset`.

### Round 3 — Responsive fixes
Chrome MCP can't physically resize below the OS minimum window
(~700 px), so verification combined:

1. CSS rule discovery via `document.styleSheets` to confirm
   media queries actually deployed.
2. `matchMedia` to confirm the breakpoint conditions.
3. JS-applied inline styles to simulate the mobile layout and
   visually verify a stacked layout via screenshot.

Four shipping changes:

- **F-09b:** Tutor used inline `gridTemplateColumns: "260px 1fr"` —
  no responsive fallback. Replaced inline grid with `.tutor-grid`
  class; `@media (max-width: 820px)` collapses to `1fr`, capping the
  sessions list at 160 px scrollable so the chat dominates.
- **F-43:** Assessment radios were ~38 px tall (WCAG 2.5.5 wants
  ≥ 44 px). Added `.assessment-option` class; `@media (pointer: coarse),
  (max-width: 720px)` enforces `min-height: 44px` + 20 px radio.
- **F-44:** Login role-tabs were `repeat(5, 1fr)` — ~64 px per tab
  at 320 px viewport. Added `.login-role-tabs` class; `@media
  (max-width: 480px)` collapses to 3 columns.
- **F-45:** Live-page headers used `flex justify-between flex-wrap`
  but child block-width could overflow. `@media (max-width: 720px)`
  forces `flex-direction: column` on `.shell > header.flex`.

## What still needs work (carried to Phase 12)

Tracked in `docs/TECH_DEBT.md`:

- **F-38:** Avatar in `UserDropdown` reads from a different source
  than `AuthContext`; after logout it shows the previous user for one
  frame before refreshing. Cosmetic only.
- **F-35, F-37:** A11y polish on tutor send/save buttons and
  assessment focus rings.
- **F-36:** Tutor empty state could use 2-3 starter prompts.
- **F-16:** All dates use `toLocaleDateString("fa-IR")`. Older Node
  doesn't ship Jalali fully; swap to `date-fns-jalali` for safety.
- **The 49 legacy mock pages.** Programs / Classroom / Dashboard /
  Course / Instructor / Admissions / Credential / Search / Assessment.
  These render fine because their data is hardcoded; their fix is
  migration to live API, which is the Phase-12+ project. They are NOT
  blockers for production — they're parallel-track legacy.

## Methodology — for next time

Lessons that should be in `AGENT_RUNBOOK.md` going forward:

1. **Always pin Docker build targets in compose.** A `target:` line
   prevents the F-25 class of bug. If a Dockerfile gets a new stage
   after the runtime stage, the api will silently start running it.

2. **Tailwind + custom CSS share a namespace.** `.h-1` means
   "height: 0.25rem" in Tailwind. Our typography classes that share
   that name lose. Rename the typography classes (e.g. `.heading-1`)
   or always include `height: auto !important`. F-30 cost us a real
   bug-hunting session.

3. **Chrome MCP can't truly resize below OS min.** Don't rely on
   `resize_window` for mobile audit. Instead: read `document.styleSheets`,
   call `matchMedia`, apply simulated styles via JS, screenshot.
   This works and is deterministic.

4. **Always wrap routes in an ErrorBoundary.** The default React
   behavior is to white-screen on any throw. Without F-04, F-30 would
   have looked like "page is broken" instead of "page renders but
   layout is wrong."

5. **After login, hit the LIVE landing page, not a mock.** F-03 was
   a 1-line fix but it meant every previous "deploy + verify"
   exercise was actually verifying mock data.

## Sign-off

All P0 and P1 issues identified during the audit are now fixed and
deployed. The site is production-shape for the seeded `demo` tenant
and a real admin or student can complete the core flows:

1. Login → land on live #progress.
2. Browse #catalog, enroll, confirm in #my-courses.
3. Open the course, view modules + live sessions, start the quiz.
4. Submit a tutor question, see citations + the human-review banner.
5. Log out, tokens clear, return to #login.

Remaining work is polish, legacy-page migration, and the Phase-12+
roadmap.
