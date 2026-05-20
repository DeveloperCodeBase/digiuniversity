# Phase 12 — Production-grade master plan

**Status:** active.
**Owner:** Claude Code agent under direct authorisation from project owner.
**Pre-requisite reading:** [`AGENTS.md`](../AGENTS.md), [`AGENT_RUNBOOK.md`](../AGENT_RUNBOOK.md), [`docs/PHASE_11_REVIEW.md`](PHASE_11_REVIEW.md), [`docs/TECH_DEBT.md`](TECH_DEBT.md), [`docs/product/PRODUCT_BRIEF.md`](product/PRODUCT_BRIEF.md).

This document is the **single source of truth** for Phase 12. Findings land in [`docs/QUALITY_FINDINGS.md`](QUALITY_FINDINGS.md) under the next free F-NN id, fixes land in commits referenced from that file, and the closing summary will go to `docs/PHASE_12_REVIEW.md`.

---

## 1. Why this phase exists

Phase 11 closed with the seven LIVE pages (login, catalog, my-courses, course-live, assessment-live, progress, tutor) stable on the demo tenant. The owner's complaint, repeated:

> هیچ کدوم از فیچر ها دکمه ها و منوها و سایدبارها و نوبارها و پیجها ورک فلو ها و رولها درست عمل نمیکنند، همه پیجها ریسپانسیو نیست…

In English: **every button, every menu, every sidebar, every navbar, every page, every workflow, every role must work correctly and be fully responsive at every breakpoint, in every role, to a world-class production standard.**

Phase 11 only audited the 7 live pages. The other ~42 mock pages were declared "out of scope". Phase 12 reverses that decision. Every clickable surface in the SPA must:

1. Render without console errors at 375 / 768 / 1440.
2. Have its primary actions wired to a destination that exists.
3. Be reachable from the navigation surfaces that the active role grants.
4. Surface a sensible loading / empty / error state.
5. Pass the a11y minimums set in `PRODUCT_BRIEF.md` (WCAG 2.2 AA: touch ≥ 44 px, contrast ≥ 4.5, focus-visible, keyboard reachable, aria-correct).
6. Behave correctly under RTL and Persian-first typography.

If a page is mock-data-only that is fine — but it must look and behave like a finished surface, not a stub.

---

## 2. Scope

### 2.1. Routes in scope (all 54)

**Live (7) — already validated in Phase 11, smoke-test only:**
`login`, `catalog`, `my-courses`, `course-live/:id`, `assessment-live/:id`, `progress`, `tutor`.

**Mock (47) — full audit + fix:**
`home`, `programs`, `classroom`, `dashboard`, `course/:id`, `instructor`, `admissions`, `credential`, `search`, `assessment`, `community`, `analytics`, `authoring`, `recordings`, `register`, `forgot`, `verify-email`, `2fa-setup`, `onboarding`, `settings`, `calendar`, `library`, `help`, `pricing`, `faculty`, `admin`, `parent`, `officehours`, `events`, `about`, `schools`, `labs`, `virtuallab/:id`, `research`, `inbox` (NotificationsPage), `messages`, `bookmarks`, `achievements`, `submission`, `profile`, `transcript`, `degree-audit`, `registration`, `career`, `financial-aid`, `wellness`, `alumni`, `hackathons`, `honor-code`.

### 2.2. Roles in scope (5)

`student`, `instructor`, `admin`, `parent`, `org`. Each role's `nav[]` in `src/role.jsx` and `NAV_ITEMS_BY_ROLE` in `src/shared.jsx` must:

- list only routes the role is supposed to access,
- mark live ones with the green pulse dot,
- order them by frequency of use for that role,
- never reference a route that does not exist.

### 2.3. Breakpoints in scope

| Viewport | Width × Height | Tier name |
| --- | --- | --- |
| Mobile (small) | 320 × 568 | smol |
| Mobile (modern) | 375 × 667 | mob |
| Tablet portrait | 768 × 1024 | tab |
| Laptop | 1280 × 800 | lap |
| Desktop | 1440 × 900 | desk |
| Large desktop | 1920 × 1080 | wide |

Acceptance: no horizontal scroll on any page at `smol`. No clipped touch target on `mob`. Sidebar / nav modes:

- `< 720 px`: hamburger drawer.
- `720 – 1024 px`: collapsed sidebar, icons + label on hover.
- `≥ 1024 px`: full sidebar.

### 2.4. Out of scope (deferred to Phase 13+)

- Migrating the 47 mock pages to live API endpoints (separate per-page project).
- LiveKit / BBB live class real provider (Phase 13).
- Code-splitting + bundle reduction below 250 KB (Phase 13).
- Real Playwright e2e suite (Phase 13.1).
- Sentry / observability wiring (Phase 13.2).
- i18n in English + Arabic (Phase 14).

