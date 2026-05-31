// apps/api/src/identity/applications/instructor-applications.controller.ts
//
// Phase B R3.b Commit B (D71) — admin-only HTTP surface for
// InstructorApplication. Parallel to StudentApplicationsController.

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction, AuditSkip } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { InstructorApplicationsService } from "./instructor-applications.service";

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
  @IsOptional() @IsString() @MaxLength(64) departmentId?: string;
}

class SetVerifiedDto {
  @IsOptional() @IsBoolean() verified?: boolean;
}

const INSTRUCTOR_RANKS = ["ASSISTANT", "ASSOCIATE", "FULL", "EMERITUS"] as const;

class SubmitInstructorApplicationDto {
  @IsString() @MinLength(2) @MaxLength(64) tenantSlug!: string;
  @IsOptional() @IsString() @MaxLength(64) departmentId?: string;
  @IsOptional() @IsString() @MaxLength(64) preferredDepartmentSlug?: string;
  @IsString() @MinLength(2) @MaxLength(160) applicantFullName!: string;
  @IsEmail() @MaxLength(160) applicantEmail!: string;
  @IsOptional() @IsString() @MaxLength(40) applicantPhone?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(20) applicantNationalId?: string;
  @IsOptional() @IsString() @MaxLength(2000) applicantBio?: string;
  @IsOptional() @IsEnum(INSTRUCTOR_RANKS) desiredRank?: (typeof INSTRUCTOR_RANKS)[number];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  expertise?: string[];
  @IsOptional() @IsUrl() @MaxLength(2000) cvUrl?: string;
}

const SUBMIT_THROTTLE = {
  default: { limit: 5, ttl: 60 * 60 * 1000 },
};

// R6 (D80) — public tracking throttles (parallel to student variant).
const TRACK_THROTTLE = { default: { limit: 30, ttl: 60 * 60 * 1000 } };
const TRACK_WITHDRAW_THROTTLE = { default: { limit: 5, ttl: 60 * 60 * 1000 } };

// R6 (D80) — public withdraw-by-token body.
class TrackWithdrawDto {
  @IsString() @MinLength(16) @MaxLength(128) token!: string;
}

@Controller("applications/instructor")
export class InstructorApplicationsController {
  constructor(
    private readonly service: InstructorApplicationsService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------- Public submission (Q8.a refinement) ----------

  @Public()
  @AuditSkip()
  @Throttle(SUBMIT_THROTTLE)
  @Post()
  async submit(
    @Body() dto: SubmitInstructorApplicationDto,
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
      departmentId: dto.departmentId,
      preferredDepartmentSlug: dto.preferredDepartmentSlug,
      applicantFullName: dto.applicantFullName,
      applicantEmail: dto.applicantEmail,
      applicantPhone: dto.applicantPhone,
      applicantNationalId: dto.applicantNationalId,
      applicantBio: dto.applicantBio,
      desiredRank: dto.desiredRank,
      expertise: dto.expertise,
      cvUrl: dto.cvUrl,
      actorUserId: null,
    });
    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return { ...result.application, _idempotent: !result.created };
  }

  // ---------- Public tracking by token (R6 D80) ----------

  @Public()
  @Throttle(TRACK_THROTTLE)
  @Get("track")
  async track(@Query("token") token: string) {
    return this.service.getByToken(token ?? "");
  }

  /**
   * @AuditSkip(): public endpoint, no authenticated actor (the service
   * records the public-track sentinel actor on the row). Declared before
   * :id/withdraw so "track/withdraw" wins over the :id param.
   */
  @Public()
  @AuditSkip()
  @Throttle(TRACK_WITHDRAW_THROTTLE)
  @Post("track/withdraw")
  @HttpCode(HttpStatus.OK)
  async trackWithdraw(@Body() dto: TrackWithdrawDto) {
    return this.service.withdrawByToken(dto.token);
  }

  // ---------- Self-read + WITHDRAW ----------

  @Get("me")
  async getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getOwn(user.tenantId, user.userId);
  }

  @Post(":id/withdraw")
  @HttpCode(HttpStatus.OK)
  @AuditAction("application.instructor.withdraw")
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
      departmentId: q.departmentId,
    });
  }

  @Get(":id")
  @Roles("admin")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.getById(user.tenantId, id);
  }

  @Roles("admin")
  @Post(":id/transition")
  @HttpCode(HttpStatus.OK)
  @AuditAction("application.instructor.transition")
  async transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.service.transition(user.tenantId, user.userId, id, dto.to);
  }

  @Roles("admin")
  @Patch(":id/verify-email")
  @AuditAction("application.instructor.verify-email")
  async verifyEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SetVerifiedDto,
  ) {
    return this.service.setEmailVerified(user.tenantId, user.userId, id, dto.verified ?? true);
  }

  @Roles("admin")
  @Patch(":id/verify-phone")
  @AuditAction("application.instructor.verify-phone")
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
  @AuditAction("application.instructor.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.softDelete(user.tenantId, user.userId, id);
  }
}
