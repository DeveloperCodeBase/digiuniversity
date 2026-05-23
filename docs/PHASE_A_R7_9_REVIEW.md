# Phase A R7.9 — Review (`apiRoleToLocal` completion + shared module + D18 flow spec)

> Third R7 critical-path sub-R. **10/10 demo users now land on their role's `homeRoute` AND see their role-tailored sidebar.** Gate A §5 cleared. OWNER-FINDING-2 cleared. First D18 flow-assertion spec shipped. R1.1 13/13 + R6.6 12/12 regression green. Awaiting D13 owner smoke + 3 decisions before R7.12 starts.

## What shipped

| Commit | Files | Notes |
|---|---|---|
| `ac9c52f` | memo | Plan locked before code |
| `60cb080` | 4 files | Shared mapper module + import swaps + D18 spec |
| `b0ac9c1` | 1 file | Spec resilience: inter-test 6.5s throttle pause |

## The fix

**Root cause** (from Gate A §5 + the FINDING-2 audit subsumed by D21):

```ts
// BEFORE — duplicated in apps/web/src/pages/auth/LoginPage.tsx + apps/web/src/pages/Auth.tsx
const apiRoleToLocal = (roles) => {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("instructor")) return "instructor";
  if (roles.includes("student")) return "student";
  return "student";   // ← 7 of 10 API roles silently bucket here
};
```

**After R7.9** (single source of truth: `apps/web/src/auth/role-map.ts`):

```ts
export const apiRoleToLocal = (roles) => {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("content_manager")) return "content_manager";
  if (roles.includes("moderator")) return "moderator";
  if (roles.includes("support")) return "support";
  if (roles.includes("instructor")) return "instructor";
  if (roles.includes("ta")) return "ta";
  if (roles.includes("org")) return "org";
  if (roles.includes("parent")) return "parent";
  if (roles.includes("student")) return "student";
  return "student";
};
```

Both `LoginPage.tsx` and `Auth.tsx` now import from the shared module — kills the duplicate-and-drift pattern that kept the bug alive through R5's login redesign.

## Spec verification — 10/10 PASS

| # | Role | Demo email | URL match | Sentinel | Result |
|---|---|---|---|---|---|
| 1 | student | `student1@digiuniversity.ir` | `/progress` ✅ | `/registration` ✅ | PASS |
| 2 | instructor | `instructor1@digiuniversity.ir` | `/progress` ✅ | `/instructor` ✅ | PASS |
| 3 | admin | `admin@digiuniversity.ir` | `/progress` ✅ | `/schools` ✅ | PASS |
| 4 | parent | `parent1@digiuniversity.ir` | `/parent` ✅ | `/calendar` ✅ | **PASS** (was 🔴 /progress before R7.9) |
| 5 | org | `org1@digiuniversity.ir` | `/org` ✅ | `/faculty` ✅ | **PASS** (was 🔴 /progress) |
| 6 | ta | `ta1@digiuniversity.ir` | `/ta` ✅ | `/classroom` ✅ | **PASS** (was 🔴 /progress) |
| 7 | content_manager | `cm1@digiuniversity.ir` | `/content` ✅ | `/authoring` ✅ | **PASS** (was 🔴 /progress) |
| 8 | support | `support1@digiuniversity.ir` | `/support` ✅ | `/audit` ✅ | **PASS** (was 🔴 /progress) |
| 9 | moderator | `moderator1@digiuniversity.ir` | `/moderate` ✅ | `/community` ✅ | **PASS** (was 🔴 /progress) |
| 10 | super_admin | `superadmin@digiuniversity.ir` | `/super` ✅ | `/audit` ✅ | **PASS** (was 🔴 /progress) |

**Gate A §5 verdict: ✅ PASS.** All 10 role landings reach their expected `homeRoute` AND the role-tailored sidebar mounts correctly. The 7 previously-stuck-on-`/progress` roles all reach their own dashboards now.

## D18 first-instance — flow-assertion contract

Per D18 (every multi-step user journey gets both D12 landing assertions AND flow assertions), R7.9 ships the first concrete flow spec:

```ts
// gate-a-role-routing.spec.ts (per role):
await login(page, role);

// D18 #1: URL match (catches mapper drift)
await expect(page).toHaveURL(new RegExp(escapeRegex(role.expectedHomeRoute) + "$"));

// D18 #2: role-tailored sidebar (catches nav-data drift)
await page.locator("#appshell-sidebar-trigger").click();
await expect(
  page.locator(`.appshell-sidebar-drawer .side-nav a[href="/${role.sentinel}"]`)
).toBeVisible();
```

Two failure modes covered in one spec:
- **Mapper drift** — e.g. someone refactors `apiRoleToLocal` and accidentally drops a role. URL match catches it.
- **Nav-data drift** — e.g. someone touches `NAV_ITEMS_BY_ROLE` or `SIDEBAR_BY_ROLE` and accidentally wipes a role's entries. Sentinel catches it.

The spec is tagged `@gate-a` so future CI can pick the whole gate-a suite without picking unrelated specs.

## Spec resilience — throttle pause

First run: 4/10 pass, then org hit a `waitForURL` timeout. Diagnosed as the api's auth-throttle (10 logins / 60s / IP) interacting with leftover bucket state from prior visual runs. Direct curl against `/v1/auth/login` for org returned a valid JWT confirming the credentials are correct.

