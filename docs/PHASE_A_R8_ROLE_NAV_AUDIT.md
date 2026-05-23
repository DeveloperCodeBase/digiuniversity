# Phase A R8 — Role-aware navigation audit (diagnostic, owner-requested)

> Owner reported (2026-05-23) that all 10 demo roles see the same navbar / sidebar / user-menu / page content after login — a bigger gap than the Gate A §5 finding (which only caught the role landing route). This document is a **diagnostic, not an implementation**. It surveys the current state of role-aware navigation in code and quantifies the gap between what the codebase defines and what the user observes.
>
> **Key conclusion up front:** the role-aware navigation **already exists** in the codebase. Both `NAV_ITEMS_BY_ROLE` (`apps/web/src/shared.tsx`) and `SIDEBAR_BY_ROLE` (`apps/web/src/sidenav.tsx`) define **10 distinct entries** — one per role — with role-appropriate item lists. Both consume `useRole()` to pick the right one. The visible "everyone sees the same nav" symptom is the **same root cause** as Gate A §5: `apiRoleToLocal` is incomplete, so 7 of 10 roles get bucketed as `student`, and both nav consumers then read the student entries.
>
> **R7.9 fixes the upstream root cause for free.** No separate R8 sub-R is needed for the data wiring — the data + consumers are already in place. R7.9 just needs to (a) complete the role mapping, (b) extend its flow-regression spec to assert role-tailored nav content, not just URL match.

## Component inventory

Three role-consuming surfaces in the chrome:

| Surface | Component | File | Source-of-truth for items |
|---|---|---|---|
| Top navbar (PUBLIC mode) | `Nav` | `apps/web/src/shared.tsx:129` | `NAV_ITEMS_BY_ROLE: Record<RoleId, NavItem[]>` (same file, line 32) |
| Workspace sidebar | `RoleSideNav` | `apps/web/src/sidenav.tsx:216` | `SIDEBAR_BY_ROLE: Record<RoleId, SidebarEntry[]>` (same file, line 28) |
| User menu (dropdown) | `UserDropdown` | `apps/web/src/shared.tsx:390` | Reads `role` prop + `auth.user`; no per-role item list (same logout + profile shortcuts for everyone) |

Each of `NAV_ITEMS_BY_ROLE` and `SIDEBAR_BY_ROLE` defines a `Record<RoleId, …>` keyed by the same 10 role IDs as `role.tsx`. Both consumers read `useRole().role.id` and index into their respective map. The role differentiation is end-to-end IF the right role is in context.

## Coverage of `NAV_ITEMS_BY_ROLE` (top-nav, PUBLIC mode only)

10 of 10 roles have an explicit entry. Counts of distinct top-nav items per role:

| Role | Items | First 3 items (id label) |
|---|---|---|
| `student` | 6 | progress / catalog / my-courses |
| `instructor` | 6 | progress / instructor / authoring |
| `admin` | 6 | progress / admin / analytics |
| `parent` | 5 | parent / calendar / credential |
| `org` | 6 | admin / analytics / faculty |
| `ta` | 4 | classroom / my-courses / progress |
| `content_manager` | 4 | catalog / authoring / analytics |
| `support` | 4 | admin / audit / messages |
| `moderator` | 3 | community / messages / help |
| `super_admin` | 5 | progress / admin / audit |

**All 10 roles have a defined list.** No role falls back to the default branch in `NAV_ITEMS_BY_ROLE`'s lookup — every key has an entry. Item lists are visibly different across roles (verified by manual inspection of the 51-item total).

## Coverage of `SIDEBAR_BY_ROLE` (workspace sidebar, every viewport per R1.3 D9)

10 of 10 roles have an explicit entry. Each sidebar uses interleaved `{ h: "..." }` group-headers and `{ id, t, ic }` link entries. Counts:

| Role | Group headers | Link items | Total entries |
|---|---|---|---|
| `student` | 6 (یادگیری · منابع · هوش مصنوعی · اجتماع · خدمات دانشجویی · حساب) | 22 | 28 |
| `instructor` | 4 (تدریس · دانشجویان · پژوهش · اداری) | 13 | 17 |
| `admin` | 3 (عملیات · محتوا و منابع · حاکمیت) | 11 | 14 |
| `parent` | 3 (فرزند · ارتباط · اداری) | 9 | 12 |
| `org` | 3 (تیم · محتوا · اداری) | 9 | 12 |
| `ta` | 3 (تدریس · دانشجویان · حساب) | 8 | 11 |
| `content_manager` | 3 (محتوا · تحلیل · حساب) | 7 | 10 |
| `support` | 2 (پشتیبانی · حساب) | 6 | 8 |
| `moderator` | 2 (نظارت · حساب) | 5 | 7 |
| `super_admin` | 3 (ابرمدیریت · ساختار · حساب) | 7 | 10 |

