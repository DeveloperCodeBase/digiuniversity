import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "requiredRoles";

/**
 * Restrict a route to specific role names. The RolesGuard rejects with 403
 * unless the authenticated user has at least one of the listed roles.
 *
 * Example:
 *   @Roles("admin")
 *   @Get("tenants")
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