---

## 3. Acceptance criteria

Phase 12 closes when **all** of the following hold on the live VPS:

1. `scripts/remote.ps1 status` shows all 4 containers `Up (healthy)`.
2. `scripts/remote.ps1 logs` last 200 lines are warning-and-error-clean across the four services.
3. Manual walk: log in as each of `admin@digiuniversity.ir`, `instructor1@digiuniversity.ir`, `student1@digiuniversity.ir`. For each role, visit every entry in its `NAV_ITEMS_BY_ROLE` and every footer link. No page throws, no page shows a blank state with no CTA, no button is dead.
4. Per-page checklist (each route file in `src/pages/`):
   - `header` element renders with a sensible h1 + back/breadcrumb.
   - Every interactive element has either a real handler or a `stubAction` toast.
   - No `<div onClick>` for primary clickable rows where `<button>` is appropriate.
   - Every form has `aria-label`/`aria-describedby` on inputs and a visible submit affordance.
   - Loading skeleton or spinner for any async surface.
   - Empty state has a labelled CTA (not a dead message).
5. Responsive checklist (eyeball at the six breakpoints):
   - No horizontal scrollbar at 320 px.
   - Tap targets ≥ 44 × 44 on mobile/tablet.
   - Sidebar collapses at 1024 → drawer at 720.
   - Grid columns drop sensibly (`repeat(auto-fill, minmax(280px, 1fr))` for cards).
   - Tables either scroll-x with a hint or pivot to a stacked card layout.
6. A11y checklist:
   - Every interactive control reachable via Tab.
   - `:focus-visible` ring on everything focusable (no `outline: none` without replacement).
   - `aria-current="page"` on the active nav link.
   - `aria-label` on every icon-only button.
   - Modal / drawer / popover traps focus and closes on Esc + backdrop click.
   - All text contrast meets 4.5:1 (verified against the design tokens in `styles.css`).
7. Build artefacts:
   - `npm run build` succeeds with zero warnings other than the known bundle-size warning (tracked in `docs/TECH_DEBT.md`).
   - `npm test` (Vitest) passes on the VPS via `scripts/remote.ps1 test`.
8. Docs updated:
   - `docs/PHASE_12_REVIEW.md` written.
   - `docs/QUALITY_FINDINGS.md` extended with every F-id touched.
   - `docs/TECH_DEBT.md` reflects what slipped to Phase 13.

---

## 4. Methodology

### 4.1. Audit modes

Two complementary modes; we use both per page.

**Static (always):** open the file in `src/pages/`, read top-down. List in a per-file checklist:

- imports resolve;
- every `<a href>` or `onClick` either calls `go(routeId)`, opens a real URL, or shows a `stubAction` toast;
- destructured props are all consumed;
- every conditional render has an else-branch or is intentionally empty;
- date formatting goes through a single helper (no raw `toLocaleDateString("fa-IR")`);
- every list has a `key`;
- no console error in the dev build.

**Visual (where possible):** browser audit via Claude in Chrome MCP if connected, otherwise via screenshot pulls from a manual run. Because Chrome MCP cannot resize below ~700 px, mobile audit uses three signals together:

1. `document.styleSheets` enumeration to confirm the media query is *deployed*;
2. `matchMedia('(max-width: 720px)')` to confirm the breakpoint *matches* at the synthetic viewport;
3. JS-applied inline width to *force* the breakpoint and take a screenshot for visual diff.

### 4.2. Rounds

| Round | Activity | Output |
| --- | --- | --- |
| **R0** | Plan + memory + task list (this commit) | this document |
| **R1** | Nav + sidebar + role config | F-50..F-59 |
| **R2** | Page-by-page static audit, batch 1 (Home, Programs, Classroom, Dashboard, Course, Instructor, Admissions, Credential, Search, Assessment) | F-60..F-79 |
| **R3** | Page-by-page static audit, batch 2 (Community, Analytics, Authoring, Recordings, Register, Forgot, VerifyEmail, 2fa-setup, Onboarding, Settings) | F-80..F-99 |
| **R4** | Page-by-page static audit, batch 3 (Calendar, Library, Help, Pricing, Faculty, Admin, Parent, OfficeHours, Events, About) | F-100..F-119 |
| **R5** | Page-by-page static audit, batch 4 (Schools, Labs, VirtualLab, Research, Inbox, Messages, Bookmarks, Achievements, Submission, Profile) | F-120..F-139 |
| **R6** | Page-by-page static audit, batch 5 (Transcript, DegreeAudit, Registration, Career, FinancialAid, Wellness, Alumni, Hackathons, HonorCode) | F-140..F-159 |
| **R7** | Responsive sweep, breakpoint-by-breakpoint, all surfaces | F-160..F-179 |
| **R8** | A11y + i18n + RTL polish | F-180..F-199 |
| **R9** | Build + deploy + smoke walk in every role | F-200..F-209 |
| **R10** | Closing review document + tech-debt rollover | `PHASE_12_REVIEW.md` |

