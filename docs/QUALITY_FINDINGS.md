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
