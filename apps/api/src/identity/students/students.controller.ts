// apps/api/src/identity/students/students.controller.ts
//
// Phase B R3.a Commit C (D68) — Student REST surface.
//
// Admin-only CRUD for the Student roster + a self-read endpoint
// (/v1/students/me) gated by @SelfOrAdmin (the second consumer of the
// D69 primitive — Profile being the first).
//
// Status field is a plain enum here; the StudentStatus state machine
// (legal transitions, side effects) lives in R3.b per D68 split.
// Admins can set any status freely in R3.a — UI validation guides
// them, but no service-layer guard rejects backwards transitions.
//
// 1:0..1 with User per Q2.a (a user may be only-instructor or
// neither). Creation requires an existing User row + an unused userId
// (UNIQUE constraint enforces it).

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

const STUDENT_STATUSES = [
  "ENROLLED",
  "ON_LEAVE",
  "GRADUATED",
  "WITHDRAWN",
  "DISMISSED",
] as const;

class CreateStudentDto {
  @IsString() @MinLength(2) @MaxLength(64) userId!: string;
  @IsString() @MinLength(2) @MaxLength(32) studentCode!: string;
  @IsOptional() @IsISO8601() admissionDate?: string;
  @IsOptional() @IsEnum(STUDENT_STATUSES) status?: (typeof STUDENT_STATUSES)[number];
}

class UpdateStudentDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(32) studentCode?: string;
  @IsOptional() @IsISO8601() admissionDate?: string;
  @IsOptional() @IsEnum(STUDENT_STATUSES) status?: (typeof STUDENT_STATUSES)[number];
}

const STUDENT_SELECT = {
  id: true,
  tenantId: true,
  userId: true,
  studentCode: true,
  admissionDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, email: true, fullName: true, isActive: true },
  },
} as const;

@Controller("students")
@UseGuards(SelfOrAdminGuard)
export class StudentsController {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Self-read (any authenticated user; returns 404 if not a student) ----------

  @Get("me")
  @SelfOrAdmin()
  async getOwn(@CurrentUser() user: AuthenticatedUser) {
    const row = await this.prisma.student.findFirst({
      where: { userId: user.userId, deletedAt: null },
      select: STUDENT_SELECT,
    });
    if (!row) {
      throw new NotFoundException("no student record for this user");
    }
    return row;
  }

  // ---------- Admin CRUD ----------

  @Get()
  @Roles("admin")
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: (typeof STUDENT_STATUSES)[number],
  ) {
    return this.prisma.student.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      orderBy: [{ status: "asc" }, { studentCode: "asc" }],
      select: STUDENT_SELECT,
    });
  }

  @Get(":id")
  @Roles("admin")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.student.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      select: STUDENT_SELECT,
    });
    if (!row) throw new NotFoundException("student not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("student.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudentDto) {
    // Verify the target User exists in this tenant. Treat cross-tenant
    // userId as not-found (don't leak existence across tenants).
    const target = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, tenantId: true },
    });
    if (!target || target.tenantId !== user.tenantId) {
      throw new BadRequestException("userId does not exist in this tenant");
    }
    try {
      return await this.prisma.student.create({
        data: {
          tenantId: user.tenantId,
          userId: dto.userId,
          studentCode: dto.studentCode.toUpperCase(),
          admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : null,
          status: dto.status ?? "ENROLLED",
          createdBy: user.userId,
          updatedBy: user.userId,
        },
        select: STUDENT_SELECT,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "";
        throw new BadRequestException(
          target.includes("userId")
            ? "userId already has a student record (1:0..1 invariant)"
            : "studentCode already in use within this tenant",
        );
      }
      throw err;
    }
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("student.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    const existing = await this.prisma.student.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("student not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          ...dto,
          studentCode: dto.studentCode?.toUpperCase(),
          admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : undefined,
          updatedBy: user.userId,
        },
        select: STUDENT_SELECT,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("studentCode already in use within this tenant");
      }
      throw err;
    }
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("student.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.student.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("student not found");
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
