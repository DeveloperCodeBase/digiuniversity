import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

class ListAuditLogsQuery {
  @IsOptional() @IsString() @MaxLength(128) action?: string;
  @IsOptional() @IsString() @MaxLength(256) subject?: string;
  @IsOptional() @IsString() @MaxLength(64) actorId?: string;
  @IsOptional() @IsString() @MaxLength(64) requestId?: string;
  // ISO date string; if present, returns rows AFTER this timestamp.
  @IsOptional() @IsString() @MaxLength(40) since?: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) limit?: number;
  @IsOptional() @IsInt() @Min(0) offset?: number;
}

/**
 * Admin / super-admin viewer for the AuditLog table.
 *
 * Phase 15 R2. Filters via query string; always scoped to the actor's
 * tenant (so admin of tenant A can NEVER see tenant B's logs).
 * Pagination via limit + offset; max 200 per page to keep responses
 * bounded. Phase 21 (security) extends this with retention policy +
 * SIEM export.
 *
 * Role gate: admin, super_admin, and support (read-only — phase 15 R3
 * narrows via CASL but the @Roles guard is a working baseline today).
 */
@Controller("audit-logs")
@Roles("admin", "super_admin", "support")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() q: ListAuditLogsQuery,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const cappedLimit = Math.min(Math.max(limit, 1), 200);
    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (q.action) where.action = { contains: q.action };
    if (q.subject) where.subject = { contains: q.subject };
    if (q.actorId) where.actorId = q.actorId;
    if (q.requestId) where.requestId = q.requestId;
    if (q.since) {
      const sinceDate = new Date(q.since);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where: where as never }),
      this.prisma.auditLog.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        take: cappedLimit,
        skip: offset,
        include: {
          actor: {
            select: { id: true, email: true, fullName: true },
          },
        },
      }),
    ]);

    return { total, limit: cappedLimit, offset, items };
  }
}
