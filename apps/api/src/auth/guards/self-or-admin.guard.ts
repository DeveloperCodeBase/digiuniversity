// apps/api/src/auth/guards/self-or-admin.guard.ts
//
// Phase B R3.a Commit B (D69) — SelfOrAdmin authorization guard.
//
// Companion to @SelfOrAdmin() decorator. Resolves the metadata, looks
// up the target user id per the strategy (param | body | none), and
// gates access to:
//   1. Admins (always allowed — short-circuit).
//   2. The owning user (own.userId === target.userId).
//
// Throws ForbiddenException with a precise message on rejection so
// e2e tests can assert on the reason.
//
// IMPORTANT: this guard is OPT-IN via @SelfOrAdmin on the handler. If
// no metadata is present, the guard short-circuits to allow (so the
// guard can be registered globally without breaking endpoints that
// rely on @Roles instead). The actual gating happens only on handlers
// that explicitly opt in.

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedUser } from "../auth.types";
import {
  SELF_OR_ADMIN_KEY,
  type SelfOrAdminOptions,
} from "../decorators/self-or-admin.decorator";

interface RequestShape {
  user?: AuthenticatedUser;
  params?: Record<string, string | undefined>;
  body?: Record<string, unknown> | undefined;
}

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // `getAllAndOverride` lets a method-level decorator override a
    // (hypothetical) class-level one. Using `null` sentinel above so we
    // can distinguish "decorator present with undefined opts" from
    // "decorator absent entirely". A truly absent decorator → reflector
    // returns `undefined`; a present decorator with no opts → `null`.
    const opts = this.reflector.getAllAndOverride<SelfOrAdminOptions | null>(SELF_OR_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @SelfOrAdmin on this handler at all — pass through.
    if (opts === undefined) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestShape>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException("authentication required");
    }

    // Admin short-circuit. Audit semantic per D69: actorId stays
    // `user.userId` regardless; the AuditInterceptor reads it from
    // `req.user`, not from the target. So an admin editing another
    // user's profile shows up in the log as `actor = admin.id`,
    // `subject = "Profile:<target.id>"`.
    if (user.roles.includes("admin")) {
      return true;
    }

    // Self-only handler (no target user id strategy) — authenticated
    // user is implicitly the target (e.g. GET /v1/profile resolves
    // userId from the JWT, not from a path param). Already authn'd
    // above, so allow.
    if (opts === null) {
      return true;
    }

    // Resolve target user id per the configured strategy.
    let targetUserId: string | undefined;
    if (opts.userIdFrom === "param") {
      targetUserId = req.params?.[opts.paramName];
    } else if (opts.userIdFrom === "body") {
      const raw = req.body?.[opts.bodyKey];
      targetUserId = typeof raw === "string" ? raw : undefined;
    }

    if (!targetUserId) {
      throw new ForbiddenException(
        `SelfOrAdmin: could not resolve target user id from ${opts.userIdFrom} '${
          opts.userIdFrom === "param" ? opts.paramName : opts.bodyKey
        }'`,
      );
    }

    if (user.userId !== targetUserId) {
      throw new ForbiddenException(
        "only the resource owner or an admin may perform this action",
      );
    }

    return true;
  }
}
