import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
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
import { EnrollmentsService, type EnrollmentStatus } from "./enrollments.service";

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
  // Phase B R4 (D73) — additive optional filters for the admin
  // /admin/enrollments page. Existing callers that don't pass them are
  // unaffected (regression-safe per D74).
  @IsOptional() @IsString() offeringId?: string;
  @IsOptional() @IsString() programId?: string;
}

// Phase B R4 (D73 Q4.a) — admin manual-enroll DTO (distinct path
// /enrollments/manual to avoid colliding with the existing self-enroll
// POST /enrollments).
class ManualEnrollDto {
  @IsString() userId!: string;
  @IsOptional() @IsString() offeringId?: string;
  @IsOptional() @IsString() courseId?: string;
}

// Phase B R4 (D73 Q2.a, D74 service-layer) — admin state-machine
// transition DTO. Distinct from UpdateEnrollmentStatusDto (the existing
// RBAC status-change); this one is admin-only + ALLOWED_TRANSITIONS-guarded.
class TransitionEnrollmentDto {
  @IsString() @IsIn([...STATUSES]) to!: EnrollmentStatus;
}

@Controller("enrollments")
export class EnrollmentsController {
  constructor(
    private readonly prisma: PrismaService,
    // Phase B R4 — admin business logic + state machine.
    private readonly service: EnrollmentsService,
  ) {}

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
        // Phase B R4 (D73) — additive offering/program filters.
        ...(query.offeringId ? { offeringId: query.offeringId } : {}),
        ...(query.programId ? { offering: { programId: query.programId } } : {}),
      },
      orderBy: { enrolledAt: "desc" },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        course: { select: { id: true, code: true, title: true } },
        // Phase B R4 — include the offering so the admin page can render
        // the program-term context (offerings have nameFa, not a course title).
        offering: { select: { id: true, slug: true, nameFa: true, nameEn: true } },
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

  // =====================================================================
  // Phase B R4 (D73 + D74) — admin surface for /admin/enrollments.
  // These coexist with the existing student/instructor flow above:
  //   • POST /enrollments/manual      — admin enrolls another user
  //   • GET  /enrollments/:id         — admin single
  //   • POST /enrollments/:id/transition — admin state-machine transition
  //   • DELETE /enrollments/:id       — admin soft-delete
  // The existing self-enroll (POST /), listMine (GET /me), list (GET /),
  // and RBAC status-change (PATCH /:id/status) are untouched (D74).
  // GET /:id is declared AFTER GET /me so the literal "me" route always
  // wins (NestJS matches in registration order).
  // =====================================================================

  /**
   * Admin manual enroll — enroll a User into an offering and/or course.
   * Distinct path /manual avoids colliding with the self-enroll POST /.
   */
  @Roles("admin")
  @Post("manual")
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("enrollment.admin.create")
  async manualEnroll(@CurrentUser() user: AuthenticatedUser, @Body() dto: ManualEnrollDto) {
    return this.service.manualEnroll(user.tenantId, user.userId, {
      userId: dto.userId,
      offeringId: dto.offeringId,
      courseId: dto.courseId,
    });
  }

  @Roles("admin")
  @Get(":id")
  async adminGetById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.getById(user.tenantId, id);
  }

  /**
   * Admin state-machine transition (R4 Q2.a, D74 service-layer). Distinct
   * from PATCH /:id/status (the Phase-7 RBAC status-change, untouched) —
   * this one is admin-only + ALLOWED_TRANSITIONS-guarded (illegal → 400).
   */
  @Roles("admin")
  @Post(":id/transition")
  @HttpCode(HttpStatus.OK)
  @AuditAction("enrollment.transition")
  async transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: TransitionEnrollmentDto,
  ) {
    return this.service.transition(user.tenantId, user.userId, id, dto.to);
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("enrollment.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.softDelete(user.tenantId, user.userId, id);
  }
}
