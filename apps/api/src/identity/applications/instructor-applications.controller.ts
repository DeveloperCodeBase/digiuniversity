// apps/api/src/identity/applications/instructor-applications.controller.ts
//
// Phase B R3.b Commit B (D71) — admin-only HTTP surface for
// InstructorApplication. Parallel to StudentApplicationsController.

import {
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
} from "@nestjs/common";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
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

@Controller("applications/instructor")
export class InstructorApplicationsController {
  constructor(private readonly service: InstructorApplicationsService) {}

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
