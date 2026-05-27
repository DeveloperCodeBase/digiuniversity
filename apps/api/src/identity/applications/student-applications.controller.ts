// apps/api/src/identity/applications/student-applications.controller.ts
//
// Phase B R3.b Commit B (D71) — admin-only HTTP surface for StudentApplication.
//
// Commit B scope: admin list / get / transition / soft-delete.
// Public POST + SelfOrAdmin GET/me + WITHDRAW endpoint land in Commit E.
// Verification PATCH endpoints land in Commit C.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
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

@Controller("applications/student")
export class StudentApplicationsController {
  constructor(private readonly service: StudentApplicationsService) {}

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

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("application.student.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.softDelete(user.tenantId, user.userId, id);
  }
}
