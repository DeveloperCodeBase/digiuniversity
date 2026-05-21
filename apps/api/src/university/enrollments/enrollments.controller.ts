import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

const STATUSES = ["active", "completed", "dropped", "withdrawn"] as const;

class EnrollDto {
  @IsString() courseId!: string;
  @IsOptional() @IsString() cohortId?: string;
}

class UpdateEnrollmentStatusDto {
  @IsString() @IsIn([...STATUSES]) status!: typeof STATUSES[number];
}

class ListEnrollmentsQueryDto {
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
}

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Self-enrol. The authenticated user enrols themselves in a course of
   * their own tenant. Re-enrolling an already-active enrollment is a 409.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("enrollment.create")
  async enrol(@CurrentUser() user: AuthenticatedUser, @Body() dto: EnrollDto) {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!course) {
      throw new BadRequestException("course does not exist in this tenant");
    }
    if (dto.cohortId) {
      const cohort = await this.prisma.cohort.findFirst({
        where: { id: dto.cohortId, tenantId: user.tenantId, deletedAt: null },
      });
      if (!cohort) {
        throw new BadRequestException("cohort does not exist in this tenant");
      }
      if (cohort.programId !== course.programId) {
        throw new BadRequestException(
          "cohort and course belong to different programs",
        );
      }
    }

    // Unique constraint catches the race; the lookup is just for nicer errors.
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        tenantId: user.tenantId,
        userId: user.userId,
        courseId: dto.courseId,
        deletedAt: null,
      },
    });
    if (existing && existing.status === "active") {
      throw new ConflictException("already enrolled in this course");
    }

    return this.prisma.enrollment.upsert({
      where: {
        tenantId_userId_courseId: {
          tenantId: user.tenantId,
          userId: user.userId,
          courseId: dto.courseId,
        },
      },
      create: {
        tenantId: user.tenantId,
        userId: user.userId,
        courseId: dto.courseId,
        cohortId: dto.cohortId,
        status: "active",
        createdBy: user.userId,
        updatedBy: user.userId,
      },
      update: {
        status: "active",
        deletedAt: null,
        cohortId: dto.cohortId ?? null,
        updatedBy: user.userId,
      },
    });
  }

  /** Current user's enrollments. */
  @Get("me")
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.enrollment.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.userId,
        deletedAt: null,
      },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { select: { id: true, code: true, title: true, language: true } },
        cohort: { select: { id: true, slug: true, name: true } },
      },
    });
  }

  /**
   * Admin / instructor: list enrollments in the tenant, optionally
   * scoped to a course or user. Plain students get 403 here — they read
   * theirs via GET /enrollments/me.
   */
  @Roles("admin", "instructor")
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListEnrollmentsQueryDto,
  ) {
    return this.prisma.enrollment.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(query.courseId ? { courseId: query.courseId } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { enrolledAt: "desc" },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        course: { select: { id: true, code: true, title: true } },
      },
      take: 500,
    });
  }

  /**
   * Students can withdraw themselves; admins can move any enrollment to
   * any status. Instructors can mark "completed" but not arbitrary
   * status changes — they shouldn't be able to silently drop a student.
   */
  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @AuditAction("enrollment.status.change")
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    const enrolment = await this.prisma.enrollment.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!enrolment) throw new NotFoundException("enrollment not found");

    const isOwner = enrolment.userId === user.userId;
    const isAdmin = user.roles.includes("admin");
    const isInstructor = user.roles.includes("instructor");

    if (isAdmin) {
      // anything goes
    } else if (isInstructor && dto.status === "completed") {
      // ok
    } else if (isOwner && (dto.status === "withdrawn" || dto.status === "dropped")) {
      // ok — students can drop themselves
    } else {
      throw new ForbiddenException("not allowed to set this status");
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        status: dto.status,
        completedAt: dto.status === "completed" ? new Date() : null,
        updatedBy: user.userId,
      },
    });
  }
}