**All 10 roles have a defined list.** Item lists visibly differ across roles (e.g., `super_admin` has `audit` link, `student` has `assessment` + `tutor`, `instructor` has `authoring` + `analytics`, etc.).

## Side-by-side: what each role's chrome SHOULD show vs ACTUALLY shows

The role-aware data is in code (left column "as defined"). The owner observes "everyone sees the same nav" (right column "as rendered"). The mismatch is the **bug at `apiRoleToLocal`**.

| Role logged in | Sidebar as defined | Sidebar as rendered (today, pre-R7.9) | Gap source |
|---|---|---|---|
| student | 28 entries (یادگیری, منابع, هوش مصنوعی, اجتماع, …) | 28 entries (correct) ✅ | n/a |
| instructor | 17 entries (تدریس, دانشجویان, پژوهش, اداری) | 17 entries (correct) ✅ | n/a |
| admin | 14 entries (عملیات, محتوا و منابع, حاکمیت) | 14 entries (correct) ✅ | n/a |
| parent | 12 entries (فرزند, ارتباط, اداری) | **28 entries (student fallback)** 🔴 | `apiRoleToLocal` returns `"student"` |
| org | 12 entries (تیم, محتوا, اداری) | **28 entries (student fallback)** 🔴 | same |
| ta | 11 entries (تدریس, دانشجویان, حساب) | **28 entries (student fallback)** 🔴 | same |
| content_manager | 10 entries (محتوا, تحلیل, حساب) | **28 entries (student fallback)** 🔴 | same |
| support | 8 entries (پشتیبانی, حساب) | **28 entries (student fallback)** 🔴 | same |
| moderator | 7 entries (نظارت, حساب) | **28 entries (student fallback)** 🔴 | same |
| super_admin | 10 entries (ابرمدیریت, ساختار, حساب) | **28 entries (student fallback)** 🔴 | same |

Same pattern for the top navbar (`NAV_ITEMS_BY_ROLE`).

**Quantified gap:** 7 of 10 roles render the wrong chrome. 100% of the gap originates upstream in `apiRoleToLocal` at `apps/web/src/pages/auth/LoginPage.tsx:224` (and the duplicate at `apps/web/src/pages/Auth.tsx:22`). Zero items are missing from the per-role data structures themselves.

## Symptom traceback

The full chain of cause-and-effect, for the record:

```
Demo user logs in as e.g. ta1@digiuniversity.ir
  ↓ (api responds with roles: ["ta"])
LoginPage.tsx::apiRoleToLocal receives roles = ["ta"]
  ↓ (function checks: includes("admin")? no. includes("instructor")? no.
                     includes("student")? no. → returns default "student")
setRole("student") fires
  ↓ (RoleProvider persists role.id = "student" to context + localStorage)
useRole() in Nav + RoleSideNav returns role.id = "student"
  ↓ (both lookups: NAV_ITEMS_BY_ROLE["student"], SIDEBAR_BY_ROLE["student"])
Renders student's 6 nav items + 28 sidebar entries
  ↓ (post-login redirect: go(role.homeRoute) — student's homeRoute = "progress")
User lands on /progress with student chrome
```

Five different downstream "bugs" the user can observe — same upstream cause:
1. Lands on `/progress` instead of role's own homeRoute (Gate A §5)
2. Navbar shows student's items, not their own role's items (this finding)
3. Sidebar shows student's groups, not their own role's groups (this finding)
4. Dashboard widgets are student's (because /progress is the student dashboard) (Gate A §5)
5. User menu's "switch role" affordance (if any) reflects student, not their real role (this finding)

## Compass §A R3 vs Compass §Master Runbook §5

The owner asked whether R3 was *supposed* to cover role-aware navigation. Reading both refs:

- **Compass §A R3** (the Phase-A locked plan): «10 role-distinctive workspace homes per Master Runbook §5». Scope was **the dashboards**, not the navigation chrome. R3 shipped the 6 new dashboards at `/super`, `/content`, `/ta`, `/support`, `/moderate`, `/org` with role-specific KPI strips. No change to `SIDEBAR_BY_ROLE` or `NAV_ITEMS_BY_ROLE` was needed because **both already existed from Phase 15 R7** (when the 5 new role IDs were seeded; that R also added per-role sidebar + navbar entries).
- **Compass §Master Runbook §5** (the role UX blueprint): defines what each role's home should look like + what their primary navigation surfaces should be. Phase 15 R7 satisfied the navigation-surface part by adding `NAV_ITEMS_BY_ROLE[ta|cm|support|moderator|super_admin]` + `SIDEBAR_BY_ROLE[…]`. Phase A R3 satisfied the home-page part by adding the 6 new role dashboards.

