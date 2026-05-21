import { Module, Global } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";

import { AuditController } from "./audit.controller";
import { AuditInterceptor } from "./audit.interceptor";
import { AuditLogService } from "./audit.service";

/**
 * Phase 15 R2 — audit-log infrastructure.
 *
 * - `AuditLogService` is exported (global) so any module can inject it
 *   and write a row with before/after snapshots when the interceptor's
 *   auto-derived action isn't sufficient (e.g. course publish wants
 *   the previous published-at value in `before`).
 * - `AuditInterceptor` is wired as `APP_INTERCEPTOR` so every mutating
 *   handler that returns 2xx logs a row automatically. Decorate
 *   handlers with `@AuditAction("clean.name")` to get a usable action
 *   string in queries; the fallback `<method>.<segment>` is functional
 *   but ugly.
 * - `AuditController` exposes `GET /v1/audit-logs` for admin /
 *   super_admin / support to query the table with filters + paging,
 *   always tenant-scoped.
 */
@Global()
@Module({
  providers: [
    AuditLogService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  controllers: [AuditController],
  exports: [AuditLogService],
})
export class AuditModule {}
