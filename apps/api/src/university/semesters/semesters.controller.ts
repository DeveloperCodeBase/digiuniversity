// Phase B B.1a — Semester controller.
//
// CRUD endpoints for the Semester entity. Each Semester belongs to a
// University which belongs to a Tenant. Scoping rule: a Semester is
// only accessible from the tenant that owns its University.
//
// Date semantics (memo Q2/Q3 defaults):
//   - All dates stored as ISO timestamps (UTC under the hood, Prisma
//     handles the conversion).
//   - Frontend renders via toFa() + Jalaali helper; backend is
//     timezone-agnostic.
//
// API surface:
//   GET    /semesters?universityId=X   — list non-deleted in a uni
//   GET    /semesters/:id              — get by id (tenant-scoped)
//   POST   /semesters                  — admin only; requires universityId
//   PATCH  /semesters/:id              — admin only; field updates
//   DELETE /semesters/:id              — admin only; soft-delete
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

const TERM_TYPES = ["FALL", "SPRING", "SUMMER", "INTERSESSION"] as const;
const SEMESTER_STATUSES = ["upcoming", "open", "active", "closed", "archived"] as const;

class CreateSemesterDto {
  @IsString() @MinLength(2) @MaxLength(64) universityId!: string;
  @IsString() @MinLength(2) @MaxLength(64) code!: string;
  @IsString() @MinLength(2) @MaxLength(160) nameFa!: string;
  @IsIn(TERM_TYPES as unknown as string[]) termType!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsOptional() @IsDateString() registrationOpen?: string;
  @IsOptional() @IsDateString() registrationClose?: string;
  @IsOptional() @IsIn(SEMESTER_STATUSES as unknown as string[]) status?: string;
}

class UpdateSemesterDto {
  @IsOptional() @IsString() @MaxLength(160) nameFa?: string;
  @IsOptional() @IsIn(TERM_TYPES as unknown as string[]) termType?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsDateString() registrationOpen?: string;
  @IsOptional() @IsDateString() registrationClose?: string;
  @IsOptional() @IsIn(SEMESTER_STATUSES as unknown as string[]) status?: string;
}

@Controller("semesters")
export class SemestersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("universityId") universityId?: string,
  ) {
    const where: Record<string, unknown> = { tenantId: user.tenantId, deletedAt: null };
    if (universityId) where.universityId = universityId;
    return this.prisma.semester.findMany({
      where,
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        universityId: true,
        code: true,
        nameFa: true,
        termType: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        registrationClose: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.semester.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("semester not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("semester.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSemesterDto) {
    // Verify the universityId is in the same tenant (defense in depth on
    // top of the RBAC layer — prevents cross-tenant semester injection
    // via a forged universityId).
    const university = await this.prisma.university.findFirst({
      where: { id: dto.universityId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!university) throw new BadRequestException("university not found or not in tenant");
    return this.prisma.semester.create({
      data: {
        tenantId: user.tenantId,
        universityId: dto.universityId,
        code: dto.code,
        nameFa: dto.nameFa,
        termType: dto.termType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        registrationOpen: dto.registrationOpen ? new Date(dto.registrationOpen) : null,
        registrationClose: dto.registrationClose ? new Date(dto.registrationClose) : null,
        status: dto.status ?? "upcoming",
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("semester.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateSemesterDto,
  ) {
    const existing = await this.prisma.semester.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("semester not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    const data: Record<string, unknown> = { updatedBy: user.userId };
    if (dto.nameFa !== undefined) data.nameFa = dto.nameFa;
    if (dto.termType !== undefined) data.termType = dto.termType;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.registrationOpen !== undefined) data.registrationOpen = new Date(dto.registrationOpen);
    if (dto.registrationClose !== undefined) data.registrationClose = new Date(dto.registrationClose);
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.semester.update({ where: { id }, data });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("semester.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.semester.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("semester not found");
    await this.prisma.semester.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