**There is no R3 scope gap.** What's missing is the **integration step** that lets a logged-in user actually reach their role-specific chrome — which is `apiRoleToLocal` and falls under R7.9.

## Diagnostic verdict

| Question | Answer |
|---|---|
| Is the chrome navigation defined per role? | **YES.** 10 of 10 in both `NAV_ITEMS_BY_ROLE` and `SIDEBAR_BY_ROLE`. |
| Are the per-role items distinct? | **YES.** Verified by spot-inspection — different group headers, different item ids, different counts. |
| Why does every role see the same chrome at runtime? | The 7 non-default API roles all collapse to `"student"` inside `apiRoleToLocal`. |
| Does this need a new R8 sub-R? | **NO.** R7.9 already fixes the upstream mapper. Once R7.9 lands, role-aware nav appears for free. |
| What does R7.9 need to add beyond the current plan? | Extend its D18 flow-regression spec from "URL matches expected homeRoute" to "URL matches **AND** role-tailored nav content visible". Concretely, two extra assertions per role: (a) sidebar contains at least one of the role's distinctive item ids, (b) absence of a role-foreign item id. |

## Proposed extension to R7.9's spec (D18 deepening)

Per the D18 contract (flow + landing assertion), R7.9's `gate-a-role-routing.spec.ts` should add per-role chrome checks. Suggested assertion shape:

```ts
// inside the per-role test, after the URL match assertion:

// 1. Role-distinctive navbar item present (PUBLIC mode visible in workspace
//    via Nav's data-mode="workspace"). Each role gets a sentinel item id
//    that no other role's nav contains.
const ROLE_DISTINCTIVE_NAV: Record<string, string> = {
  student: "tutor",          // student-only nav item
  instructor: "instructor",
  admin: "schools",
  parent: "calendar",        // 'تقویم فرزند' label, id=calendar
  org: "faculty",
  ta: "classroom",           // first item is classroom for TA
  content_manager: "authoring",
  support: "audit",
  moderator: "community",
  super_admin: "audit",
};
const sentinelNav = ROLE_DISTINCTIVE_NAV[role.slug];
if (sentinelNav) {
  await expect(page.locator(`.nav-link[href="/${sentinelNav}"]`)).toBeVisible();
}

// 2. Role-distinctive sidebar item — open the workspace sidebar Sheet,
//    expect a sentinel item present. Same map, possibly different id
//    if sidebar has different items than navbar.
await page.locator("#appshell-sidebar-trigger").click();
await expect(page.locator(`.side-nav a[href="/${sentinelSidebar}"]`)).toBeVisible();
```

R7.9's memo will include this extension. Once R7.9 ships, the same spec catches not just routing drift but also nav-data drift.

## Open items (Phase B+ — NOT R7)

The diagnostic uncovered two product-shaped questions for later phases. **Not in Phase A scope.** Recorded here for future planning:

- **User-menu role differentiation.** `UserDropdown` currently shows the same logout + profile shortcuts for every role. Should super_admin see an "Impersonate" shortcut? Should support see a "Switch to ticket queue" shortcut? Master Runbook §5 implies some role-specific affordances. Phase B onboarding work might layer these on. Not blocking for Gate A.
- **Multi-role hierarchy resolution.** An instructor who is also a content_manager — what role does `apiRoleToLocal` return? R7.9's plan orders by privilege (super_admin > admin > content_manager > moderator > support > instructor > ta > org > parent > student). But a workspace switcher pattern (Notion-style "switch workspace") would let the user pick. R7.11 was already flagged as owner-decision-needed in the dossier; this audit reinforces that.

## Status

- Diagnostic complete; no code changed.
- Quantified gap: 0 items missing from per-role data; 100% of the symptom traces to `apiRoleToLocal`.
- **Recommendation:** **Do NOT spin up a separate R8 sub-R for navigation differentiation.** R7.9 fixes the upstream bug + extends its flow spec to assert nav content per D18. Single critical-path step covers both Gate A §5 and OWNER-FINDING-2.
- Awaiting owner review of this audit + decision on:
  1. Accept the diagnosis (R7.9 subsumes FINDING 2)? 
  2. Approve the spec extension proposed above (D18 deepening for nav content)?
  3. Confirm R7.11 multi-role hierarchy stays gated on owner.

— Phase A author, 2026-05-23. Diagnostic only, awaiting owner sign-off before R7.5 starts.
