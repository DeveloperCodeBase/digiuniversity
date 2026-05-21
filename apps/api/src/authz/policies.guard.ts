import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedUser } from "../auth/auth.types";

import { AbilityFactory } from "./ability.factory";
import {
  CHECK_POLICIES_KEY,
  type PolicyHandler,
} from "./check-policies.decorator";

/**
 * Phase-15 R6: fine-grained authorization guard.
 *
 * Runs AFTER RolesGuard in the APP_GUARD chain. RolesGuard already
 * rejected anyone outside the coarse role list; this guard adds
 * subject-level + verb-level checks on top.
 *
 * Endpoints without @CheckPolicies pass through unconditionally —
 * this is the migration-safe default. As controllers adopt
 * @CheckPolicies they get the fine-grained gate; pre-existing routes
 * stay protected by @Roles only.
 *
 * On denial we throw ForbiddenException with the action+subject the
 * policy denied. The error body never leaks the user's full ability
 * set, only the specific check that failed.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) ?? [];

    if (handlers.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException("authentication required");
    }

    const ability = this.abilityFactory.createForUser(user);
    for (const handler of handlers) {
      const ok =
        typeof handler === "function"
          ? handler(ability, req)
          : handler.handle(ability, req);
      if (!ok) {
        throw new ForbiddenException(
          "policy denied: insufficient permissions for this resource",
        );
      }
    }
    return true;
  }
}
