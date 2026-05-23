# Phase A R7.9 — Memo (Complete `apiRoleToLocal` + D18 flow regression spec)

> Third sub-R on the R7 critical path. Per D17 + D18 + D21: complete the role mapper (3 → 10 roles), extract to a shared module (kills the LoginPage/Auth.tsx duplicate-and-drift risk), ship the first D18 flow assertion (`gate-a-role-routing.spec.ts`) with a `ROLE_DISTINCTIVE` sentinel per role. R7.9's success criterion is **10/10 demo users land on their role's `homeRoute` AND see the role-tailored sidebar** — clears Gate A criterion §5 and OWNER-FINDING-2 in one pass.

## Why R7.9 is on the critical path

Before R7.9: 3 of 10 API roles (`admin`, `instructor`, `student`) map correctly; 7 (`parent`, `org`, `ta`, `content_manager`, `support`, `moderator`, `super_admin`) fall through to the default `return "student"`. Five downstream symptoms (Gate A §5, OWNER-FINDING-2, wrong nav, wrong sidebar, wrong dashboard widgets) all collapse to this single root cause.

After R7.9: each role lands on their own `homeRoute` (per `role.tsx`), reads their own `NAV_ITEMS_BY_ROLE` + `SIDEBAR_BY_ROLE` entries (already 10/10 defined per the FINDING-2 audit), and the new flow spec catches any future regression of either the mapper OR the per-role nav data.

## Files touched

### 1. **New: `apps/web/src/auth/role-map.ts`** (the shared source of truth)

