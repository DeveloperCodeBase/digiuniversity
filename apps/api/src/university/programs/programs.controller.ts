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
import { Throttle } from "@nestjs/throttler";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

const DEGREE_LEVELS = ["bachelor", "master", "phd", "certificate"] as const;

// Phase B R1 Commit D (D63) — DTOs extended with nameEn + shortCode.
class CreateProgramDto {
  @IsString() @MinLength(2) @MaxLength(64) departmentId!: string;
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() @IsIn([...DEGREE_LEVELS]) degreeLevel!: typeof DEGREE_LEVELS[number];
  @IsOptional() @IsInt() @Min(1) durationSemesters?: number;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32)  shortCode?: string;
}

class UpdateProgramDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @IsIn([...DEGREE_LEVELS]) degreeLevel?: typeof DEGREE_LEVELS[number];
  @IsOptional() @IsInt() @Min(1) durationSemesters?: number;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(160) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32)  shortCode?: string;
}

class ListProgramsQueryDto {
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() @IsIn([...DEGREE_LEVELS]) degreeLevel?: typeof DEGREE_LEVELS[number];
}

// Phase B R6 (D82) — public catalog read query. Only the tenant slug is
// needed (no JWT to resolve tenantId from), mirroring the public submit.
class PublicListProgramsQueryDto {
  @IsString() @MinLength(2) @MaxLength(64) tenantSlug!: string;
}

// R6 (D82) — public catalog throttle. Generous (read-only, non-sensitive
// program data); still caps anon abuse per-IP.
const PUBLIC_CATALOG_THROTTLE = { default: { limit: 60, ttl: 60 * 60 * 1000 } };

@Controller("programs")
export class ProgramsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListProgramsQueryDto,
  ) {
    return this.prisma.program.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        ...(query.degreeLevel ? { degreeLevel: query.degreeLevel } : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        shortCode: true,
        degreeLevel: true,
        durationSemesters: true,
        description: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, slug: true, name: true, shortCode: true } },
        _count: { select: { courses: { where: { deletedAt: null } } } },
      },
    });
  }

  /**
   * Phase B R6 (D82) — public program catalog for the anon /apply form.
   * @Public + @Throttle. Returns active (non-deleted) programs for the
   * tenant resolved from tenantSlug, with a non-sensitive subset
   * (id/slug/name/nameEn/degreeLevel + department name). Declared BEFORE
   * :id so the "public" literal wins over the :id param. Program catalog
   * is public-by-nature marketing data — no PII concern.
   */
  @Public()
  @Throttle(PUBLIC_CATALOG_THROTTLE)
  @Get("public")
  async listPublic(@Query() query: PublicListProgramsQueryDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: query.tenantSlug },
      select: { id: true, isActive: true },
    });
    if (!tenant || !tenant.isActive) {
      throw new BadRequestException("tenant not found or inactive");
    }
    return this.prisma.program.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        degreeLevel: true,
        department: { select: { name: true } },
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.program.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("program not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("program.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProgramDto) {
    const dept = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!dept) {
      throw new BadRequestException("department does not exist in this tenant");
    }
    return this.prisma.program.create({
      data: {
        tenantId: user.tenantId,
        departmentId: dto.departmentId,
        slug: dto.slug.toLowerCase(),
        name: dto.name,
        nameEn: dto.nameEn,
        shortCode: dto.shortCode?.toUpperCase(),
        degreeLevel: dto.degreeLevel,
        durationSemesters: dto.durationSemesters,
        description: dto.description,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("program.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    const existing = await this.prisma.program.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("program not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    return this.prisma.program.update({
      where: { id },
      data: {
        ...dto,
        shortCode: dto.shortCode?.toUpperCase(),
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("program.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.program.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("program not found");
    await this.prisma.program.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
