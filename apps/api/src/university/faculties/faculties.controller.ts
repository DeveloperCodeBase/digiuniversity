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
import { Prisma } from "@prisma/client";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

// Phase B R1 Commit C (D63) — DTOs extended with the additive columns
// from Commit A's migration: schoolId (optional FK to new School table),
// nameEn (optional English mirror), shortCode (optional org code).
// Existing `name` and `description` fields preserved unchanged.
class CreateFacultyDto {
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32)  shortCode?: string;
  @IsOptional() @IsString() @MaxLength(64)  schoolId?: string;
}

class UpdateFacultyDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32)  shortCode?: string;
  // schoolId is a string OR explicit null (to detach from a school).
  // class-validator's @IsString() rejects null, so we accept any string
  // here and let the service layer treat empty string as "detach".
  @IsOptional() @IsString() @MaxLength(64)  schoolId?: string;
}

@Controller("faculties")
export class FacultiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    // Phase B R1 Commit C — optional ?schoolId= filter for the admin UI's
    // nested-resource view ("show only faculties under School X"). Omit
    // the param to list all faculties (legacy admin views unchanged).
    @Query("schoolId") schoolId?: string,
  ) {
    return this.prisma.faculty.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(schoolId ? { schoolId } : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        shortCode: true,
        schoolId: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        school: { select: { id: true, slug: true, nameFa: true, shortCode: true } },
        _count: { select: { departments: { where: { deletedAt: null } } } },
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.faculty.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("faculty not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("faculty.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFacultyDto) {
    // If schoolId provided, verify it belongs to the same tenant + isn't
    // soft-deleted. Without this guard a cross-tenant id would create an
    // orphaned reference (FK exists DB-side but the school is invisible
    // to this tenant's reads).
    if (dto.schoolId) {
      const school = await this.prisma.school.findFirst({
        where: { id: dto.schoolId, tenantId: user.tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!school) throw new BadRequestException("school not found in this tenant");
    }
    try {
      return await this.prisma.faculty.create({
        data: {
          tenantId: user.tenantId,
          slug: dto.slug.toLowerCase(),
          name: dto.name,
          nameEn: dto.nameEn,
          shortCode: dto.shortCode?.toUpperCase(),
          description: dto.description,
          schoolId: dto.schoolId,
          createdBy: user.userId,
          updatedBy: user.userId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("slug already in use within this tenant");
      }
      throw err;
    }
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("faculty.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateFacultyDto,
  ) {
    const existing = await this.prisma.faculty.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("faculty not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    // Same tenant-scope school check as create. Empty-string schoolId
    // means "detach from current school" → translate to null.
    let resolvedSchoolId: string | null | undefined = undefined;
    if (dto.schoolId !== undefined) {
      if (dto.schoolId === "") {
        resolvedSchoolId = null;
      } else {
        const school = await this.prisma.school.findFirst({
          where: { id: dto.schoolId, tenantId: user.tenantId, deletedAt: null },
          select: { id: true },
        });
        if (!school) throw new BadRequestException("school not found in this tenant");
        resolvedSchoolId = school.id;
      }
    }
    return this.prisma.faculty.update({
      where: { id },
      data: {
        ...dto,
        shortCode: dto.shortCode?.toUpperCase(),
        schoolId: resolvedSchoolId,
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("faculty.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.faculty.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("faculty not found");
    await this.prisma.faculty.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
