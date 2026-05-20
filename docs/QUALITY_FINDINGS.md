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




