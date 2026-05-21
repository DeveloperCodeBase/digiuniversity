import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditAction } from "../audit/audit-action.decorator";
import {
  GradeSubmissionDto,
  SUBMISSION_STATUSES,
  SubmitDto,
} from "./dto";
import { SubmissionsService } from "./submissions.service";

class ListSubmissionsQueryDto {
  @IsOptional() @IsString() assessmentId?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() @IsIn([...SUBMISSION_STATUSES])
  status?: typeof SUBMISSION_STATUSES[number];
}

@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  /** Student writes their own submission (draft or finalise). */
  @Post()
  @HttpCode(HttpStatus.OK)
  @AuditAction("submission.submit")
  submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitDto) {
    return this.submissions.submit(user, dto);
  }

  /** Current user's submissions across every assessment. */
  @Get("me")
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.submissions.listMine(user);
  }

  /** Current user's submission for one assessment (or 404). */
  @Get("me/assessment/:assessmentId")
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assessmentId") assessmentId: string,
  ) {
    return this.submissions.getMine(user, assessmentId);
  }

  /** Staff list (admin or instructor) — accepts filters. */
  @Roles("admin", "instructor")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() q: ListSubmissionsQueryDto,
  ) {
    return this.submissions.list(user, q);
  }

  /**
   * One submission. Students can read their own; staff can read any
   * in their tenant.
   */
  @Get(":id")
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    const row = await this.submissions.getById(user, id);
    const isOwner = row.userId === user.userId;
    const isStaff = user.roles.includes("admin") || user.roles.includes("instructor");
    if (!isOwner && !isStaff) {
      throw new ForbiddenException("not your submission");
    }
    return row;
  }

  /** Instructor / admin sets a final grade. */
  @Roles("admin", "instructor")
  @Patch(":id/grade")
  @HttpCode(HttpStatus.OK)
  @AuditAction("submission.grade")
  grade(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.submissions.grade(user, id, dto);
  }

  /**
   * Ask ai-gateway for a draft grade. Always carries
   * humanReviewRequired=true per AGENTS.md AI governance rules.
   */
  @Roles("admin", "instructor")
  @Post(":id/ai-grade-draft")
  @HttpCode(HttpStatus.OK)
  @AuditAction("submission.ai-grade-draft")
  aiGradeDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.submissions.aiGradeDraft(user, id);
  }
}
