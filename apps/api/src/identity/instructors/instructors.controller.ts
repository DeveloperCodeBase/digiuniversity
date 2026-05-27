// apps/api/src/identity/instructors/instructors.controller.ts
//
// Phase B R3.a Commit D (D68) — Instructor REST surface.
//
// Admin CRUD for instructor roster. Two extra surfaces vs Student:
//   1. /v1/instructors/:id/department — dedicated sub-resource for
//      department reassignment (department moves are a more sensitive
//      operation; isolating them keeps the main PATCH endpoint focused
//      on metadata edits + makes audit log entries easier to filter).
//   2. expertise[] — Postgres String[] holding free-text expertise
//      tags. R3.a accepts up to 20 tags, each up to 64 chars. Controlled
//      vocabulary deferred to R4+ per memo risks section.
//
// Cross-tenant guard: every write that names a Department must verify
// the department lives in the calling user's tenant. Treats cross-tenant
// as 400 (don't leak department existence across tenants).
//
// Status field is plain enum (admins can set freely). InstructorStatus
// state machine deferred to R3.b per D68.

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
  UseGuards,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { SelfOrAdmin } from "../../auth/decorators/self-or-admin.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { SelfOrAdminGuard } from "../../auth/guards/self-or-admin.guard";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

const INSTRUCTOR_STATUSES = [
  "ACTIVE",
  "ON_SABBATICAL",
  "INACTIVE",
  "TERMINATED",
] as const;

const INSTRUCTOR_RANKS = ["ASSISTANT", "ASSOCIATE", "FULL", "EMERITUS"] as const;

class CreateInstructorDto {
  @IsString() @MinLength(2) @MaxLength(64) userId!: string;
  @IsString() @MinLength(2) @MaxLength(32) instructorCode!: string;
  @IsOptional() @IsString() @MaxLength(64) departmentId?: string;
  @IsOptional() @IsEnum(INSTRUCTOR_RANKS) rank?: (typeof INSTRUCTOR_RANKS)[number];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  expertise?: string[];
  @IsOptional() @IsISO8601() hireDate?: string;
  @IsOptional() @IsEnum(INSTRUCTOR_STATUSES) status?: (typeof INSTRUCTOR_STATUSES)[number];
}

class UpdateInstructorDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(32) instructorCode?: string;
  @IsOptional() @IsEnum(INSTRUCTOR_RANKS) rank?: (typeof INSTRUCTOR_RANKS)[number];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  expertise?: string[];
  @IsOptional() @IsISO8601() hireDate?: string;
  @IsOptional() @IsEnum(INSTRUCTOR_STATUSES) status?: (typeof INSTRUCTOR_STATUSES)[number];
}

class AssignDepartmentDto {
  // Empty string OR explicit null sets departmentId=null (unassign).
  // Otherwise must be a valid department id in the calling tenant.
  @IsOptional() @IsString() @MaxLength(64) departmentId?: string | null;
}

const INSTRUCTOR_SELECT = {
  id: true,
  tenantId: true,
  userId: true,
  instructorCode: true,
  departmentId: true,
  rank: true,
  expertise: true,
  hireDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, email: true, fullName: true, isActive: true },
  },
  department: {
    select: { id: true, slug: true, name: true, nameEn: true, shortCode: true },
  },
  _count: {
    select: { taughtOfferings: { where: { deletedAt: null } } },
  },
} as const;

@Controller("instructors")
@UseGuards(SelfOrAdminGuard)
export class InstructorsController {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Self-read ----------

  @Get("me")
  @SelfOrAdmin()
  async getOwn(@CurrentUser() user: AuthenticatedUser) {
    const row = await this.prisma.instructor.findFirst({
      where: { userId: user.userId, deletedAt: null },
      select: INSTRUCTOR_SELECT,
    });
    if (!row) {
      throw new NotFoundException("no instructor record for this user");
    }
    return row;
  }

  // ---------- Catalog-readable (admin + student) ----------

