// Phase B R1 Commit B (D62) — Schools controller.
//
// Sits one level above Faculty in the Academic Hierarchy:
//   School → Faculty → Department → Program → (Course | Cohort)
//
// Pattern matched to FacultiesController:
//   • tenant-scoped on every read via @CurrentUser().tenantId
//   • soft-delete: filter deletedAt=null on read; set deletedAt on delete
//   • @Roles("admin") guard on every mutation
//   • @AuditAction(...) on every mutation per Phase A R4 lint rule
//   • inline DTO classes with class-validator decorators
//   • _count: faculties on list view so the admin UI can render a count
//     badge per school without N+1
//
// School-specific bits:
//   • nameFa is required (Persian source of truth per D63 Q4.a spirit);
//     name in Faculty/Dept/Program stays as `name` for backward compat.
//   • nameEn, shortCode, description, iconName, sortOrder, charterDate
//     are optional.
//   • Uniqueness enforced by @@unique([tenantId, slug]) and
//     @@unique([tenantId, shortCode]) — Prisma throws P2002 on collision,
//     surfaced as BadRequest with a friendly message.

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
import { Prisma } from "@prisma/client";
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

class CreateSchoolDto {
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) nameFa!: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32)  shortCode?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(64)  iconName?: string;
  @IsOptional() @IsInt() @Min(0)            sortOrder?: number;
  @IsOptional() @IsISO8601()                charterDate?: string;
}

class UpdateSchoolDto {
  @IsOptional() @IsString() @MaxLength(160) nameFa?: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32)  shortCode?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(64)  iconName?: string;
  @IsOptional() @IsInt() @Min(0)            sortOrder?: number;
  @IsOptional() @IsISO8601()                charterDate?: string;
}

@Controller("schools")
export class SchoolsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.school.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { nameFa: "asc" }],
      select: {
        id: true,
        slug: true,
        nameFa: true,
        nameEn: true,
        shortCode: true,
        description: true,
        iconName: true,
        sortOrder: true,
        charterDate: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { faculties: { where: { deletedAt: null } } } },
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.school.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        faculties: {
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          select: { id: true, slug: true, name: true, nameEn: true, shortCode: true },
        },
      },
    });
    if (!row) throw new NotFoundException("school not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("school.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSchoolDto) {
    try {
      return await this.prisma.school.create({
        data: {
          tenantId: user.tenantId,
          slug: dto.slug.toLowerCase(),
          nameFa: dto.nameFa,
          nameEn: dto.nameEn,
          shortCode: dto.shortCode?.toUpperCase(),
          description: dto.description,
          iconName: dto.iconName,
          sortOrder: dto.sortOrder ?? 0,
          charterDate: dto.charterDate ? new Date(dto.charterDate) : null,
          createdBy: user.userId,
          updatedBy: user.userId,
        },
      });
    } catch (err) {
      // P2002 = Unique constraint failed on the fields: (tenantId, slug)
      // OR (tenantId, shortCode). Map to BadRequest so frontend can
      // surface a field-level message instead of a 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "";
        throw new BadRequestException(
          target.includes("shortCode")
            ? "shortCode already in use within this tenant"
            : "slug already in use within this tenant",
        );
      }
      throw err;
    }
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("school.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateSchoolDto,
  ) {
    const existing = await this.prisma.school.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("school not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    try {
      return await this.prisma.school.update({
        where: { id },
        data: {
          ...dto,
          shortCode: dto.shortCode?.toUpperCase(),
          charterDate: dto.charterDate ? new Date(dto.charterDate) : undefined,
          updatedBy: user.userId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("shortCode already in use within this tenant");
      }
      throw err;
    }
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("school.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.school.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      select: { id: true, _count: { select: { faculties: { where: { deletedAt: null } } } } },
    });
    if (!existing) throw new NotFoundException("school not found");
    // Soft-delete only. The DB-level FK is ON DELETE SET NULL so even a
    // future hard-delete escape hatch wouldn't orphan-cascade Faculty
    // rows — they'd lose schoolId but keep their data. For soft-delete
    // we don't touch the children at all; they remain referenced via
    // schoolId until admin explicitly reassigns.
    await this.prisma.school.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true, facultyCount: existing._count.faculties };
  }
}
