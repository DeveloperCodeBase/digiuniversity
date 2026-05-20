import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth.types";

/**
 * Inject the authenticated principal (resolved by JwtStrategy) into a
 * controller method. Always paired with JwtAuthGuard.
 *
 * Example:
 *   @Get("me")
 *   me(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator<undefined, ExecutionContext, AuthenticatedUser>(
  (_data, ctx) => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return req.user;
  },
);
