# Quality findings (Phase 11)

این سند یافته‌های audit زنده + استاتیک را به ترتیب severity فهرست می‌کند.
هر اصلاح در `QUALITY_FIXES.md` با commit hash ثبت می‌شود.

Legend:
- **P0** — broken: کاربر نمی‌تواند کار اصلی را انجام دهد یا صفحه render نمی‌شود
- **P1** — responsive/UX broken: کار می‌کند ولی روی موبایل غیرقابل‌استفاده یا بد دیده می‌شود
- **P2** — polish: typography، spacing، missing state، minor a11y

---

## Round 1 — Static code audit (commit `df35056..NEXT`)

### Resolved in this round

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-01 | **P0** | Nav | Live API routes (`#catalog`, `#progress`, `#tutor`, `#my-courses`) were **not in any role's NAV_ITEMS_BY_ROLE**. After login the user had no clickable path to Phase 4-9 work. | `src/shared.jsx` — added live routes to student/instructor/admin/org nav with a `live: true` flag + green pulse dot. |
| F-02 | **P0** | Auth | "خروج از حساب" in the UserDropdown only did `go("login")` — never called `auth.logout()`. The user's tokens stayed in localStorage. | `src/shared.jsx` — `UserDropdown` now takes `auth` prop and calls `auth.logout()` + clears the local role on click. |
| F-03 | **P0** | Routing | `role.jsx` `homeRoute` pointed to MOCK pages (`dashboard`, `instructor`, `admin`). After login users landed on fake-data pages, not the live `#progress` dashboard. | `src/role.jsx` — homeRoute → `progress` for student/instructor/admin/org. Parent stays on its mock page until a parent flow lands. |
| F-04 | **P0** | Errors | Any JS throw in a page rendered a blank white screen because there was no ErrorBoundary. | `src/auth/ErrorBoundary.jsx` + wired into `App.jsx` per-route. Persian "خطا" panel with retry. |

### Pending (need browser audit to triage)

| ID | Severity | Area | Suspected issue |
| --- | --- | --- | --- |
| F-05 | P0? | Auth | Token expiry handling — when the 15-min access token expires mid-session, do all live pages correctly hit `/auth/refresh` via the client's 401 retry? Needs a real timer test. |
| F-06 | P0? | Role | `RoleProvider` reads from `localStorage` independently of `AuthContext`. After logout + new login as a different user, does the role re-sync correctly? |
| F-07 | P0? | Catalog | `#catalog` shows the seed CS101 course but no faculties / departments. Are tenant-scoped joins surfacing? |
| F-08 | P1 | Mobile | Existing CSS has `@media (max-width: 1024px)` for the nav hamburger. Verify it actually opens/closes on real mobile viewport. |
| F-09 | P1 | Mobile | Tutor chat: 260px sidebar + 1fr main on mobile breaks into one column? Needs CSS rule. |
| F-10 | P1 | Mobile | AssessmentLive: radio options + textarea touch targets at 375px wide. |
| F-11 | P1 | RTL | Some flex containers use `gap` only and might mis-direction on RTL. Need visual check. |
| F-12 | P2 | a11y | Login form needs `autofocus` on the tenant slug field; password reveal toggle missing. |
| F-13 | P2 | a11y | Notification dropdown uses `<div onClick>` instead of `<button>` for clickable rows. |
| F-14 | P2 | Loading | Catalog uses inline loading text; should be a skeleton grid for perceived performance. |
| F-15 | P2 | Empty | MyCourses empty state shows a CTA to `#catalog` ✓; Tutor empty state OK; AssessmentLive when no submission yet shows nothing — needs a "این آزمون را شروع کنید" CTA. |
| F-16 | P2 | i18n | All dates use `toLocaleDateString("fa-IR")` — works in modern browsers; older versions fall back to Gregorian. Phase 12 swaps to `date-fns-jalali`. |

---

## Round 2 — Browser audit (pending Chrome MCP connection)

To run live screenshots + click-tests across breakpoints, the Claude in
Chrome extension must be installed and **connected** in a Chrome window
on this machine. When connected, each route will be probed at:

