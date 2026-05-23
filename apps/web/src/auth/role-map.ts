// Phase-A R7.9 — single source of truth for API-role → local-RoleId.
//
// Before R7.9 this function lived duplicated in
//   - apps/web/src/pages/auth/LoginPage.tsx (line 224, the R5 redesign)
//   - apps/web/src/pages/Auth.tsx           (line 22,  the pre-R5 legacy)
// Both copies mapped only 3 of 10 API roles (admin, instructor,
// student). The other 7 roles (parent, org, ta, content_manager,
// support, moderator, super_admin — all introduced in Phase 15 R7)
// silently fell through to `return "student"`, which routed those
// users to /progress + showed them the student navbar + student
// sidebar instead of their own.
//
// Gate A's measurement caught it on 2026-05-23:
//   - §5 role-routing 🔴 FAIL: 7 of 10 demo users land on /progress
//   - OWNER-FINDING-2: every role sees the same nav / sidebar after login
//
// Both symptoms collapse to this one upstream bug. R7.9 fixes it +
// extracts to this module so the duplicate-and-drift pattern that
// kept the bug alive through R5 can't recur. Anyone calling
// apiRoleToLocal MUST import it from here.

import type { RoleId } from "../role";

/**
 * Map an API role list (e.g. `["instructor", "ta"]`) to a single local
 * `RoleId`. Highest privilege wins: a user with both `admin` +
 * `instructor` lands on the admin console (the more-privileged surface)
 * rather than the instructor one. The order below is the canonical
 * privilege hierarchy:
 *
 *   super_admin > admin > content_manager > moderator > support >
 *   instructor > ta > org > parent > student
 *
 * The hierarchy is privilege-of-action, not seniority — `super_admin`
 * is highest because they cross tenants; `parent` and `org` are above
 * `student` because they manage learners; `student` is the safe
 * default when nothing matches.
 *
 * NOTE on multi-role UX: this returns ONE local RoleId. A user with
 * multiple roles only sees their highest-privilege surface. R7.11
 * (workspace-switcher pattern, owner-gated) would let users toggle
 * between their roles. Not in this sub-R.
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
  // Unknown role → default to least-privileged. Better to under-grant
  // and let the user surface the problem than to over-grant.
  return "student";
};
