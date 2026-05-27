import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { LegacySyncService } from "./legacy-sync.service";

class CreateCohortDto {
  @IsString() @MinLength(2) @MaxLength(64) programId!: string;
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
}

class UpdateCohortDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
}

class ListCohortsQueryDto {
  @IsOptional() @IsString() programId?: string;
}

// Phase B R2 Commit C — Sunset + Deprecation headers per
// MIGRATION_POLICY §6. The deprecation window starts now; the drop
// gate (per §5 stage 3) waits for 7 consecutive days of zero
// MigrationSyncLog rows with `action: create` from the Cohort side
// AND zero direct reads measured in access logs. Earliest drop date
// (per §6 ≥4 sprints rule) is 2026-12-31.
const SUNSET_HEADER = "Wed, 31 Dec 2026 23:59:59 GMT";
const DEPRECATION_HEADER = "true";
const LINK_HEADER = '</v1/offerings>; rel="successor-version"';

// NestJS @Header() is a METHOD decorator, not a class decorator. Apply
// the trio to each individual handler below. The Sunset / Deprecation
// / Link headers are added explicitly to every endpoint in this
// deprecated controller per MIGRATION_POLICY §6.
@Controller("cohorts")
export class CohortsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacySync: LegacySyncService,
  ) {}

  @Get()
  @Header("Sunset", SUNSET_HEADER)
  @Header("Deprecation", DEPRECATION_HEADER)
  @Header("Link", LINK_HEADER)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCohortsQueryDto,
  ) {
    return this.prisma.cohort.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(query.programId ? { programId: query.programId } : {}),
      },
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        startDate: true,
        endDate: true,
        programId: true,
        upgradedToOfferingId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get(":id")
  @Header("Sunset", SUNSET_HEADER)
  @Header("Deprecation", DEPRECATION_HEADER)
  @Header("Link", LINK_HEADER)
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.cohort.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("cohort not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Header("Sunset", SUNSET_HEADER)
  @Header("Deprecation", DEPRECATION_HEADER)
  @Header("Link", LINK_HEADER)
  @AuditAction("cohort.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCohortDto) {
    const program = await this.prisma.program.findFirst({
      where: { id: dto.programId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!program) {
      throw new BadRequestException("program does not exist in this tenant");
    }
    const cohort = await this.prisma.cohort.create({
      data: {
        tenantId: user.tenantId,
        programId: dto.programId,
        slug: dto.slug.toLowerCase(),
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
    // Dual-write: mirror to CourseOffering. Fire-and-await but the
    // service swallows errors so the cohort write isn't blocked.
    await this.legacySync.onCohortCreated(cohort, user.userId);
    // Re-read so the response includes upgradedToOfferingId set by sync.
    return this.prisma.cohort.findUnique({ where: { id: cohort.id } });
  }

  @Roles("admin")
  @Patch(":id")
  @Header("Sunset", SUNSET_HEADER)
  @Header("Deprecation", DEPRECATION_HEADER)
  @Header("Link", LINK_HEADER)
  @AuditAction("cohort.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateCohortDto,
  ) {
    const existing = await this.prisma.cohort.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("cohort not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    const updated = await this.prisma.cohort.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        updatedBy: user.userId,
      },
    });
    await this.legacySync.onCohortUpdated(updated, user.userId);
    return updated;
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @Header("Sunset", SUNSET_HEADER)
  @Header("Deprecation", DEPRECATION_HEADER)
  @Header("Link", LINK_HEADER)
  @AuditAction("cohort.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.cohort.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("cohort not found");
    await this.prisma.cohort.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    await this.legacySync.onCohortDeleted(existing, user.userId);
    return { deleted: true };
  }
}
