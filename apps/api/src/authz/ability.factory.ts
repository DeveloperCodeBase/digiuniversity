import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/auth.types";

import { AppAbility } from "./ability.types";

/**
 * Phase-15 R6: build the CASL ability set for one authenticated user.
 *
 * `RolesGuard` is the *coarse* gate ("this endpoint is for admins
 * only"). `PoliciesGuard` + `@CheckPolicies` is the *fine* gate ("this
 * admin can read AuditLog but not delete Tenant"). The two layers
 * cooperate: RolesGuard is cheap and short-circuits unauthorized
 * roles; PoliciesGuard adds subject-level + record-level checks.
 *
 * Modeling principle — start broad-by-role, narrow as needed:
 *   - super_admin → manage *all* (cross-tenant break-glass).
 *   - admin       → manage everything *within their tenant*.
 *   - instructor  → manage course-shaped subjects (Course, Cohort,
 *                   Assessment, ClassSession, Recording, Document).
 *                   Can grade Submissions, cannot moderate Audit.
 *   - ta          → grade Submissions, read course material; cannot
 *                   change course structure.
 *   - content_manager → manage Course/Module/Lesson/Asset content
 *                       without touching enrollments or grades.
 *   - support     → read AuditLog, User, Tenant for forensics; no
 *                   writes except User reset flows (covered by
 *                   user.password.change endpoint).
 *   - moderator   → moderate Document / discussion content (the
 *                   discussion forum is Phase 18 work; the verb is
 *                   already wired so the policies don't need a
 *                   second migration when that lands).
 *   - parent      → read their child's Enrollment / Submission /
 *                   LearningEvent. The "their child" scoping needs
 *                   relationship-aware policies; this round wires
 *                   the read verb, the relationship check is a
 *                   follow-up (tracked in PHASE_15_REVIEW).
 *   - org         → read their org's User + Enrollment +
 *                   LearningEvent. Same relationship caveat as parent.
 *   - student     → read their own everything + enroll + create their
 *                   own Submission. Read on Course is broad — every
 *                   student can browse the catalogue.
 *
 * Record-level scoping (e.g. "instructor on courseX but not courseY")
 * is intentionally NOT enforced here yet. CASL supports it via a
 * second argument `ability.can("update", subject("Course", row))` but
 * each controller needs to pass the loaded row. That sweep is the
 * second pass of R6; this commit ships the verb+subject layer so the
 * UI can already render `<Can>` correctly for the common case.
 */
@Injectable()
export class AbilityFactory {
  createForUser(user: AuthenticatedUser | null | undefined): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // Anonymous: no roles, no abilities. Endpoints that need
    // unauthenticated access already use @Public so PoliciesGuard
    // returns early; this branch covers the "no role on file" case.
    if (!user || !user.roles || user.roles.length === 0) {
      return build();
    }

    const roles = new Set(user.roles);

    // ===== super_admin — cross-tenant break-glass =====
    if (roles.has("super_admin")) {
      can("manage", "all");
      // Even super_admin can't delete the audit trail itself — keep
      // forensic continuity. AuditLog rows are append-only by
      // policy; the table is also FK-protected on tenant cascade
      // but actor SET NULL so deleted users leave their trail.
      cannot("delete", "AuditLog");
      return build();
    }

    // ===== admin — full control within their tenant =====
    if (roles.has("admin")) {
      can("manage", "all");
      cannot("delete", "AuditLog");
      // Tenant-creation is a super_admin operation; admins live
      // *inside* a tenant and cannot spawn new ones.
      cannot("create", "Tenant");
      cannot("delete", "Tenant");
      return build();
    }

    // ===== instructor — course-shaped subjects + grading =====
    if (roles.has("instructor")) {
      can(["create", "read", "update", "publish"], "Course");
      can(["create", "read", "update"], "Cohort");
      can(["create", "read", "update"], "Assessment");
      can(["create", "read", "update", "delete"], "Question");
      can("read", "Enrollment");
      can(["read", "grade"], "Submission");
      can(["create", "read", "update", "delete"], "ClassSession");
      can(["create", "read", "update", "delete"], "Recording");
      can(["create", "read", "update", "delete"], "Document");
      can(["create", "read"], "TutorSession");
      can("create", "LearningEvent");
      can("read", "LearningEvent");
      // Read-only on the structural catalogue
      can("read", ["Faculty", "Department", "Program"]);
      // Tenant + audit are off-limits
    }

    // ===== ta — grading + course reads =====
    if (roles.has("ta")) {
      can("read", "Course");
      can("read", "Cohort");
      can("read", "Assessment");
      can("read", "Question");
      can("read", "Enrollment");
      can(["read", "grade"], "Submission");
      can("read", "ClassSession");
      can("read", "Recording");
      can("read", "Document");
      can("create", "LearningEvent");
      can("read", "LearningEvent");
    }

    // ===== content_manager — owns the catalogue, not enrollments =====
    if (roles.has("content_manager")) {
      can(["create", "read", "update", "publish"], "Course");
      can(["create", "read", "update", "delete"], "Assessment");
      can(["create", "read", "update", "delete"], "Question");
      can(["create", "read", "update", "delete"], "Document");
      can("read", ["Faculty", "Department", "Program", "Cohort"]);
      // No access to grades or enrollments — those belong to academic ops
    }

    // ===== support — forensics + user reset =====
    if (roles.has("support")) {
      can("read", "User");
      can("read", "Tenant");
      can("read", "AuditLog");
      can("read", "AiLog");
      can("read", "LearningEvent");
      can("update", "User"); // for password reset flows
    }

    // ===== moderator — discussion + document moderation =====
    if (roles.has("moderator")) {
      can(["read", "moderate", "delete"], "Document");
      // Discussion / forum subjects will land in Phase 18; the verb
      // is already in the taxonomy.
    }

    // ===== parent — their child's records (scoping deferred) =====
    if (roles.has("parent")) {
      can("read", "Enrollment");
      can("read", "Submission");
      can("read", "LearningEvent");
      can("read", "Course");
    }

    // ===== org — their org's people (scoping deferred) =====
    if (roles.has("org")) {
      can("read", "User");
      can("read", "Enrollment");
      can("read", "LearningEvent");
      can("read", "Course");
    }

    // ===== student — their own work + browse the catalogue =====
    if (roles.has("student")) {
      can("read", ["Faculty", "Department", "Program", "Course"]);
      can("read", "Assessment");
      can("read", "ClassSession");
      can("read", "Recording");
      can(["create", "read"], "Enrollment");
      can(["create", "read"], "Submission");
      can(["create", "read"], "TutorSession");
      can("create", "LearningEvent");
      can("read", "LearningEvent");
    }

    return build();
  }
}