  @Get()
  @Roles("admin", "student")
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: (typeof INSTRUCTOR_STATUSES)[number],
    @Query("departmentId") departmentId?: string,
  ) {
    return this.prisma.instructor.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
      orderBy: [{ status: "asc" }, { instructorCode: "asc" }],
      select: INSTRUCTOR_SELECT,
    });
  }

  @Get(":id")
  @Roles("admin", "student")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.instructor.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      select: INSTRUCTOR_SELECT,
    });
    if (!row) throw new NotFoundException("instructor not found");
    return row;
  }

  // ---------- Admin CRUD ----------

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("instructor.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInstructorDto) {
    await this.assertUserInTenant(user.tenantId, dto.userId);
    if (dto.departmentId) {
      await this.assertDepartmentInTenant(user.tenantId, dto.departmentId);
    }
    try {
      return await this.prisma.instructor.create({
        data: {
          tenantId: user.tenantId,
          userId: dto.userId,
          instructorCode: dto.instructorCode.toUpperCase(),
          departmentId: dto.departmentId ?? null,
          rank: dto.rank,
          expertise: dto.expertise ?? [],
          hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
          status: dto.status ?? "ACTIVE",
          createdBy: user.userId,
          updatedBy: user.userId,
        },
        select: INSTRUCTOR_SELECT,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "";
        throw new BadRequestException(
          target.includes("userId")
            ? "userId already has an instructor record (1:0..1 invariant)"
            : "instructorCode already in use within this tenant",
        );
      }
      throw err;
    }
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("instructor.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateInstructorDto,
  ) {
    const existing = await this.prisma.instructor.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("instructor not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    try {
      return await this.prisma.instructor.update({
        where: { id },
        data: {
          ...dto,
          instructorCode: dto.instructorCode?.toUpperCase(),
          hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
          updatedBy: user.userId,
        },
        select: INSTRUCTOR_SELECT,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("instructorCode already in use within this tenant");
      }
      throw err;
    }
  }

  /**
   * Dedicated department reassignment sub-resource. departmentId=null
   * (or empty string) detaches the instructor (becomes floating/at-large).
   * Otherwise the department must exist in the calling tenant.
   */
  @Roles("admin")
  @Patch(":id/department")
  @AuditAction("instructor.department.assign")
  async assignDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AssignDepartmentDto,
  ) {
    const existing = await this.prisma.instructor.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("instructor not found");

    const targetDeptId = dto.departmentId && dto.departmentId.length > 0 ? dto.departmentId : null;
    if (targetDeptId) {
      await this.assertDepartmentInTenant(user.tenantId, targetDeptId);
    }
    return this.prisma.instructor.update({
      where: { id },
      data: { departmentId: targetDeptId, updatedBy: user.userId },
      select: INSTRUCTOR_SELECT,
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("instructor.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.instructor.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      select: { id: true, _count: { select: { taughtOfferings: { where: { deletedAt: null } } } } },
    });
    if (!existing) throw new NotFoundException("instructor not found");
    // Soft-delete only. The DB-level FK from CourseOffering.instructorId
    // is ON DELETE SET NULL, so even a hard-delete escape would null
    // the instructorId on offerings rather than orphan-cascade them.
    // Soft-delete leaves CourseOffering.instructorId pointing at the
    // deleted Instructor row — the OfferingsService list query joins
    // with `deletedAt: null` on the instructor side so the UI shows
    // "—" for the instructor cell after soft-delete.
    await this.prisma.instructor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true, taughtOfferingsCount: existing._count.taughtOfferings };
  }

  // ---------- cross-tenant guards ----------

  private async assertUserInTenant(tenantId: string, userId: string): Promise<void> {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!target || target.tenantId !== tenantId) {
      throw new BadRequestException("userId does not exist in this tenant");
    }
  }

  private async assertDepartmentInTenant(tenantId: string, departmentId: string): Promise<void> {
    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { tenantId: true, deletedAt: true },
    });
    if (!dept || dept.tenantId !== tenantId || dept.deletedAt !== null) {
      throw new BadRequestException("departmentId does not exist in this tenant");
    }
  }
}
