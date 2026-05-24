// Phase B B.1a — University controller.
//
// CRUD endpoints for the University top-level entity. Scoped to the
// authed user's tenant. Mirrors the Faculty/Department/Program shape:
// soft-delete (deletedAt), audit fields (createdBy/updatedBy), RBAC via
// @Roles, audit-trail via @AuditAction (R4 lint rule enforces this on
// every mutation).
//
// API surface:
//   GET    /universities         — list non-deleted for tenant
//   GET    /universities/:id     — get by id (404 if missing or deleted)
//   POST   /universities         — admin only; create with @AuditAction
//   PATCH  /universities/:id     — admin only; update with @AuditAction
//   DELETE /universities/:id     — admin only; soft-delete with @AuditAction
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

const UNIVERSITY_STATUSES = ["active", "suspended", "dissolved"] as const;

class CreateUniversityDto {
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) nameFa!: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsString() @MinLength(2) @MaxLength(16) shortCode!: string;
  @IsDateString() charterDate!: string;
  @IsOptional() @IsIn(UNIVERSITY_STATUSES as unknown as string[]) status?: string;
}

class UpdateUniversityDto {
  @IsOptional() @IsString() @MaxLength(160) nameFa?: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(16) shortCode?: string;
  @IsOptional() @IsDateString() charterDate?: string;
  @IsOptional() @IsIn(UNIVERSITY_STATUSES as unknown as string[]) status?: string;
}

@Controller("universities")
export class UniversitiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.university.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { nameFa: "asc" },
      select: {
        id: true,
        slug: true,
        nameFa: true,
        nameEn: true,
        shortCode: true,
        charterDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { semesters: { where: { deletedAt: null } } } },
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.university.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("university not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("university.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUniversityDto) {
    return this.prisma.university.create({
      data: {
        tenantId: user.tenantId,
        slug: dto.slug.toLowerCase(),
        nameFa: dto.nameFa,
        nameEn: dto.nameEn ?? null,
        shortCode: dto.shortCode.toUpperCase(),
        charterDate: new Date(dto.charterDate),
        status: dto.status ?? "active",
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("university.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateUniversityDto,
  ) {
    const existing = await this.prisma.university.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("university not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    const data: Record<string, unknown> = { updatedBy: user.userId };
    if (dto.nameFa !== undefined) data.nameFa = dto.nameFa;
    if (dto.nameEn !== undefined) data.nameEn = dto.nameEn;
    if (dto.shortCode !== undefined) data.shortCode = dto.shortCode.toUpperCase();
    if (dto.charterDate !== undefined) data.charterDate = new Date(dto.charterDate);
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.university.update({ where: { id }, data });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("university.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.university.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("university not found");
    await this.prisma.university.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
