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
