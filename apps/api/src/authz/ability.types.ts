/**
 * Phase-15 R6: action + subject taxonomy for the CASL ability layer.
 *
 * `Actions` is the verb side — what the user wants to do. We keep the
 * vocabulary small and stable so policies are easy to read in
 * controllers (`ability.can("grade", "Submission")` reads like English).
 * "manage" is CASL's well-known wildcard for "every action."
 *
 * `Subjects` is the noun side — what's being acted on. We use string
 * literal subjects rather than class references so the policy layer
 * doesn't need to import every Prisma model into every controller. The
 * subject names mirror the Prisma model names so the mapping is
 * obvious.
 *
 * Adding a new subject:
 *   1. Add the literal to `Subjects` below.
 *   2. Open ability.factory.ts and grant abilities to the relevant
 *      roles. Default is deny — anything not granted is forbidden.
 *   3. Use it on the controller: `@CheckPolicies((ab) => ab.can("update", "MyThing"))`.
 */

import { PureAbility } from "@casl/ability";
import type { AbilityClass } from "@casl/ability";

export type Actions =
  // CRUD primitives — used by most resources
  | "create"
  | "read"
  | "update"
  | "delete"
  // Domain-specific verbs we want to call out at the policy layer
  // rather than fold into "update" — they have different blast radius
  // and an instructor may have "update" without "publish".
  | "publish"
  | "enroll"
  | "grade"
  | "moderate"
  // CASL wildcard
  | "manage";

export type Subjects =
  // Identity / tenancy
  | "Tenant"
  | "User"
  | "Role"
  // University domain
  | "Faculty"
  | "Department"
  | "Program"
  | "Course"
  | "Cohort"
  | "Enrollment"
  // Learning surface
  | "Assessment"
  | "Question"
  | "Submission"
  | "LearningEvent"
  // Live + media
  | "ClassSession"
  | "Recording"
  // RAG / AI
  | "Document"
  | "TutorSession"
  | "AiLog"
  // Observability
  | "AuditLog"
  // CASL "everything" placeholder — only `manage all` matches it.
  | "all";

export type AppAbility = PureAbility<[Actions, Subjects]>;

// Class reference needed by `defineAbility()`/`AbilityBuilder` callers
// that prefer the class-style `Ability` over `createMongoAbility`.
export const AppAbility: AbilityClass<AppAbility> = PureAbility as unknown as AbilityClass<AppAbility>;