Each round ends with `scripts/remote.ps1 up` and a `logs` inspection. Errors are fixed before moving to the next round.

### 4.3. Commit discipline

- One focused commit per finding cluster (e.g. "phase-12 R1: fix nav for parent role").
- Conventional commit prefix:`phase-12 R<n>: <short subject>`.
- Each commit also updates `docs/QUALITY_FINDINGS.md` with the F-NN id(s) addressed and the commit hash.

### 4.4. Deploy discipline

Every round ends with:

```powershell
.\scripts\remote.ps1 up        # push + pull + build + restart
.\scripts\remote.ps1 logs      # last 200 lines, all services
.\scripts\remote.ps1 status    # docker compose ps + docker ps
```

If logs show any unexpected line, that becomes a new F-id and is fixed before the round is considered closed.

---

## 5. Common patterns we will apply

These come up in nearly every page; baking them as a small library now prevents drift later.

### 5.1. Page shell

Every mock page wraps in a single `<section className="shell">` with a `<header>` that holds:

- breadcrumb / back link (uses `go(parentRoute)`),
- h1 (uses `.heading-1` typography class, not `.h-1` — see `feedback_phase11_lessons`),
- short subtitle in `var(--fg-mute)`,
- right-aligned action cluster (primary CTA + secondary).

### 5.2. Empty / loading / error states

A small `src/components/States.jsx` (to be added in R1) will export:

- `<EmptyState title icon cta />`
- `<LoadingSkeleton kind="card|row|chart" count={3} />`
- `<ErrorState message onRetry />`

Every async surface uses these instead of inline strings.

### 5.3. Stubs that read like real actions

For mock pages, primary actions that aren't wired to data yet must call `stubAction("…")` (existing helper in `src/ui.jsx`) so the user gets a toast confirming the click registered, instead of a dead button. The toast text must be in Persian and describe *what would happen* in production (e.g. "ثبت‌نام شما در صف بررسی قرار گرفت — این عملیات در نسخه‌ی نمایشی فعال نیست").

### 5.4. Touch targets + buttons

- Replace every `<div onClick>` that represents a primary action with `<button type="button" className="...">`.
- Minimum 44 × 44 hit area on `(pointer: coarse)` and `(max-width: 720px)` via the existing pattern in `styles.css` (e.g. `.assessment-option`).

### 5.5. Date / number formatting

Add `src/i18n/format.js` (R8) with:

- `formatJalaliDate(date, { withTime })`
- `formatNumberFa(n, { unit })`

Every page replaces inline `toLocaleDateString("fa-IR")` and inline `toFa()` usages.

### 5.6. RTL flex / grid

- Use logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-start`) over `margin-left`/`right` wherever practical.
- For inline action clusters, use `flex-direction: row-reverse` only when explicitly RTL-required; otherwise trust `dir="rtl"` on the root.

---

## 6. Risk register

| Risk | Mitigation |
| --- | --- |
| Building 47 pages "to professional standard" balloons scope | Per-page checklist is bounded — header, CTAs wired, empty/loading/error, mobile collapse. No new features unless required to make the page coherent. |
| Mock data drifts from live data shape | Phase 12 does NOT touch live API integration. Mocks stay mocks; their data lives in `data.js`. Phase 13 is the migration. |
| Bundle size grows further | Code-split is Phase 13. Phase 12 must NOT pull in heavy deps (no `date-fns` full import — use a 1 KB Jalali helper instead). |
| VPS deploy fails on a bad commit | `scripts/remote.ps1 up` is push-then-pull-then-build; if build fails, the previous container keeps running. Rollback = revert + `up`. |
| Owner reads our review and says "still not professional" | Each finding is logged with rationale and acceptance criteria. The closing review is honest about what slipped. |

---

## 7. Deliverables

1. `docs/PHASE_12_MASTER_PLAN.md` (this file). ← R0 ✓
2. `docs/QUALITY_FINDINGS.md` extended through F-200+. ← R1–R9
3. Code changes across `src/`, `styles.css`, `tailwind.config.js`. ← R1–R9
4. `src/components/States.jsx` (new). ← R1
5. `src/i18n/format.js` (new). ← R8
6. `docs/PHASE_12_REVIEW.md` (new). ← R10
7. Updated `docs/TECH_DEBT.md`. ← R10

---

## 8. Authorisation + execution model

The owner has authorised the agent to work autonomously: no clarifying questions, just sensible calls and ship. Every code change still goes through commit → push → `remote.ps1 up` → log inspect, never directly executed on the VPS, never bypassing the script.
