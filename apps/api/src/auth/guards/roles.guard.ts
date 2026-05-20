import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedUser } from "../auth.types";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Allow access when the authenticated user has at least one of the
 * roles named via @Roles(...). Routes without @Roles default to "any
 * authenticated user is fine".
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException("authentication required");
    }
    const ok = required.some((r) => user.roles.includes(r));
    if (!ok) {
      throw new ForbiddenException(
        `role required: one of [${required.join(", ")}] (got [${user.roles.join(", ")}])`,
      );
    }
    return true;
  }
}