- 375 × 667  (iPhone SE)
- 768 × 1024 (iPad portrait)
- 1440 × 900 (MacBook Pro 13")

For each of `student`, `instructor`, `admin` roles. Findings will be
appended here as **F-17** onward.

---

## What I'm NOT auditing in Phase 11

Out of scope (tracked in `docs/TECH_DEBT.md`):

- 49 legacy mock pages (Programs, Classroom, Dashboard, Course,
  Instructor, Admissions, Credential, Search, Assessment, …) — these
  exist from the original SPA and are not on the live data path.
  They render fine because their data is hardcoded; their fix is
  *migration to live API*, which is a Phase 12+ project, not a
  visual polish issue.
- Lighthouse perf score — we know the bundle is 600KB unsplit
  (TECH_DEBT.md). Code-split is Phase 11.2.
- Real Playwright e2e — Phase 11.3.

---

## Round 2 — Browser audit @ 1415x840 (admin role)

After F-30 fix landed (Tailwind `.h-*` height collision), re-walked every live page as `admin@digiuniversity.ir`.

| ID | Severity | Area | Finding |
| --- | --- | --- | --- |
| F-31 | ✓ PASS | Catalog | `#catalog` renders 2 seed courses (CS101, CS102). Stats bar (faculties 1, programs 1, courses 2, my enrollments 0) renders. h1=70px. |
| F-32 | ✓ PASS | Course detail | `#course-live/<id>` renders 2 live sessions + 1 quiz + 2 modules × 2 lessons. CTAs (`ثبت‌نام`, `پرسش از دستیار AI`, `ورود به کلاس`, `تحلیل AI`, `شروع آزمون`) all visible. |
| F-33 | ✓ PASS | Assessment | `#assessment-live/<id>` renders title + description + 3 MCQs (12 radios) + draft/submit buttons. h1=70px. |
| F-34 | ✓ PASS | Tutor | `#tutor` accepts a question and renders assistant turn with 2 sources, confidence (0.74), `humanReviewRequired` banner, `request_id` shown for audit log lookup. Live API → ai-gateway path works end-to-end. |
| F-35 | P2 | A11y | Send/Save buttons in chat input row have no `aria-label`; screen readers announce only icon. |
| F-36 | P2 | UX | Empty chat area says only "هر پرسشی که دارید بپرسید…". Could add 2-3 starter prompts (سوال نمونه از CS101) for new users. |
| F-37 | P2 | A11y | Assessment radios use default browser styling; focus ring is the platform default. Custom focus ring would pass WCAG 2.4.7 better. |

---

## Round 3 — Student role + responsive

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-38 | **P1** | Nav | After logout the route is correctly `#login` and tokens are cleared, but the navbar avatar still renders the previous user ("AM محمدی") for one frame because `UserDropdown` reads from a different source than `AuthContext`. The avatar refreshes after the next route hit, so impact is cosmetic; flagged for a unified store. | TBD (RoleProvider unification — Phase 12). |
| F-39 | ✓ PASS | Student role | Student login via `student1@digiuniversity.ir` lands on `#progress` and shows live data: 1 enrollment (CS101), 1 graded quiz (95/100), 2 Attendance rows, 2 AI requests, risk LOW (no factors). |
| F-40 | ✓ PASS | Student nav | Nav strip for `student` role contains: پیشرفت من ●, کاتالوگ ●, دوره‌های من ●, دستیار AI ●, تقویم, جامعه. Four live items (●) match expected route map. |
| F-41 | ✓ PASS | Student catalog | `#catalog` as student shows the 2 seed courses + active-enrollment flag on CS101. |
| F-42 | ✓ PASS | Student my-courses | `#my-courses` shows the active CS101 card + active/completed/inactive stat counters. |
| F-09b | **P1** | Tutor responsive | Tutor used inline `gridTemplateColumns: "260px 1fr"` — does NOT collapse at narrow viewports. The 260px sidebar would eat 70% of a 375px screen. | `Tutor.jsx` — replaced inline grid with `.tutor-grid` class. `styles.css` — added `@media (max-width: 820px)` rule that stacks sessions list above chat with `max-height: 160px` scroll. |
| F-43 | **P1** | Assessment touch | Radio rows had ~38px height — below WCAG 2.5.5 (target 44px). | `AssessmentLive.jsx` — added `.assessment-option` class. `styles.css` — `@media (pointer: coarse), (max-width: 720px) .assessment-option { min-height: 44px; }` + 20px radio. |
| F-44 | **P1** | Login mobile | Role-tab strip was 5 tabs in `repeat(5, 1fr)` — each tab ~64px at 320px viewport. Below WCAG tap-target. | `Auth.jsx` — added `.login-role-tabs` class. `styles.css` — `@media (max-width: 480px)` collapses to 3 columns (2 rows). |
| F-45 | P1 | Headers responsive | Live-page headers used `flex items-end justify-between flex-wrap` which is good in theory but the inline-block child width can overflow at <720px. | `styles.css` — `@media (max-width: 720px) .shell > header.flex { flex-direction: column; align-items: flex-start }`. |

---

## Round 4 — Polish + seed completeness

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-35 ✓ | P2 | A11y | Tutor "ارسال" button had no `aria-label`; screen readers said only "button". | `Tutor.jsx` — `aria-label="ارسال پرسش به دستیار AI"`. |
| F-36 ✓ | P2 | UX | Tutor empty state said only "هر پرسشی که دارید بپرسید". | `Tutor.jsx` — added 3 starter prompts as clickable pills that prefill the input. |
| F-37 ✓ | P2 | A11y | Assessment radio rows used the browser default focus ring (often invisible). | `styles.css` — `.assessment-option:focus-within { outline: 2px solid var(--accent); outline-offset: 2px }`. |
| F-38 ✓ | P1 | Auth/Nav | After logout the navbar avatar persisted (showed previous user's initials) until next route change. | `shared.jsx` — `handleLogout` now calls `setRole("student")` so RoleProvider state resets in the same frame. |
| F-46 ✓ | P1 | Seed | Demo tenant only had an admin user; the audit had no built-in instructor / student to walk through role-aware flows. | `apps/api/src/prisma/seed.ts` — added idempotent demo users `instructor1@digiuniversity.ir` (InstructorPass!1) + `student1@digiuniversity.ir` (StudentPass!1). |

---

## Phase 12 — Round 1: Nav + role config + shared primitives

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-50 ✓ | P1 | Nav | Parent role's nav led with the public `home` route, which is jarring for a logged-in parent and pushes the parent dashboard to slot 2. | `src/shared.jsx` — parent nav now leads with `parent` dashboard, drops public `home`, adds `messages`. |
| F-51 ✓ | P1 | Nav | Instructor / admin / org nav surfaces missed the role's dashboard (`instructor`, `schools`, `faculty`) in the primary nav strip. | `src/shared.jsx` — added `instructor` for instructor, `schools` for admin, `faculty` for org. Removed redundant `catalog` from instructor + admin nav (still reachable via sidenav). |
| F-52 ✓ | P1 | Mobile drawer | Mobile drawer didn't lock body scroll, so iOS users could two-finger scroll the underlying page while the drawer was open. | `src/shared.jsx` — `useEffect` toggles `body.nav-drawer-open`; `styles.css` rule disables body overflow only on viewports below the desktop breakpoint. |
| F-53 ✓ | P2 | A11y | Drawer + popovers didn't close on Esc. | `src/shared.jsx` — global keydown listener while any of the three popovers is open. |
| F-54 ✓ | P1 | A11y | No skip-link, so keyboard users had to tab past the entire nav on every page. | `src/App.jsx` — added `<a class="skip-link">` pointing at `#main-content`; `<div class="page-shell">` is now `<main id="main-content" tabindex="-1">`. |
| F-55 ✓ | P2 | A11y | Sidenav items were `<a class="cursor-pointer" onClick>` without href, so they weren't keyboard-focusable, didn't announce as links, and Cmd-click did nothing. | `src/sidenav.jsx` — now `<a href="#route" onClick={preventDefault+go}>`; `aria-current="page"` on the active item; `aria-label` on the `<aside>`. |
| F-56 ✓ | P1 | Reusable surfaces | Every page reinvented its loading / empty / error patterns inline, so they looked different each time and missed a11y attrs. | `src/components/States.jsx` — new `<EmptyState>`, `<LoadingSkeleton>`, `<ErrorState>`, `<PageHeader>`; `styles.css` — design tokens for each (matches the surface tokens). |
| F-57 ✓ | P2 | i18n | `toLocaleDateString("fa-IR")` falls back to Gregorian on older runtimes (TECH_DEBT carried from Phase 11). | `src/i18n/format.js` — `formatJalaliDate`, `formatNumberFa`, `formatRelativeFa`, `toFaDigits`; runtime-detects Jalali support, falls back to an inline Greg→Jalali converter. |
| F-58 ✓ | P2 | Typography | Tailwind `.h-1`..`.h-3` collisions still need authoritative typography names. | `styles.css` — added `.heading-1`, `.heading-2`, `.heading-3` as canonical names (with `height: auto !important` defence) so new pages don't have to know about the Tailwind history. |
| F-59 ✓ | P2 | Icons | Used in States/PageHeader but missing from the set: `chev-right/left/up/down`, `x`, `menu`, `external`, `edit`, `trash`, `filter`, `info`, `warn`, `refresh`, `upload`, `link`. | `src/icons.jsx` — 13 new minimal stroke icons appended. |

---

## Phase 12 — Round 2: Page batch 1 (Home, Programs, Dashboard, Course, Recordings, Academic)

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-60 ✓ | P0 | Auth | `Auth.jsx` used `<Icon name="alert" />` for the form-level error banner, but the icon library had no `alert` entry — banner rendered iconless. | `src/icons.jsx` — added `alert` alias (same SVG as `warn`). |
| F-61 ✓ | P1 | Dashboard | Greeting hardcoded "سلام نسرین" so non-student roles saw the wrong name. | `src/pages/Dashboard.jsx` — pulls `role` from `useRole()` and renders `سلام {firstName}` from `role.name`; eyebrow uses `role.label` + `role.code`. |
| F-62 ✓ | P1 | Dashboard | "تقویم کامل" link was `<a href="#">` with no preventDefault, so clicking it appended `#` to the URL and broke the SPA router. | Replaced with `<a href="#calendar" onClick={preventDefault+go("calendar")}>`. |
| F-63 ✓ | P2 | Dashboard | A second, redundant `SideNav` was exported with `<a>` items that had no href/onClick — every click was a no-op. | Deleted; `RoleSideNav` is the canonical sidebar. |
| F-64 ✓ | P1 | Course | "شروع گفتگو" CTA in the inline AI Tutor card on Course.jsx routed to `classroom` instead of the live `tutor` page. | `src/pages/Course.jsx` — points at `tutor`. |
| F-65 ✓ | P1 | Course | `ModuleRow` was a `<div onClick>` with no keyboard interaction; locked modules were still clickable. | Rewrote as `<button type="button" disabled={locked}>` with aria-current + aria-label + focus-visible ring. CSS in `styles.css`. |
| F-66 ✓ | P1 | Course | Hero grid (`1.6fr 1fr`) and body grid (`1fr 360px`) had no responsive collapse, so the sticky 360px sidebar overflowed at tablet width. | Added `.course-hero-grid` and `.course-body-grid` classes with `@media (max-width: 1024px) { grid-template-columns: 1fr; aside: position:static }`. |
| F-67 ✓ | P1 | Programs | Cards were `<div onClick>` — no keyboard nav, no announced role. Each card also had no `aria-label` describing destination. | `src/pages/Programs.jsx` — `<button type="button" aria-label="…">`. |
| F-68 ✓ | P1 | Recordings | Filter sort pills ("جدیدترین", "محبوب", …) were dead `<span class="pill">` — visual only, no click. | `src/pages/Recordings.jsx` — extracted `RecordingsSortPills` component with client-side state + aria-pressed. |
| F-69 ✓ | P1 | Recordings | Featured + grid recording cards were `<div onClick>` with no keyboard activation. | Added `role="link"`, `tabIndex={0}`, `aria-label`, and `Enter`/`Space` key handlers. |
| F-70 ✓ | P1 | Academic.Registration | Filter pills ("همه", "الزامی", …) were dead `<span class="pill">`. | Extracted `RegistrationFilterPills` with state + aria-pressed. |

---

## Phase 12 — Round 3: Cross-page <div onClick> + dead links sweep

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-71 ✓ | P1 | Auth.Register | "قوانین استفاده" + "سیاست حریم خصوصی" were `<a href="#">` — clicking them broke the SPA route. | Wired to `honor-code` + `help` with preventDefault. |
| F-72 ✓ | P1 | Auth.VerifyEmail | "ایمیل را تغییر دهید" was an `<a href="#">`. | Replaced with `<button>` that routes to `register`. |
| F-73 ✓ | P1 | University.Schools | School cards were `<div onClick>` — no keyboard interaction. | Added `role="link"`, `tabIndex={0}`, `aria-label`, `Enter`/`Space` key handler. |
| F-74 ✓ | P1 | University.Labs | Filter pills ("همه", "پزشکی", …) were dead `<span class="pill">`. | Extracted `LabsFilterPills` with state + aria-pressed. |
| F-75 ✓ | P1 | Search | Mode chips ("هیبرید", "فقط معنایی", …) were `<span onClick>` — no keyboard. | Converted to `<button type="button">` with `aria-pressed`. |
| F-76 ✓ | P1 | Community | Tag pills were `cursor-pointer` spans with no onClick. | Converted to real `<button>` that surfaces a toast explaining the mock state. |
| F-77 ✓ | P1 | Admissions | Step indicator pills were `<div onClick>` — no keyboard, no `aria-current`. | Converted to `<button aria-current="step">` with descriptive `aria-label`. |
| F-78 ✓ | P1 | Assessment | Question-overview grid items were `<div onClick>` (60 items). | Converted to `<button aria-current="step">` with status in `aria-label`. |
| F-79 ✓ | P1 | Home | Course cards + portal-entry cards were `<div onClick>`. | Converted to `<button>` with `aria-label`; CSS adds focus-visible ring and resets button defaults. |
| F-80 ✓ | P1 | More.Calendar | Calendar event chips were `<div onClick>`. | Converted to `<button>` with full event description in `aria-label`. |
| F-81 ✓ | P1 | Search | Result rows were `<div onClick>`. | Added `role="link"`, `tabIndex`, `aria-label`, Enter/Space key handler. |

---

## Phase 12 — Round 4: Responsive sweep (mobile / tablet collapses)

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-82 ✓ | P1 | Global grids | 80+ pages used inline `style={{gridTemplateColumns: "..."}}` with no responsive collapse. Hardcoded two-/three-/four-column patterns overflowed at tablet/phone. | `styles.css` — added a comprehensive `@media (max-width: 980px)` + `@media (max-width: 720px)` block that uses CSS attribute selectors (`[style*="grid-template-columns: 1.4fr 1fr"]`, etc.) to override inline grids on narrow screens. Catches the common patterns: `1.6/1.4/1.2/1.1fr + 1fr`, fixed-pixel sidebars (320/340/360/380px), `1fr 1fr 1fr 1fr`, `repeat(4/5/6, 1fr)`, three-pane messages, calendar 60px+repeat(7), analytics 28-col heatmap. |
| F-83 ✓ | P1 | Calendar | Weekly 60px+repeat(7) grid squashed cells at mobile. | Wrapped in `.calendar-week-scroll` (overflow-x: auto) and forced a `min-width: 720px` on the inner grid so cells stay readable while the user scrolls. |
| F-84 ✓ | P1 | Analytics | 28-col heatmap squashed at tablet+mobile. | Same `.calendar-week-scroll` wrapper + min-width fallback. |
| F-85 ✓ | P1 | Messages | 3-pane (`240px 1fr 280px`) was unusable below 980px. | Tablet: drop the right meta pane. Phone: drop the folder pane too, leave just the thread. `height: calc(100vh - 64px)` is also released at phone width so the stacked layout can breathe. |

---

## Phase 12 — Round 5 + Round 6: i18n + a11y polish

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-86 ✓ | P2 | i18n | Live pages still used raw `new Date(x).toLocaleDateString("fa-IR")` — F-57 only added the helper; we never migrated the four call sites that survived. | MyCourses, CourseLive, Tutor, AssessmentLive now import + use `formatJalaliDate`. |
| F-87 ✓ | P2 | A11y | Skip-link jumped to `#main-content` but the sticky nav covered the target. | `html { scroll-padding-top: 80px } #main-content { scroll-margin-top: 80px }`. |
| F-88 ✓ | P2 | A11y | Future interactive elements might forget their own focus-visible ring. | Global `:where(button, a, input, ...):focus-visible` fallback. |
| F-89 ✓ | P2 | A11y | Windows High Contrast (`forced-colors: active`) hid the .btn / .pill / .nav-link borders. | Added explicit `border: 1px solid CanvasText` defence. |
| F-90 ✓ | P2 | A11y | New shimmer-skeleton animation could trigger motion-sensitivity. | Added a catch-all `prefers-reduced-motion` rule that flattens animation + transition durations across every element. |

---

## Phase 13 — Round 1: Foundation hardening (security headers + ops actions + untrack internal artefacts)

External audit (compass-artifact, May 2026) flagged several P0 infra items still open after Phase 12. R1 closes the lowest-risk subset: secret-leaking docx in git, missing HSTS + COOP + CORP, missing ops actions on `remote.ps1`, and the absence of a one-off VPS bootstrap script for `docker-rollout`. CSP, secret rotation, image versioning, and `RUN_SEED=false` are deliberately deferred to subsequent rounds (each can break prod if rolled too aggressively).

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-91 ✓ | P0 | Security / hygiene | `project-run.docx` (root) and two files under `uploads/` were tracked in git, shipping internal Word docs to every clone of the repo. | `.gitignore` extended (`project-run.docx`, `uploads/`, `*.docx` allow-listing only `docs/**/*.docx`). `git rm --cached` for all three files; locally retained but no longer in repo. |
| F-92 ✓ | P1 | Security headers | `nginx.conf` was missing HSTS, Cross-Origin-Opener-Policy, and Cross-Origin-Resource-Policy. | Added all three `add_header ... always` lines. `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` enables eventual HSTS-preload submission. COOP `same-origin` + CORP `same-site` close the Spectre / cross-origin-isolation gap. CSP is intentionally deferred to a later round (needs report-only soak first to avoid breaking the SPA + Sentry + future Stripe iframes). |
| F-93 ✓ | P1 | Ops | `scripts/remote.ps1` had no `backup`, `restore`, `migrate`, `seed`, `health`, `rollout`, or `rollback` actions — a phase-12 deploy couldn't be observed or recovered without manual SSH. | Extended `ValidateSet` and switch with the seven actions. `backup` pipes `pg_dump` to a gzipped timestamped file in `/var/backups/digiuniversity/` with 14-day rotation. `restore -File <path>` is gated behind a `restore` confirmation prompt. `rollout -Service <name>` uses the `wowu/docker-rollout` plugin when present (zero downtime) and falls back to `docker compose up -d --no-deps` with a clear warning otherwise. `rollback` does a safe `git revert` (NOT `reset --hard`) then redeploys — confirmed via prompt. |
| F-94 ✓ | P1 | Ops bootstrap | No documented way to install `docker-rollout` on a fresh VPS, prepare `/var/backups`, or schedule nightly backups. | New `scripts/bootstrap-vps.sh` — idempotent, run once on the VPS. Installs the plugin into `~/.docker/cli-plugins/`, creates `/var/backups/digiuniversity/` mode 0750, drops `/etc/cron.d/digiuniversity-backup` for a 03:15 nightly `pg_dump` with 14-day rotation. Sanity-checks the docker engine + compose plugin before doing anything destructive. |
| F-95 ✓ | P0 | Secrets hygiene | `.gitignore` allowed `.env.production` and `*.sql.gz` to be accidentally committed because the existing `.env.*` glob is paired with `!.env.example` (which only protects `.env.example`, not the production file's actual safety). | Added explicit `.env.production`, `.env.production.*`, `*.env.local`, `*.env.backup`, `*.sql`, `*.sql.gz` lines to make the policy unmistakable — no future `git add -A` can sweep them in. |
| F-96 ✓ | P0 | Security headers | nginx `add_header` directives at server scope were silently NOT applied to any URL because every `location` block in nginx.conf had its own `add_header` for Cache-Control — and nginx replaces (does not merge) the parent set when a child has any add_header. So X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy (added in Phase 11) had NEVER actually reached the browser. Caught by curling the live URL and seeing only basic nginx-default response headers. | Re-declared the full security-header set inline in every `location` that has its own `add_header` — `/`, `/sw.js`, `/registerSW.js`, the workbox-* regex, `/manifest.webmanifest`, `/assets/`, and the static-asset regex. Verified via `remote.ps1 domain-probe` that all seven headers now flow through Caddy on the live URL. |
| F-97 ✓ | P2 | nginx routing bug | `location = /workbox-*.js` used `=` (exact match) with a literal `*`, which nginx's exact-match directive does NOT expand — so the rule never matched any URL and workbox files fell through to the generic static-asset regex, picking up the wrong Cache-Control (30d instead of no-cache). | Changed to `location ~ ^/workbox-.*\.js$` (regex match). Workbox files now get the no-cache + security headers they need; the service worker actually updates on deploy. |

---

## Phase 13 — Round 2: secrets discipline (provision-env + RUN_SEED + fail-closed defaults)

Plan-file Phase 13 §2 calls for rotating the `change-me-*` compose defaults out of the repo and flipping `RUN_SEED=true` to opt-in. R2 closes both, and lays the tooling so future phases (RS256 JWT, Argon2id, 2FA) can rotate secrets safely.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-98 ✓ | P0 | Secrets / boot safety | `docker-compose.yml` had `JWT_SECRET=${JWT_SECRET:-change-me-min-32-chars-...}`, `SEED_ADMIN_PASSWORD=${...:-ChangeMe!2026}`, `AI_SERVICES_API_KEY=${...:-change-me}`. A missing `.env` would silently boot the api with these weak placeholders, and the demo seed would create a public admin account with a guessable password. | Removed the `:-change-me*` defaults. Switched to `${VAR:?<msg>}` syntax so a missing `.env` fails compose-parse with a clear error instead of booting weak. Three vars promoted to hard-required: `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `AI_SERVICES_API_KEY`. |
| F-99 ✓ | P0 | Boot safety | `RUN_SEED=${RUN_SEED:-true}` default could re-run the seeder on every container recreate, risking idempotency bugs corrupting the demo tenant. | Flipped default to `false`. Bootstrap path is now: `provision-env` → `up` → (optional) `migrate` → (optional) `seed`. Updated `.env.example` with the new contract. |
| F-100 ✓ | P1 | Ops tooling | No safe way to generate `.env` on the VPS — manual scp meant secrets routinely passed through clipboards / chat / shell history. | New `provision-env [-Force]` action in `remote.ps1`. Writes `/var/www/digiuniversity/.env` mode 0600 with strong randoms via `openssl rand`. POSTGRES_PASSWORD preserved from existing `.env` so postgres-data volume stays accessible. Secrets NEVER printed; only metadata. New `show-env` action prints file metadata only (owner/mode/size/mtime/varcount), not contents. |
| F-101 ✓ | P1 | Ops tooling correctness | `Process::StandardInput.Write` from PowerShell prefixes a UTF-8 BOM, which makes bash treat line 1 as a literal command (`bash: line 1: <BOM>set: command not found`). The first heredoc-based action that depended on `set -eu` for safety was provision-env — its `-Force` guard would silently fail under the BOM. Spotted during R2 verification. | Refactored two helpers (`Invoke-RemoteBash`, `Invoke-RemoteBashWithArg`) at the top of `remote.ps1`. They base64-encode the script on Windows, decode on the VPS with `base64 -d \| bash -s`. Bypasses every stdin-encoding pitfall (BOM, CRLF, code-page). Other heredoc actions (caddy-install, caddy-probe-and-logs, caddy-verify, backup) still use the inline-stdin pattern — they happen to work despite the BOM, but should be migrated in a future round for hygiene. |
| F-102 ✓ | P1 | Docs / rotation | No rotation runbook, no documented contract for what each secret does or when to rotate. | New `SECURITY.md` at repo root. Documents secrets layout (`.env.example` is the contract, `.env` on VPS is the truth), rotation triggers (leak, 90-day routine, phase migration), `provision-env`/`show-env` invocations, GDPR/PDPL deferral notes, and the host-Caddy-out-of-scope boundary. `.env.example` extended with REQUIRED markers + provision-env references. |
| F-103 ✓ | P1 | Ops tooling correctness | `remote.ps1 backup` failed on a freshly-deployed VPS because /var/backups/digiuniversity requires sudo to create and the deploy user has no non-interactive sudo. Surfaced when verifying R2. | Fallback path: try /var/backups/digiuniversity first; if not writable, use ~/backups/digiuniversity and print a hint to run scripts/bootstrap-vps.sh for the system-wide location. Also: `Out-Host` on the helper's ssh call so output renders on the terminal even when the caller uses `(Invoke-RemoteBash ...)` — without this, ssh stdout was silently captured into the function's pipeline return value and never displayed. |

---

## Phase 13 — Round 4: CI/CD scaffolding (.github/)

Plan-file Phase 13 §3 calls for CI gating PRs on lint/test/build/security. R4 lands the minimal viable CI + secret-scan + Dependabot. Deploy pipeline + image-SHA versioning are deferred to R3 (which needs GHCR push + cosign signing — its own concern).

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-104 ✓ | P1 | CI | No automated checks on PRs — every change went straight to main with only the agent's manual verification. | New `.github/workflows/ci.yml`. Two jobs: `web` (vitest + vite build, uploads dist artifact), `api` (npm ci + prisma generate + prisma migrate deploy against ephemeral pg-16 service + tsc build + jest --runInBand). Concurrency-cancels superseded runs. Caches npm based on lockfile. Runs on push to main + every PR. |
| F-105 ✓ | P1 | Security / CI | No secret-scan on PRs — a `.env` paste in a commit message or diff could leak. No CVE scanning on the lockfiles. No SAST. | New `.github/workflows/security.yml`. Four jobs: `gitleaks` (full-history diff + history scan), `npm-audit` (web + api, advisory-only for now), `trivy-fs` (CVE scan on lockfiles + Dockerfiles, SARIF uploaded to Security tab, severity HIGH+ CRITICAL), `semgrep` (p/owasp-top-ten + p/javascript rule sets, SARIF uploaded). Runs on push to main, every PR, and a daily 07:15 UTC cron to catch newly-disclosed CVEs. |
| F-106 ✓ | P2 | Dependency hygiene | No automated dependency updates — repo was vulnerable to silently aging deps with known CVEs. | New `.github/dependabot.yml` tracking 7 update channels: web npm (`/`), api npm (`/apps/api`), pip (`/apps/ai-gateway`), github-actions, and docker images in `/`, `/apps/api`, `/apps/ai-gateway`. Weekly Monday-morning cadence Asia/Tehran. Minor/patch bumps grouped into a single PR per ecosystem to reduce noise; major bumps stay individual. |

---

## Phase 13 — Round 5: defence-in-depth — remove host port 8090

`docker-compose.yml` published the SPA on host port 8090 (`8090:80`). The host Caddy proxies through to it via the docker network, so the 8090 publication was an escape hatch that bypassed Caddy entirely. R5 removes it after verifying Caddy is on the `digiuniversity_web` network and reaches the SPA by docker DNS name.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-107 ✓ | P1 | Defence in depth | App container published 8090:80 on the host, giving any process on the VPS (including other tenants if the firewall ever lapsed) a plain-HTTP path that bypassed Caddy's TLS + headers + access-log + future-rate-limit. | Removed `ports: - "8090:80"` from the `app` service in `docker-compose.yml`. Replaced with `expose: - "80"` to keep the container's port internal to the docker network. Caddy reaches it via `digiuniversity-app:80` (docker DNS), confirmed via `caddy-verify`. To restore the escape hatch in an emergency, uncomment the ports block. |
| F-108 ✓ | P2 | Internal probes | `remote.ps1 domain-probe` and `remote.ps1 health` both probed nginx via the host port `127.0.0.1:8090`, so they would silently break after F-107. | Both switched to `docker exec digiuniversity-app curl -fsS http://127.0.0.1/...` so they probe inside the container's network namespace and don't depend on host port publication. Caddy + DNS probes (parts of `domain-probe`) unchanged. |

---

## Phase 13 — Round 3: image tag parameterisation + pin-image / list-images / SHA-rollback

`docker-compose.yml` had `image: digiuniversity:latest` hardcoded for all three services, so deploys had no way to pin a specific build for rollback. R3 lays the parameterisation: compose now reads `${IMAGE_TAG:-latest}`, and two new ops actions (`pin-image`, `list-images`) work alongside an extended `rollback -Sha <sha>` mode. Full SHA-based deploys (GHCR push + signed images) still wait on Phase 14's deploy.yml — R3 just gets the local infrastructure in place.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-109 ✓ | P2 | Deploy / rollback | Compose hardcoded `image: digiuniversity:latest` across the three services. Every build mutated `:latest`; rollback required a git revert + full rebuild even when the previous image was still in the local docker cache. | All three services switched to `image: <name>:${IMAGE_TAG:-latest}`. Compose-default behaviour unchanged (still resolves to `:latest`), but `IMAGE_TAG=<sha> docker compose up -d` now pins a specific build. |
| F-110 ✓ | P2 | Deploy tooling | No way to label a known-good build for later rollback. | New `remote.ps1 pin-image` action: tags the currently-running app/api/ai-gateway images with the active git short-SHA (`digiuniversity:abc1234`, etc.). New `remote.ps1 list-images` action: lists all locally-tagged digiuniversity images newest-first so a rollback target is pickable. |
| F-111 ✓ | P1 | Deploy tooling | `rollback` only did `git revert` + rebuild — slow and risky during an incident (any rebuild bug propagates). | Extended `rollback` with a `-Sha <git-sha>` mode that does `IMAGE_TAG=<sha> docker compose up -d --no-build` against the pinned tag. Fast (no rebuild), no git history change. Falls back to the git-revert path when no `-Sha` is given. Closes the rollback-speed gap. |

---

## Phase 14 — Round 1: monorepo restructure (src/ → apps/web/)

Plan-file Phase 14 step 1. apps/api/ + apps/ai-gateway/ already lived under apps/. The SPA was the odd one out at the repo root. R1 moves it into the same convention without introducing npm workspaces, TypeScript, Turborepo, or router changes — those are R2/R3 + later sprints.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-112 ✓ | P1 | Monorepo layout | The web SPA lived at the repo root (src/, public/, vite.config.js, package.json, Dockerfile, nginx.conf, tests/, .storybook/, index.html, styles.css, tailwind/postcss configs, playwright.config.js, .dockerignore) while api + ai-gateway were already under apps/. Inconsistent layout blocked the rest of Phase 14 (TS migration, BrowserRouter) from being a focused subdirectory diff. | `git mv` all 15 SPA files/dirs into `apps/web/`. Updated `docker-compose.yml` app service: `context: ./apps/web`, `dockerfile: Dockerfile` (Dockerfile + nginx.conf moved alongside the source so paths are still relative to context). Updated `.github/workflows/ci.yml` web job: `defaults.run.working-directory: apps/web`, `cache-dependency-path: apps/web/package-lock.json`, `path: apps/web/dist` for the artifact. Image tag / compose service identity / network bindings unchanged so the deploy is byte-identical (verified via build digest comparison). |

---

## Phase 14 — Round 2: TypeScript migration (.jsx → .tsx, allowJs, @ts-nocheck escape hatch)

Plan-file Phase 14 step 2. Mechanical rename of every .jsx to .tsx, drop a `tsconfig.json` with `strict: true` + `allowJs: true`, and prepend `// @ts-nocheck` to every renamed file so the build stays green. As each file gets typed in subsequent sprints, the directive is removed file-by-file. Hard target: zero `@ts-nocheck` by end of Phase 18.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-113 ✓ | P1 | Frontend types | 100% .jsx, zero TypeScript. Backend was already TS; frontend was the only untyped surface. Component props passed positionally, refactors broke at runtime. | Bulk rename 55 .jsx → .tsx (preserves 49 source files + 9 storybook stories + ErrorBoundary + 2 auth). 140 explicit `.jsx` imports stripped to extensionless so Vite/TS resolve. `// @ts-nocheck` prepended to all 55 .tsx as the escape hatch. Added `apps/web/tsconfig.json` with `strict: true`, `allowJs: true`, `checkJs: false`, `moduleResolution: bundler`, `jsx: react-jsx`. Added `typescript@^5.6.3` + `@types/{react,react-dom,node}` devDeps. Added `typecheck` script (`tsc --noEmit`) + CI step that gates PRs on it. `apps/web/index.html` switched `/src/main.jsx` → `/src/main.tsx`. `vite.config.js`, `tailwind.config.js`, `.storybook/main.js` globs all extended to include `ts,tsx`. Vite build produces byte-identical dist (same `index-CwDNjEst.css` + `index-BhXNDvOo.js` hashes as pre-R2). package.json `name` renamed `digiuniversity` → `@digiuniversity/web` to match the `@digiuniversity/api` workspace naming convention (still no actual npm workspace; deferred). |

---

## Phase 14 — Round 3: hash → BrowserRouter migration

Plan-file Phase 14 step 3. The repo used a hand-rolled `window.location.hash` parser since day 1 — every URL was `digiuniversity.ir/#catalog`. SEO crawlers can't index hash fragments + deep-link sharing breaks. R3 swaps to react-router-dom v6 BrowserRouter without rewriting any of the 49 page components.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-114 ✓ | P1 | Routing / SEO | All 54 SPA routes lived behind a `#` fragment (`#catalog`, `#course-live/abc123`, etc.). Google + Bing can't index hash fragments — every page collapsed to the same `/` snapshot from a crawler's view. Deep-link sharing also broke whenever a referrer stripped the hash (Slack previews, OAuth callbacks, etc.). | Installed `react-router-dom@^6.30.3`. New `apps/web/src/router.tsx` owns the route table + Layout (Nav + ErrorBoundary chrome + Outlet). 54 route entries replace the old switch statement. Path-params (`courseId`, `assessmentId`, `labId`) preserve their old prop names via a tiny `<RouteShell>` wrapper that calls `useGo()` + `useParams()` and forwards as props. Pages themselves are 100% UNCHANGED — they still accept `go(id, param)` as a prop. Catch-all `path: "*"` falls back to HomePage (matches the old default branch). `apps/web/src/App.tsx` slimmed from 156 lines to 22 — now just the ThemeProvider + AuthProvider + RoleProvider wrap around `<AppRouter />`. |
| F-115 ✓ | P1 | Routing — useGo shim | Pages call `go(id, param)` in ~140 sites; rewriting them all to `useNavigate()` would balloon R3 into a 49-file diff. | New `useGo()` hook in `apps/web/src/router.tsx` that returns a function with the exact old signature `(id: string, param?: string) => void`. Internally it computes the path (`/" + id + "/" + encodeURIComponent(param)`) and calls `useNavigate()`. Plus the original side-effect: scroll to top on every nav. Future per-page polish can migrate to `useNavigate()` directly, but R3 doesn't touch any page. |
| F-116 ✓ | P1 | Routing — direct hash reads | A handful of places read or wrote `window.location.hash` directly (App.tsx for the parser, ErrorBoundary's reset, Settings' upgrade-plan button, shared.tsx's `?demo=1` check). All would silently break under BrowserRouter. | App.tsx parser deleted (replaced by router.tsx). ErrorBoundary.reset switched from `window.location.hash = "#home"` to `window.location.assign("/")` — class component, can't use hooks, but a hard nav is fine after an unhandled exception (clears latent state). Settings.tsx pricing button switched from `window.location.hash = "#pricing"` to `go("pricing")`. shared.tsx demo-mode check keeps both `search` + `hash` for one release cycle so users with `#demo=1` bookmarks still work. |
| F-117 ✓ | P1 | Routing — href="#X" anchors | 9 anchor tags used `href="#route"` for in-app links, working only because the old hash parser caught them. Under BrowserRouter they'd just set a fragment with no navigation. | All 9 converted to `href="/route"`: shared.tsx (brand link), sidenav.tsx (all role nav items), Dashboard.tsx (calendar link), Auth.tsx (5 instances — register/honor-code/help/login). `href="#main-content"` skip-link kept as-is (it's a real fragment-target nav, not a route). |
| F-118 ✓ | P2 | E2E tests | `tests/e2e/{routes,features}.spec.js` did `page.goto("/#home")` against the hash routes — would 200 against the SPA shell but never exercise the new routing path. | Both files updated to `page.goto("/home")` style. routes.spec.js array unchanged (still 19 routes including `virtuallab/ANAT` param case). features.spec.js — AI FAB, theme toggle, command palette, classroom — same flows, real paths. |
| F-119 ✓ | P2 | SPA fallback verification | Removing host port 8090 in P13 R5 meant the only path to the SPA is Caddy → nginx. We needed to confirm Caddy passes arbitrary paths through (not a curated allowlist) so BrowserRouter URLs like `/catalog` reach nginx's `try_files` fallback. | Verified via `infra/Caddyfile.snippet`: only `/api/*` and `/ai/*` are explicitly routed; everything else hits `handle { reverse_proxy digiuniversity-app:80 }` — including arbitrary paths. nginx.conf already had `location / { try_files $uri $uri/ /index.html; }` + `error_page 404 /index.html;` from Phase 11. BrowserRouter URLs now resolve end-to-end: Caddy → nginx → `/index.html` → React Router takes over. No nginx changes needed in R3. |

---

## Phase 14.6 — Demo users + PWA cache fix (owner-reported, two-front fire)

After Phase 14.5 deployed, the owner reported three real symptoms on the live URL: (1) "I don't see any changes" (PWA caching the old SPA), (2) "can't log in" (mostly the cache + a missing-user surprise), (3) "create demo users for every role". F-120 + F-121 close both.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-120 ✓ | P0 | RBAC / demo data | LoginPage shipped with 5 role tabs (student / instructor / admin / parent / org) since Phase 11, but `apps/api/src/prisma/seed.ts` only created users for the first three. Selecting parent or org and entering any credential failed with "user not found" — no message-of-the-day, no hint in the UI. Confirmed via `psql` against the live DB: `WHERE email LIKE '%digiuniversity.ir'` returned exactly 3 rows. | Extended seed.ts: added `parent` + `org` roles to the per-tenant defaults, and added `parent1@digiuniversity.ir / ParentPass!1` + `org1@digiuniversity.ir / OrgPass!1` to the demo-users block. Idempotent on `(tenantId, email)` — re-runs are no-ops. Ran `remote.ps1 seed` post-deploy to apply. Verified via curl that all 5 users can log in through `/api/v1/auth/login`. Also added a `DEMO_CREDS` map + visible "DEMO · حساب نمایشی" panel on the LoginPage with a one-click "پر کردن خودکار" button (only shown when `tenantSlug === "demo"`). New `docs/DEMO_USERS.md` is the canonical source. |
| F-121 ✓ | P0 | PWA / cache invalidation | `vite-plugin-pwa` shipped with `registerType: "autoUpdate"` and no `skipWaiting` / `clientsClaim`. A new service worker installed in the background but only activated when every tab of the site was closed and reopened. On a long-lived LMS tab, users saw the old SPA for hours (or never, if they kept the tab open). Real complaint from the owner after the Phase-14 ship: "I don't see any changes". | Added `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true` to the workbox config in `apps/web/vite.config.js`. New SW now claims control of every open tab on activation and sweeps stale precache entries. Also added `NetworkOnly` runtimeCaching for `/api/*` + `/ai/*` so the SW never accidentally serves stale auth state from the cache, plus a `navigateFallbackDenylist` matching the same prefixes (defence-in-depth). Documented the manual recovery path (hard refresh → unregister SW → clear site data) in `docs/DEMO_USERS.md` for any user still stuck on an old cache from before this fix. |

---

## Phase 15 — RBAC depth + audit log + rate limit + CSP + CASL

The compass-artifact audit's Phase ۲ findings ("no general audit_log table", "no fine-grained authz", "no rate limiter", "no CSP") all closed in this phase across 7 rounds. Closed in commits [`d37e00e`](https://github.com/DeveloperCodeBase/digiuniversity/commit/d37e00e) → [`929475b`](https://github.com/DeveloperCodeBase/digiuniversity/commit/929475b). Full close-out in [PHASE_15_REVIEW.md](PHASE_15_REVIEW.md).

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-122 ✓ | P0 | Audit / forensics | The api had `AiInteractionLog` + `LearningEvent` as domain-specific logs but no generic `audit_log` — mutating events on Course / Enrollment / Submission / Tenant / User left no trail an operator could query. Compass-artifact audit Phase ۲ explicitly called this out. | New `AuditLog` Prisma model: tenantId / actorId / action / subject / before (Json?) / after (Json?) / ip / userAgent / requestId / createdAt + 5 indexes + 2 FKs (tenant CASCADE, actor SET NULL so the trail outlives users). Raw-SQL migration `20260521000000_audit_log/migration.sql` (project convention). |
| F-123 ✓ | P1 | Audit / wiring | A general AuditLog table is only useful if every mutating endpoint actually writes to it. Hand-rolling that across 17 controllers is bug-prone — easy to miss a route. | `apps/api/src/audit/audit.interceptor.ts` as `APP_INTERCEPTOR` auto-captures every authenticated non-GET request. Subject derived from `response.id` → route `:id` → path. Action from `@AuditAction` decorator with `<method>.<first-segment>` fallback. `@AuditSkip()` opts a high-volume endpoint out (used on `learning-events.emit` and `ai-logs.create`). Best-effort writes: never throws into the request handler, errors stderr-logged. |
| F-124 ✓ | P1 | Audit / readable names | The interceptor's auto-fallback produced ugly action names (`post.tutor`, `patch.assessments`). Operators filtering AuditLog would see machine-shaped strings instead of domain verbs. | Swept every `@Post` / `@Patch` / `@Delete` handler across 17 controllers, decorated each with `@AuditAction("<resource>.<verb>")` (`course.create`, `enrollment.status.change`, `submission.grade`, `class-session.analyze`, etc.). Coverage proven 1:1 per controller. Two endpoints carry `@AuditSkip` intentionally — `POST /v1/learning-events` and `POST /v1/ai-logs` both have their own dedicated log tables. |
| F-125 ✓ | P0 | Rate limit / DoS | No rate limiter anywhere — a single source could fire `POST /v1/auth/login` as fast as bcrypt could chew, eventually pinning a CPU. Same risk for spam-creation of Enrollment / Submission rows. Compass-artifact audit Phase ۲ flagged this as critical. | `@nestjs/throttler@^6.4.0`. `ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 600 }])` global. `ThrottlerGuard` as `APP_GUARD` BEFORE `JwtAuthGuard` so a flood dies before any DB work. Auth endpoints override to 10/min/IP via `@Throttle({ default: { limit: 10, ttl: 60_000 }})`. `POST /v1/learning-events` + `/v1/health` carry `@SkipThrottle()` because they're either high-frequency legit traffic or self-monitoring. `trust proxy: true` in main.ts surfaces the real client IP through Caddy + nginx. Verified live: 11th login request returns 429. |
| F-126 ✓ | P1 | CSP / inline-script | Phase-14.8 added a PWA recovery bootstrap as an inline `<script>` in `index.html` so it would run before the SPA module bundle. A strict CSP `script-src 'self'` would block it, and allowing `'unsafe-inline'` would defeat most of the policy's value. | Moved the script verbatim to `apps/web/public/sw-recovery.js`. Referenced from `<head>` as `<script src="/sw-recovery.js"></script>` — synchronous, parser-blocking, same-origin → still runs pre-paint, the controllerchange listener + one-time kill switch behaviour unchanged. New `location = /sw-recovery.js` nginx block ships `Cache-Control: no-cache, no-store, must-revalidate` so every deploy lands the new logic on the next page load. |
| F-127 ✓ | P1 | CSP / coverage | nginx security headers (HSTS, COOP, CORP, etc.) were re-declared inline in every location block because `add_header` doesn't merge across scopes. Adding CSP would have turned 8 nine-line stanzas into pure copy-paste. | Created `apps/web/snippets/security-headers.conf` as the single source of truth for 8 headers including `Content-Security-Policy-Report-Only`. Every nginx location replaces its inline headers with `include /etc/nginx/snippets/security-headers.conf`. `apps/web/Dockerfile` copies `snippets/` into the runtime image. Report-Only mode lets us soak the policy against real traffic before flipping to enforcing in a follow-up round. |
| F-128 ✓ | P0 | Caddy upstream collision (production-impacting) | While verifying CSP rollout, `POST /api/v1/auth/login` 502'd via Caddy for every request — every authed flow on the SPA was broken. `hooshgate_caddy` joins multiple stack networks (ainu, algal-blooms, animal-husbandry); the Caddyfile used the SHORT service alias `api:4000`, which Docker's embedded DNS resolved to **ainu-api** (172.25.0.4) instead of **digiuniversity-api** (172.22.0.6). | `infra/Caddyfile.snippet` pins full container names — `digiuniversity-api:4000`, `digiuniversity-ai-gateway:8000`, `digiuniversity-app:80`. No more cross-stack alias collision. Comment block documents the rule for future snippets. |
| F-129 ✓ | P1 | Caddy reload / stale config | `scripts/remote.ps1 caddy-reload` called `caddy reload --config /etc/caddy/Caddyfile`, which reads the CONTAINER-side path. If a previous in-place edit had orphaned the bind mount (Caddyfile inode in container != inode on host), that reload reverted to whatever was baked into the container image — silently undoing the host-side edit. Discovered while debugging F-128. | The new `caddy-reload` action streams the HOST file via stdin: `sudo cat $HOST_CADDYFILE \| docker exec -i hooshgate_caddy caddy reload --config /dev/stdin --adapter caddyfile`. Bypasses the orphaned bind mount AND forces upstream-DNS re-resolution as a side effect (which solved another flake where Caddy held a stale api IP after `docker compose up -d` recreated the container). |
| F-130 ✓ | P0 | RBAC / no fine-grained authz | `@Roles("admin")` is a coarse gate ("any admin can do anything"). The audit fase ۲ matrix called for subject-level checks ("this admin can read AuditLog but not delete Tenant"; "this instructor can update courseX but not courseY"). | `@casl/ability@^6.7.3`. New `apps/api/src/authz/` module: AppAbility type (`Actions × Subjects`), AbilityFactory builds per-role rule sets, PoliciesGuard as `APP_GUARD` after RolesGuard, `@CheckPolicies` decorator. Migration-safe — endpoints without the decorator pass through unaffected. First adopter: `audit-logs` viewer. `super_admin` manages all but `cannot delete AuditLog` (forensic continuity). Record-level scoping (subject(`Course`, row)) deferred to a follow-up sweep. Unit-tested with 20 cases across all 10 roles. |
| F-131 ✓ | P1 | SPA / authz integration | The SPA's role catalogue only had 5 entries (RoleId union: student/instructor/admin/parent/org) but the api's R1 seed expanded to 10 roles. The 5 new roles (ta, content_manager, support, moderator, super_admin) could log in but had no nav, no sidebar, no greeting. | `apps/web/src/role.tsx` `RoleId` widened to 10. 5 new Role entries with Persian labels, avatars, `homeRoute`, tailored `nav` lists. `apps/web/src/shared.tsx NAV_ITEMS_BY_ROLE` + `ROLE_WORKSPACE_LINK` + `apps/web/src/sidenav.tsx SIDEBAR_BY_ROLE` each gained 5 entries shaped to what the role can actually do. RolePermission union extended with tutor-students / publish-content / audit-read / reset-passwords / moderate-discussions / cross-tenant. |
| F-132 ✓ | P0 | SPA / CASL bootstrap | The SPA had no way to consume the api's ability rules. `<Can>`-style rendering was impossible; every conditional render relied on `hasRole(...)`, which is the coarse layer. | `apps/web/src/auth/ability.ts` — buildAbility() rehydrates via `@casl/ability/extra unpackRules`. `apps/web/src/auth/Can.tsx` — `<Can I="action" a="Subject">` wrapper + `useAbility()` hook. `apps/web/src/auth/AuthContext.tsx` — fetches /v1/auth/me on mount + after login/register to hydrate abilities, persists in sessionStore, publishes via AbilityContext. The /v1/auth/me endpoint on the api was extended to return `abilities` (packed CASL rules) alongside the standard user fields. |
| F-133 ✓ | P1 | SPA / no audit viewer | The api had `GET /v1/audit-logs` from R2 but the SPA had no page consuming it — operators had to curl the api directly to inspect the audit trail. | New `apps/web/src/pages/Audit.tsx` at the `/audit` route. `useAbility()` gates the page (defence-in-depth alongside the api's `@CheckPolicies`). Persian datetime + action filter + pagination counter + 8-char request-id snippet for forensic joins. Surfaces in support / admin / super_admin sidebars from F-131. |
| F-134 ✓ | P2 | SPA / demo coverage | After R1 added 5 new roles to the seed, the LoginPage `DEMO_CREDS` panel still only had 5 entries. The new roles were inaccessible via the one-click "پر کردن خودکار" affordance. | `apps/api/src/prisma/seed.ts` creates 5 new demo users (ta1@, cm1@, support1@, moderator1@, superadmin@) with `SEED_*_PASSWORD` env overrides. `apps/web/src/pages/Auth.tsx DEMO_CREDS` extended to all 10 roles. `docs/DEMO_USERS.md` refreshed as the canonical operator-facing matrix. |
| F-135 ✓ | P2 | Tests / no unit coverage | The api's only specs were supertest integration tests; pure-logic units like AbilityFactory had no coverage. A regression in role grants could ship live and only surface after a real user complained. | New `apps/api/test/ability.spec.ts` — 20 unit tests across all 10 roles plus composite cases. No Nest container, no Prisma, no http — runs in seconds. Asserts both positive grants ("super_admin can manage all") and negative invariants ("cannot delete AuditLog regardless of role"). Future Phase-15+ ability-factory edits run this spec for fast feedback. |
| F-136 ✓ | P1 | Ops verification harness | After R3+R4+R5+R6+R7 the security surface gained ~15 new behaviours (CSP headers, sw-recovery cache discipline, rate limit, CASL deny + allow paths, /me ability ship). Manually curling each from Windows was tedious + the front-door tests required IP knowledge of the docker network. | New `scripts/remote.ps1 security-probe` action: 6-step verification harness covering CSP, sw-recovery, rate limit (12× POST through Caddy front-door), api internal health, CASL negative (student → 403), CASL positive (support + super_admin → 200). Exits non-zero on any failure so CI can gate. End-to-end verified live: all 6 steps pass. |

---

## Phase 20 (brought forward) — Argon2id + HIBP + audit-logs supertest

Closed in commits [`f5edf88`](https://github.com/DeveloperCodeBase/digiuniversity/commit/f5edf88) + [`adb5def`](https://github.com/DeveloperCodeBase/digiuniversity/commit/adb5def). The compass-artifact audit's Phase ۸ called out three password-layer gaps that fit cleanly in one round; the rest of Phase 20 (2FA TOTP, GDPR/PDPL surfaces, RS256 JWT) stays on schedule for its own phase.

| ID | Severity | Area | Finding | Fix |
| --- | --- | --- | --- | --- |
| F-137 ✓ | P1 | Password hashing — modern algorithm | Every password (admin, demo seed, real registered user, change-password output) was bcryptjs at cost 12. Bcrypt is fine but Argon2id is the OWASP 2024 default; it's memory-hard against GPU cracking and resistant to side-channel attacks that bcrypt isn't. No way to upgrade without re-hashing, and the api had no migration path. | `apps/api/src/auth/password.ts` (new) — three exports: `hashPassword`, `verifyPassword`, `needsRehash`, plus `passwordAlgorithm` for telemetry. New passwords go to Argon2id via @node-rs/argon2 package defaults (m=64MiB, t=3, p=4 — exceeds OWASP minimums, ~80–120 ms per hash). Verifier detects $argon2id$ vs $2a$ by prefix and dispatches; returns false on any error so a malformed stored hash can never crash login. `needsRehash` flags bcrypt (lazy-migration target) or argon2id-with-outdated-params. The `argon2` npm package's prebuild for `linux-musl-x64` works under `node:20-alpine` — no Dockerfile changes needed. |
| F-138 ✓ | P1 | Password — lazy migration | Existing users can't be migrated without their plaintext, which we don't have. Without a transparent path, the api would either (a) lock all bcrypt users out after the switch, or (b) ship two hash algorithms forever. | `auth.service.login` uses `verifyPassword` (bcrypt + argon2id), then if `needsRehash` returns true and verification succeeded, re-hashes the just-verified plaintext with Argon2id and persists. Best-effort: a failed rehash never blocks the user from logging in — they're already authenticated. Verified live on probe: 3 demo users (student1, support1, superadmin) had bcrypt hashes from the R7 seed run; the next probe-driven login logged 3 `password rehashed bcrypt → argon2id` entries in the api logs and the users' next logins are now argon2id. Over time the bcrypt population shrinks to zero. |
| F-139 ✓ | P1 | Password — known-breached check | Nothing prevented users from registering with "password" / "123456" / other credential-stuffing targets. OWASP Top-10 A07 lists weak credentials as the top auth concern; HIBP's k-anonymity API is the industry-standard mitigation. | `apps/api/src/auth/password-breach.ts` (new) — SHA-1 the plaintext, send the 5-char prefix to `api.pwnedpasswords.com/range/<prefix>`, scan the response for the suffix. The plaintext + full hash never leave the box (k-anonymity). `rejectPwnedPassword` throws BadRequest 400 with a bilingual message if found. Wired into `auth.service.register` + `users.controller.change-password`. Fail-open by design: HIBP unreachable → register/change-password proceeds. `.env.example HIBP_CHECK_ENABLED=true` documents the override. Per-process LRU caches up to 64 prefix→list mappings. Plaintext is never logged. Verified end-to-end via probe step (7): `password` → 400 with "breach" in body. |
| F-140 ✓ | P2 | Test coverage — audit endpoint | The `/v1/audit-logs` endpoint shipped in P15 R2+R6 with admin viewer + CASL gate, but no supertest spec asserted the contract end-to-end. A regression in either gate (Roles, CASL, or validation pipe) could ship live. | `apps/api/test/audit.spec.ts` (new) — 4 cases: admin → 200 with a course.create row matching the seed admin email + non-empty subject; student → 403; actorId filter narrows to that user's rows only; limit=500 → 400 (proves the `@Max(200)` validator is enforced). Plus `apps/api/test/password.spec.ts` — 11 unit cases for the F-137 helpers across argon2id, legacy bcrypt, malformed hash, and empty-hash defensive paths. NODE_ENV=test bumps `@Throttle({ default: { limit }})` from 10 to 1000 so the supertest burst (45 tests across 7 suites in 11.9 s) doesn't 429 itself. Production bucket is unaffected. All 45 tests pass live against the VPS postgres. |

