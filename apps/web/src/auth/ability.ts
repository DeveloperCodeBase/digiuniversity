// =====================================================
// CASL ability — SPA side
// =====================================================
//
// Phase-15 R7: rehydrate the packed ability rules the api ships in
// `/v1/auth/me`. The api builds the user's `AppAbility` via
// `AbilityFactory.createForUser()`, then serialises with
// `packRules(ability.rules)` — that's a tiny JSON array, on the order
// of bytes for a student and a few hundred bytes for an admin.
//
// The SPA gets the packed array, calls `unpackRules()` + builds an
// ability with `createMongoAbility()`, and hands it to a `<Can>`
// component via context.
//
// Subjects are string literals matching the api's `Subjects` union in
// apps/api/src/authz/ability.types.ts — every change there must be
// mirrored here. The future Phase-14-style `packages/shared-types`
// extraction would let both sides import a single union.
// =====================================================

import React from "react";
import {
  createMongoAbility,
  type MongoAbility,
  type RawRuleOf,
} from "@casl/ability";
import { unpackRules } from "@casl/ability/extra";

export type Actions =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "enroll"
  | "grade"
  | "moderate"
  | "manage";

export type Subjects =
  | "Tenant"
  | "User"
  | "Role"
  | "Faculty"
  | "Department"
  | "Program"
  | "Course"
  | "Cohort"
  | "Enrollment"
  | "Assessment"
  | "Question"
  | "Submission"
  | "LearningEvent"
  | "ClassSession"
  | "Recording"
  | "Document"
  | "TutorSession"
  | "AiLog"
  | "AuditLog"
  | "all";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Packed ability rules, as shipped by /v1/auth/me. The api uses
 * @casl/ability/extra's `packRules()`; the wire format is an array of
 * fixed-length tuples. We type it as `unknown[]` at the boundary
 * because the rule rows mix tuple shapes and are simpler to validate
 * via the CASL builder than via TypeScript narrowing — the cast
 * happens once inside `buildAbility` so callers stay loose.
 */
export type PackedRules = ReadonlyArray<unknown>;

/**
 * Build an `AppAbility` from the packed rules array. Returns an empty
 * ability if the input is missing or empty so consumers can always
 * call `ability.can(...)` without null checks.
 */
export const buildAbility = (packed?: PackedRules | null): AppAbility => {
  if (!packed || packed.length === 0) {
    return createMongoAbility<AppAbility>([]);
  }
  // `unpackRules` expects PackRule<R>[]. The wire payload from the api
  // is the matching shape — packed by packRules() server-side from
  // an AppAbility instance — but at the type-system seam we don't try
  // to re-prove that. The cast is the one place we trust the api
  // contract; if the api drifts, the runtime ability is empty (CASL
  // tolerates malformed rules by dropping them) and <Can> just
  // under-renders.
  // `unpackRules` is typed with a precise 6-tuple. Our wire payload is
  // produced by the matching `packRules()` on the api so it conforms
  // at runtime, but the type system can't see that through unknown[];
  // a single `as never` at the call site is the documented boundary.
  const rules = unpackRules(packed as never) as Array<RawRuleOf<AppAbility>>;
  return createMongoAbility<AppAbility>(rules);
};

/**
 * The CASL ability context. Co-located with the builder so Can.tsx
 * (consumer side) and AuthContext.tsx (producer side) can both import
 * from one place without an import cycle. Default is an empty ability
 * — every `<Can>` renders nothing until the AuthProvider populates it.
 */
export const AbilityContext = React.createContext<AppAbility>(buildAbility(null));
