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
import { IsIn, IsOptional, IsString } from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditAction } from "../audit/audit-action.decorator";
import { AssessmentsService } from "./assessments.service";
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  KINDS,
  STATUSES,
  UpdateAssessmentDto,
  UpdateQuestionDto,
} from "./dto";

class ListAssessmentsQueryDto {
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
  @IsOptional() @IsString() @IsIn([...KINDS]) kind?: typeof KINDS[number];
}

@Controller("assessments")
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() q: ListAssessmentsQueryDto) {
    return this.assessments.list(user, q);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.assessments.getById(user, id);
  }

  @Roles("admin", "instructor")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("assessment.create")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssessmentDto) {
    return this.assessments.create(user, dto);
  }

  @Roles("admin", "instructor")
  @Patch(":id")
  @AuditAction("assessment.update")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessments.update(user, id, dto);
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("assessment.delete")
  softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.assessments.softDelete(user, id);
  }

  // ----- nested questions -----

  @Roles("admin", "instructor")
  @Post(":id/questions")
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("assessment.question.add")
  addQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.assessments.addQuestion(user, id, dto);
  }
}

@Controller("questions")
export class QuestionsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Roles("admin", "instructor")
  @Patch(":id")
  @AuditAction("question.update")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.assessments.updateQuestion(user, id, dto);
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("question.delete")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.assessments.deleteQuestion(user, id);
  }
}
