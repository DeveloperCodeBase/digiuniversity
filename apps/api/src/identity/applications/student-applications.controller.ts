// apps/api/src/identity/applications/student-applications.controller.ts
//
// Phase B R3.b Commit B (D71) — admin-only HTTP surface for StudentApplication.
//
// Commit B scope: admin list / get / transition / soft-delete.
// Public POST + SelfOrAdmin GET/me + WITHDRAW endpoint land in Commit E.
// Verification PATCH endpoints land in Commit C.

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
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { StudentApplicationsService } from "./student-applications.service";

const APP_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "ENROLLED",
  "REJECTED",
  "WITHDRAWN",
] as const;

class TransitionDto {
  @IsEnum(APP_STATUSES) to!: (typeof APP_STATUSES)[number];
}

class ListQueryDto {
  @IsOptional() @IsEnum(APP_STATUSES) status?: (typeof APP_STATUSES)[number];
  @IsOptional() @IsString() @MaxLength(64) programId?: string;
}

// Phase B R3.b Commit C — admin verification escape hatch (Q4.a).
// Default body is `{ verified: true }`; admin can explicitly clear via
// `{ verified: false }` (revoke verification, e.g. typo correction).
class SetVerifiedDto {
  @IsOptional() @IsBoolean() verified?: boolean;
}

// Phase B R3.b Commit E — public submission DTO.
//
// `tenantSlug` is the only multi-tenant disambiguator the public POST
// has — there's no JWT to extract tenantId from. Slug is resolved to
// tenantId in the handler. Q8.a idempotency runs on (tenantId,
// applicantEmail, programId).
class SubmitStudentApplicationDto {
  @IsString() @MinLength(2) @MaxLength(64) tenantSlug!: string;
  @IsString() @MinLength(2) @MaxLength(64) programId!: string;
  @IsString() @MinLength(2) @MaxLength(160) applicantFullName!: string;
  @IsEmail() @MaxLength(160) applicantEmail!: string;
  @IsOptional() @IsString() @MaxLength(40) applicantPhone?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(20) applicantNationalId?: string;
  @IsOptional() @IsString() @MaxLength(2000) applicantBio?: string;
}

// Q8.a rate-limit: 5 submissions per IP per hour. Genuine applicants
// submit 1-2 times; 5/hr is generous + leaves headroom for fat-finger
// retries.
const SUBMIT_THROTTLE = {
  default: { limit: 5, ttl: 60 * 60 * 1000 },
};

@Controller("applications/student")
export class StudentApplicationsController {
  constructor(
    private readonly service: StudentApplicationsService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------- Public submission (Q8.a refinement) ----------

  /**
   * Public submission. @Public() bypasses JwtAuthGuard; @Throttle caps
   * at 5/IP/hour per Q8.a refinement. Idempotency on (tenantId,
   * applicantEmail, programId) — same applicant + program returns the
   * existing row with 200 (not 201).
   *
   * @AuditSkip per Phase-A R4 lint: this is a @Public() endpoint, so
   * there's no authenticated actor to record. Spam-flag NotificationLog
   * stub captures the abuse signal instead.
   */
  @Public()
  @Throttle(SUBMIT_THROTTLE)
  @Post()
  async submit(
    @Body() dto: SubmitStudentApplicationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true, isActive: true },
    });
    if (!tenant || !tenant.isActive) {
      throw new BadRequestException("tenant not found or inactive");
    }
    const result = await this.service.submitPublic({
      tenantId: tenant.id,
      programId: dto.programId,
      applicantFullName: dto.applicantFullName,
      applicantEmail: dto.applicantEmail,
      applicantPhone: dto.applicantPhone,
      applicantNationalId: dto.applicantNationalId,
      applicantBio: dto.applicantBio,
      actorUserId: null,
    });
    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return { ...result.application, _idempotent: !result.created };
  }

  // ---------- Self-read + WITHDRAW (D69 SelfOrAdmin reuse) ----------

  /**
   * Own application. Returns 404 if the authenticated user has not yet
   * submitted (or has linked through ENROLLED side effect creating a
   * Student — at which point their original application row's userId is
   * set, and /me finds it).
   */
  @Get("me")
  async getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getOwn(user.tenantId, user.userId);
  }

  /**
   * SelfOrAdmin WITHDRAW. Service-layer auth: app.userId === user.userId
   * OR user has admin role. Decorator-based @SelfOrAdmin doesn't fit
   * cleanly here because the target user id lives on the resource
   * (looked up by id), not on the URL/body.
   */
  @Post(":id/withdraw")
  @HttpCode(HttpStatus.OK)
  @AuditAction("application.student.withdraw")
  async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.withdrawSelf(
      user.tenantId,
      { userId: user.userId, isAdmin: user.roles.includes("admin") },
      id,
    );
  }

  // ---------- Admin CRUD (Commit B) ----------

  @Get()
  @Roles("admin")
  async list(@CurrentUser() user: AuthenticatedUser, @Query() q: ListQueryDto) {
    return this.service.list(user.tenantId, {
      status: q.status,
      programId: q.programId,
    });
  }

  @Get(":id")
  @Roles("admin")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.getById(user.tenantId, id);
  }

  /**
   * State-machine transition. Verification gate (Q4.a) lands in Commit C.
   * ENROLLED transition routes through Commit D's transactional side
   * effect — until that lands, Commit B's service throws 501.
   */
  @Roles("admin")
  @Post(":id/transition")
  @HttpCode(HttpStatus.OK)
  @AuditAction("application.student.transition")
  async transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.service.transition(user.tenantId, user.userId, id, dto.to);
  }

  /**
   * Q4.a admin verification escape hatch — sets/clears
   * applicantEmailVerifiedAt. Self-verification UX (email-link landing
   * page + token redemption) defers to R-Notif per D71 Q3.a.
   */
  @Roles("admin")
  @Patch(":id/verify-email")
  @AuditAction("application.student.verify-email")
  async verifyEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SetVerifiedDto,
  ) {
    return this.service.setEmailVerified(user.tenantId, user.userId, id, dto.verified ?? true);
  }

  @Roles("admin")
  @Patch(":id/verify-phone")
  @AuditAction("application.student.verify-phone")
  async verifyPhone(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SetVerifiedDto,
  ) {
    return this.service.setPhoneVerified(user.tenantId, user.userId, id, dto.verified ?? true);
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("application.student.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.softDelete(user.tenantId, user.userId, id);
  }
}
