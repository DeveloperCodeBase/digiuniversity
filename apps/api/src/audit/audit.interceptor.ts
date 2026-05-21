import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { Observable, tap } from "rxjs";
import { randomUUID } from "node:crypto";

import type { AuthenticatedUser } from "../auth/auth.types";
import { AuditLogService } from "./audit.service";
import {
  AUDIT_ACTION_METADATA,
  AUDIT_SKIP_METADATA,
} from "./audit-action.decorator";

/**
 * Global interceptor that writes an AuditLog row for every successful
 * mutating endpoint (POST / PATCH / PUT / DELETE → 2xx). Skipped for:
 *   - safe HTTP methods (GET / HEAD / OPTIONS) — they read, don't mutate
 *   - routes decorated with @AuditSkip()
 *   - unauthenticated requests (we don't have a tenantId to scope under
 *     — most mutations require auth via JwtAuthGuard anyway)
 *   - failed requests (the tap operator only runs on success)
 *
 * The action name comes from `@AuditAction("course.create")` on the
 * handler if present, else falls back to `<method>.<first-segment>`
 * (e.g. `post.courses`). Subjects use the route param `:id` when
 * present, else the request path.
 *
 * `before`/`after` snapshots are NOT captured by the interceptor
 * (we'd have to query the DB before+after, which doubles I/O and
 * sometimes can't compute a clean diff). Controllers that need
 * full diff capture call `auditService.log({ before, after, ... })`
 * directly with handler-provided snapshots.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<
      Request & { user?: AuthenticatedUser; auditRequestId?: string }
    >();

    // Safe methods are read-only — never audited.
    const method = req.method?.toUpperCase();
    if (!method || method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next.handle();
    }

    // Explicit opt-out via @AuditSkip().
    const skip = this.reflector.getAllAndOverride<boolean | undefined>(
      AUDIT_SKIP_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return next.handle();

    // Stamp a request id so the audit row joins the access log + any
    // ai-bridge calls. Reuse an existing X-Request-Id header if a
    // reverse-proxy set one, else generate.
    const headerReqId = (req.headers["x-request-id"] || req.headers["x-correlation-id"]) as string | undefined;
    const requestId = (headerReqId && headerReqId.length <= 64) ? headerReqId : randomUUID();
    req.auditRequestId = requestId;

    return next.handle().pipe(
      tap({
        next: (response: unknown) => {
          // Only audit after a successful handler run (no throw).
          // Failures and 4xx/5xx are caught by Nest's exception filter
          // BEFORE this tap fires, so we don't reach here.
          const user = req.user;
          if (!user) {
            // No identity to audit against. Almost certainly an
            // unauthenticated public endpoint (e.g. /v1/auth/register
            // or /v1/auth/login) — those are noteworthy too but
            // require a tenantId we don't have here. Skip and let
            // those flows do their own logging.
            return;
          }

          // Action: handler decorator > class decorator > derived.
          const decorated = this.reflector.getAllAndOverride<string | undefined>(
            AUDIT_ACTION_METADATA,
            [context.getHandler(), context.getClass()],
          );
          const action = decorated || deriveAction(method, req.path);

          // Subject: response.id if returned, else route param :id, else path.
          const subject = deriveSubject(req, response);

          void this.audit.log({
            tenantId: user.tenantId,
            actorId: user.userId,
            action,
            subject,
            ip: extractIp(req),
            userAgent: req.headers["user-agent"]?.toString().slice(0, 512),
            requestId,
          });
        },
      }),
    );
  }
}

/** `post.courses` style fallback when no @AuditAction is set. */
function deriveAction(method: string, path: string): string {
  // /v1/courses/:id → courses (first non-version segment)
  const segments = (path || "/").split("/").filter(Boolean);
  const head = segments[0] === "v1" ? segments[1] : segments[0];
  return `${method.toLowerCase()}.${head || "unknown"}`;
}

/** `Course:abc123` style subject. */
function deriveSubject(
  req: Request & { user?: AuthenticatedUser },
  response: unknown,
): string {
  // Prefer the response's `id` field when it looks like a created/
  // updated resource.
  if (response && typeof response === "object") {
    const id = (response as { id?: unknown }).id;
    if (typeof id === "string" && id.length > 0 && id.length < 256) {
      return id;
    }
  }
  // Fall back to route param :id if present.
  const params = (req.params || {}) as Record<string, string>;
  if (params.id) return params.id;
  // Last resort: the path itself (sanitised to fit the subject column).
  return req.path.slice(0, 256);
}

/** Best-effort IP extraction respecting X-Forwarded-For from Caddy. */
function extractIp(req: Request): string | null {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    // First hop = original client. Take up to 64 chars to fit the column.
    return xff.split(",")[0].trim().slice(0, 64) || null;
  }
  return (req.ip || req.socket?.remoteAddress || "")?.slice(0, 64) || null;
}
