import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

/** Input for writing an audit-log row. */
export interface AuditLogInput {
  tenantId: string;
  /** Null for system-initiated actions (cron, seeder). */
  actorId?: string | null;
  /** Dotted resource:verb identifier, e.g. "course.create". */
  action: string;
  /** Free-form subject identifier, e.g. "Course:abc123". */
  subject: string;
  /** Pre-mutation snapshot (or null on create). */
  before?: Prisma.InputJsonValue | null;
  /** Post-mutation snapshot (or null on delete). */
  after?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
  /** Joins to AiInteractionLog + access log. */
  requestId?: string | null;
}

/**
 * AuditLogService — single write path for the AuditLog table.
 *
 * Phase 15 R2. Controllers that mutate sensitive state call
 * `audit.log({...})`. The Phase-15 R2 AuditInterceptor (next file)
 * also calls it generically for every mutating endpoint that returns
 * 2xx, capturing method + path + actor + ip + ua.
 *
 * Writes are best-effort: if the DB insert fails (e.g. transient
 * network), we log to console + return without throwing. Failing
 * the originating request because the audit row couldn't write would
 * be worse than missing one row in the audit trail.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          actorId: input.actorId ?? null,
          action: input.action,
          subject: input.subject,
          // Prisma's JSON columns accept null only via Prisma.JsonNull;
          // we map our `undefined | null` to either skip the field
          // (undefined) or store explicit JSON null.
          before: input.before === undefined
            ? undefined
            : input.before === null
              ? Prisma.JsonNull
              : input.before,
          after: input.after === undefined
            ? undefined
            : input.after === null
              ? Prisma.JsonNull
              : input.after,
          ip: input.ip?.slice(0, 64) ?? null,
          userAgent: input.userAgent?.slice(0, 512) ?? null,
          requestId: input.requestId ?? null,
        },
      });
    } catch (err) {
      // Audit writes must NEVER fail the request. Log + swallow.
      this.logger.error(
        `audit log write failed action=${input.action} subject=${input.subject}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}