Fix: added `beforeEach` that sleeps 6.5s before each test (except the first). 10 tests × 6.5s = 65s — comfortably within the throttle window. Adds ~65s to the spec runtime (now ~85s total) but eliminates the flake. Re-ran with 10/10 stable PASS.

## Regression — 25/25 across touched specs

| Spec | Pass | Notes |
|---|---|---|
| R1.1 AppShell | 13/13 | a11y + 3-mode topology unchanged |
| R6.6 Navbar RTL | 12/12 | RTL layout unchanged |
| **R7.9 gate-a-role-routing** | **10/10** | New |

R5 / R6 not re-run — R7.9 touches only the role mapper + the auth pages' imports + a new spec. The login form itself and classroom shell are independent.

## Sentinel map — adjustments from owner's directive

The owner's R7.9 directive proposed a sentinel per role for the spec. The R7.9 memo flagged 1 sentinel that needed swapping for the sidebar assertion to actually work; 3 sentinels were noted as overlapping with student's sidebar but kept because the URL match is the primary catch:

| Role | Owner-proposed | Used in spec | Why the adjustment |
|---|---|---|---|
| student | `tutor` | `registration` | `tutor` isn't in student's sidebar (only in student's PUBLIC navbar, hidden in workspace mode after login). `registration` is student-only sidebar item — uniquely identifies the student sidebar mount. |
| parent | `calendar` | `calendar` | Kept. Overlaps with student sidebar but URL match catches student-fallback. |
| org | `faculty` | `faculty` | Kept. Also in admin + super_admin sidebars but those have different URLs. |
| ta | `classroom` | `classroom` | Kept. Overlaps with student + instructor sidebars but URL match catches the fallback. |
| moderator | `community` | `community` | Kept. Overlaps with student sidebar but URL match catches the fallback. |
| Other 5 roles | (as proposed) | (unchanged) | No conflict. |

Owner can override in review if a different sentinel is preferred.

## What R7.9 deliberately did NOT do

- **R7.11 multi-role hierarchy UI.** Owner-gated. The mapper highest-privilege return is in effect (super_admin > admin > … > student); no UI lets users "switch workspace" between their roles. Stays gated until owner decides.
- **R7.12 mini-variant sidebar.** New scope per D23. Blocked on this review's owner ack per the user's R7.9 sequencing directive.
- **Touch `NAV_ITEMS_BY_ROLE` / `SIDEBAR_BY_ROLE` data.** Both already 10/10 distinct per the FINDING-2 audit. The mapper fix automatically surfaces them correctly.
- **Phase B Profile model.** OWNER-FINDING-1 (avatar placeholder) stays in PHASE_A_OUT_OF_SCOPE.md.
- **R7.7a/b/c/d color-contrast cleanup.** Owner-gated post-measurement.

## Critical path status after R7.9

| Sub-R | Status |
|---|---|
| R7.6 | ✅ shipped + D19 PASS |
| R7.5 | ✅ shipped + D22 PASS |
| **R7.9** | ✅ **shipped, ⏳ awaiting D13 owner ack** |
| R7.12 mini-variant sidebar | ⏸ blocked on this review's ack + memo approval |
| Critical-path measurement re-run | ⏸ blocked on R7.9 ack |
| R7.7a-d color cleanup | ⏸ owner gate post-measurement |
| Performance track (R7.1-4) | ⏸ owner gate post-critical-path |

## Owner manual smoke — D13 checklist for R7.9

Per the user's R7.9 sequencing, before R7.12 starts:

1. **Login as student** (`student1@digiuniversity.ir` / `StudentPass!1`). Expect: lands on `/progress` (no change from before R7.9). Sidebar shows "یادگیری" / "منابع" / "هوش مصنوعی" group headers.
2. **Login as parent** (`parent1@digiuniversity.ir` / `ParentPass!1`). **Expect: lands on `/parent` (NEW — was `/progress` before R7.9).** Sidebar shows "فرزند" / "ارتباط" / "اداری" group headers with parent-specific items (تقویم فرزند, پیام به استاد, etc.). Visibly different chrome from student.
3. **Login as super_admin** (`superadmin@digiuniversity.ir` / `SuperAdminPass!1`). **Expect: lands on `/super` (NEW — was `/progress`).** Sidebar shows "ابرمدیریت" / "ساختار" / "حساب" group headers with super-admin items (نمای کلی, تحلیل سامانه, گزارش حسابرسی, دانشکده‌ها, …). Visibly different from both student and parent.

If all three demo users land on their role-specific home + see their role-specific sidebar, R7.9 D13 passes.

If anything looks off → screenshot + tell me. If all three pass → owner three-decision pause (see below).

## Three owner decisions pending after R7.9 D13 smoke

Per the user's R7.9 sequencing message:

1. **R7.9 D13 pass/fail?** (this review)
2. **R7.12 implementation plan ack?** Per D23, R7.12 (mini-variant persistent sidebar at ≥1024px, Sheet drawer at <1024px) has three risks documented in the upcoming R7.12 memo:
   - Architecture rewrite (Sheet → persistent rail, not a tweak)
   - Content margin audit per workspace route
   - Baseline reset for R1.1 / R3 / R6 / R6.6 specs (snapshot diff > 1% expected)
3. **Performance track timing?** R7.1 (Vite manual chunks) + R7.2 (Vazirmatn self-host) can run parallel with R7.12, or sequentially after. Owner decides.

Holding for these three decisions before any next code.

— Phase A author, 2026-05-23. R7.9 shipped, 10/10 spec green, awaiting D13 smoke + 3 decisions.
