import { SetMetadata } from "@nestjs/common";

import type { AppAbility } from "./ability.types";

export const CHECK_POLICIES_KEY = "check_policies";

/**
 * A policy handler: given the request user's ability set, return true
 * if the request should be allowed. The function form lets callers
 * express arbitrary subject + record-level rules:
 *
 *   @CheckPolicies((ab) => ab.can("update", "Course"))
 *   @CheckPolicies((ab, req) => ab.can("grade", subject("Submission", req.params)))
 *
 * Multiple handlers can be combined — PoliciesGuard requires *all* to
 * pass (AND semantics). Use a single handler with `||` for OR.
 */
export type PolicyHandler =
  | ((ability: AppAbility, req: unknown) => boolean)
  | { handle: (ability: AppAbility, req: unknown) => boolean };

/**
 * Attach one or more policy handlers to a route. PoliciesGuard reads
 * the metadata, builds the user's ability via AbilityFactory, and
 * 403s if any handler returns false.
 *
 * Routes without @CheckPolicies pass through PoliciesGuard
 * unconditionally — this lets us layer the policy guard on top of
 * the existing @Roles flow without breaking any endpoint that hasn't
 * migrated yet.
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
