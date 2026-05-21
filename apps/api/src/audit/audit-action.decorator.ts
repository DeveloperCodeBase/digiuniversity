import { SetMetadata } from "@nestjs/common";

/**
 * Metadata key the AuditInterceptor reads to find the canonical action
 * name for a route. If unset, the interceptor falls back to a generic
 * `<lowercase-method>.<first-path-segment>` (e.g. `post.courses`) which
 * is functional but noisy in queries — prefer to decorate handlers
 * that touch sensitive state.
 */
export const AUDIT_ACTION_METADATA = "audit:action";

/**
 * Mark a route handler with the canonical action name to record in the
 * audit log. Used by AuditInterceptor.
 *
 * Examples:
 *   @AuditAction("course.create")   POST /v1/courses
 *   @AuditAction("course.publish")  POST /v1/courses/:id/publish
 *   @AuditAction("user.role.grant") POST /v1/users/:id/roles
 */
export const AuditAction = (name: string): MethodDecorator =>
  SetMetadata(AUDIT_ACTION_METADATA, name);

/**
 * Opt OUT of audit logging for a specific route. Use sparingly — only
 * for endpoints that mutate state but are explicitly non-sensitive
 * (e.g. heartbeat updates, throttled batched writes that would flood
 * the audit table).
 */
export const AUDIT_SKIP_METADATA = "audit:skip";
export const AuditSkip = (): MethodDecorator => SetMetadata(AUDIT_SKIP_METADATA, true);
