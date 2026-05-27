// apps/api/src/auth/decorators/self-or-admin.decorator.ts
//
// Phase B R3.a Commit B (D69) — SelfOrAdmin authorization primitive.
//
// /profile is the first non-admin endpoint in Phase B (R1 + R2 were
// 100% admin-only). The pattern: a resource is owned by exactly one
// user (Profile.userId, Student.userId, future ApplicationStatus.userId)
// and either the owner OR an admin can read/write it.
//
// The decorator just attaches metadata; SelfOrAdminGuard reads it and
// performs the gate. Always pair with @UseGuards(SelfOrAdminGuard) at
// the controller or method level.

import { SetMetadata } from "@nestjs/common";

export const SELF_OR_ADMIN_KEY = "auth:self-or-admin";

/**
 * Strategy for locating the target user id in the incoming request.
 *
 * - `param`: read from `request.params[paramName]` — usually URL like
 *   /v1/users/:userId/profile → `{ userIdFrom: 'param', paramName: 'userId' }`.
 * - `body`: read from `request.body[bodyKey]` — for PATCH endpoints
 *   that carry the target id in the payload.
 *
 * Omit entirely (just `@SelfOrAdmin()`) on handlers where there is no
 * target id and only the authenticated user's own resource is in scope
 * — the guard then becomes a thin "must be authenticated" check
 * (RolesGuard already handles authn, but the decorator is kept as
 * documentation that the endpoint is a self-service one).
 */
export type SelfOrAdminOptions =
  | { userIdFrom: "param"; paramName: string }
  | { userIdFrom: "body"; bodyKey: string }
  | undefined;

/**
 * Mark a handler as SelfOrAdmin-gated. The guard:
 *   1. Returns true immediately if the user holds the `admin` role.
 *   2. Otherwise extracts the target user id per the options. If the id
 *      matches `request.user.userId`, allow; else throw 403.
 *   3. Handlers passing `@SelfOrAdmin()` (no opts) only require
 *      authentication; the guard short-circuits to allow.
 *
 * Audit semantic (per D69): `AuditLog.actorId` is ALWAYS
 * `request.user.userId` — never the target user. The two-field
 * separation in AuditLog (actor + subject) preserves "who did what".
 *
 * Examples:
 *   @SelfOrAdmin()
 *   @Get('/v1/profile')
 *
 *   @SelfOrAdmin({ userIdFrom: 'param', paramName: 'userId' })
 *   @Get('/v1/users/:userId/profile')
 *
 *   @SelfOrAdmin({ userIdFrom: 'body', bodyKey: 'targetUserId' })
 *   @Patch('/v1/some/endpoint')
 */
export const SelfOrAdmin = (options?: SelfOrAdminOptions): MethodDecorator =>
  SetMetadata(SELF_OR_ADMIN_KEY, options ?? null);