```ts
import type { RoleId } from "../role";

/**
 * Maps the API's role list (e.g. ["ta", "instructor"]) to a single
 * local RoleId. Highest privilege wins so a user with admin + instructor
 * lands on the admin console rather than the instructor surface.
 *
 * Per R7.9-D21 + Phase 15 R7 + the FINDING-2 audit: this used to live
 * duplicated in apps/web/src/pages/auth/LoginPage.tsx (line 224) AND
 * apps/web/src/pages/Auth.tsx (line 22). Both copies mapped only 3 of
 * 10 API roles, which silently bucketed parent / org / ta /
 * content_manager / support / moderator / super_admin as "student"
 * and broke role-based routing AND role-aware navigation for 7 of
 * 10 roles. The duplicate-and-drift pattern is what kept the bug
 * alive through R5's login redesign. Single-source-of-truth here.
 */
export const apiRoleToLocal = (roles: readonly string[] | undefined): RoleId => {
  if (!roles || roles.length === 0) return "student";
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

### 2. **Modified: `apps/web/src/pages/auth/LoginPage.tsx`**
Replace the local `apiRoleToLocal` definition with `import { apiRoleToLocal } from "../../auth/role-map";`. Net delta: -7 lines (the function body deleted) + +1 line (the import).

### 3. **Modified: `apps/web/src/pages/Auth.tsx`**
Same swap. -7 + +1.

### 4. **New: `apps/web/tests/visual/gate-a-role-routing.spec.ts`** (the first D18 flow spec)

Per the user's R7.9 specification + the FINDING-2 audit's D18 deepening:

```ts
// Pseudocode shape — full code in the implementation commit
for (const role of ROLES) {
  test(`role ${role.slug} (${role.fa}) lands on homeRoute + sees role-tailored sidebar`, async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, role);

    // D18 #1: URL match (the primary catch for mapper drift)
    await expect(page).toHaveURL(new RegExp(escapeRegex(role.expectedHomeRoute) + "$"));

    // D18 #2: role-tailored sidebar contains the role's distinctive item
    // (defense-in-depth catches nav-data drift even if URL matches)
    await page.locator("#appshell-sidebar-trigger").click();
    await expect(page.locator(`.side-nav a[href="/${role.sentinel}"]`)).toBeVisible();

    await ctx.close();
  });
}
```

Tagged so future CI suites can pick the whole `gate-a` group.

### 5. **Modified: `apps/web/tests/visual/gate-a-role-dashboards.spec.ts`**
The existing screenshot-only spec stays (the dossier needs the PNGs). But since R7.9 fixes the mapper, the 7 stuck-on-/progress roles will now render their own dashboards — the PNG file sizes will differ markedly across roles. The spec doesn't need code changes; it just produces a more useful composite grid.

## The sentinel map — flag for owner

Owner's R7.9 directive provided this `ROLE_DISTINCTIVE` map:

```ts
const ROLE_DISTINCTIVE = {
  student: "tutor",   instructor: "instructor",  admin: "schools",
  parent: "calendar", org: "faculty",             ta: "classroom",
  content_manager: "authoring", support: "audit",
  moderator: "community", super_admin: "audit",
};
```

The owner's intent is "same sentinel works for nav and sidebar". Cross-checking against `SIDEBAR_BY_ROLE` (the actual sidebar contents per role, from `apps/web/src/sidenav.tsx`):

| Role | Owner sentinel | In role's sidebar? | Also in student's sidebar? | Verdict |
|---|---|---|---|---|
| student | `tutor` | **NO** (student sidebar has `classroom` under AI section, no `tutor`) | n/a | ⚠ proposed swap → `registration` (student-only sidebar item) |
| instructor | `instructor` | YES | NO | ✅ keep |
| admin | `schools` | YES | NO | ✅ keep |
| parent | `calendar` | YES | YES | ⚠ overlap (student fallback would also pass); URL match catches it |
| org | `faculty` | YES | NO | ✅ keep |
| ta | `classroom` | YES | YES | ⚠ overlap; URL match catches it |
| content_manager | `authoring` | YES | NO | ✅ keep |
| support | `audit` | YES | NO | ✅ keep |
| moderator | `community` | YES | YES | ⚠ overlap; URL match catches it |
| super_admin | `audit` | YES | NO | ✅ keep |

**Proposed adjustments** (will use these unless owner overrides in review):

- **`student`: `tutor` → `registration`.** `tutor` isn't in student's sidebar (only in student's PUBLIC navbar). After login the user is in WORKSPACE mode where `.nav-links` is `display: none`. `registration` IS in student's sidebar and IS student-unique.
- **`parent`, `ta`, `moderator`**: keep the owner-specified sentinel. The URL match assertion is the primary catch for the student-fallback bug — if a role wrongly buckets to student, URL would be `/progress` (not `/parent`/`/ta`/`/moderate`) and the URL-match assertion fails. The sentinel assertion is defense-in-depth against a different kind of bug (someone accidentally removes role-specific items from the sidebar data).

The owner's spec said "expect role-distinctive nav item visible" + "open sidebar drawer، expect same sentinel in side-nav". Since the navbar is hidden in workspace mode, the spec drops the navbar-assertion step and uses only the sidebar assertion (which is what the user actually sees post-login). If the owner wants the navbar assertion too, the spec can navigate to `/home` after login and run that check — adds ~1s per role × 10 = 10s. Owner override in review if desired.

## What R7.9 deliberately does NOT do

- **R7.11 multi-role hierarchy UI.** Owner-gated. The mapper highest-privilege return (e.g., admin + instructor → admin) is in effect, but no UI lets the user "switch workspace" between roles. R7.11 stays gated.
- **R7.12 mini-variant sidebar.** New scope per D23. Blocked on R7.9 ack per the user's R7.9 sequencing.
- **Touch the `NAV_ITEMS_BY_ROLE` / `SIDEBAR_BY_ROLE` data.** Both are already 10/10 distinct per the FINDING-2 audit. No data change needed.
- **Phase B Profile model.** OWNER-FINDING-1 (avatar) stays in PHASE_A_OUT_OF_SCOPE.md.
- **R7.7a/b/c/d.** Owner-gated post-measurement.

## DoD for R7.9

- [ ] Memo committed first (this file)
- [ ] `apps/web/src/auth/role-map.ts` created with the 10-role mapper
- [ ] `LoginPage.tsx` swapped to use the import
- [ ] `Auth.tsx` swapped to use the import
- [ ] `gate-a-role-routing.spec.ts` written + tagged `gate-a`
- [ ] Local `npm run build` clean
- [ ] R1.1 + R6.6 regression — green (chrome unchanged, expect no diff)
- [ ] `gate-a-role-routing` spec — **10/10 pass** (URL match + sidebar sentinel for each demo user)
- [ ] `gate-a-role-dashboards` re-run — confirm screenshots now differ across roles (file sizes diverge)
- [ ] axe-scan — no new violations introduced (R7.9 doesn't touch ARIA / contrast / labels)
- [ ] Review doc with before/after URL landing matrix + spec output
- [ ] D13 owner manual smoke pause (3 demo users: student + parent + super_admin)
- [ ] R7.12 does not start until owner explicitly approves the R7.12 memo + D23 risk review

## Budget

| Component | Est. lines |
|---|---|
| `apps/web/src/auth/role-map.ts` (new) | ~30 (function + doc comment) |
| `apps/web/src/pages/auth/LoginPage.tsx` (delete + import) | net −6 |
| `apps/web/src/pages/Auth.tsx` (delete + import) | net −6 |
| `apps/web/tests/visual/gate-a-role-routing.spec.ts` (new) | ~120 (10 role configs + spec body + helpers) |
| `docs/PHASE_A_R7_9_MEMO.md` (this file) | ~200 |
| `docs/PHASE_A_R7_9_REVIEW.md` | ~100 |
| **Total** | **~440 lines** |

Over the 300-line target. Per R1.1-D7 the code/spec coupling rule applies — the spec is the D18 flow assertion contract for the mapper change; splitting test from code would violate the vasle-pinneh-avoidance directive. Most of the budget is the spec (120) + this memo (200). The actual code surface area is small (~36 lines net).

## Sequencing constraint reminder

Per D17 + user-message 2026-05-23:
1. R7.6 ✅ (D19 ack)
2. R7.5 ✅ (D22 ack)
3. **R7.9 ← NOW**
4. Owner D13 smoke + 3 decisions (R7.9 pass/fail, R7.12 plan approve, Performance track timing)
5. R7.12 (mini-variant sidebar) if owner approves
6. Measurement re-run
7. Owner gate for R7.7 + Performance track
