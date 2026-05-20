import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CLIENT_EVENTS } from "./event-types";
import { LearningEventsService } from "./learning-events.service";

class EmitEventDto {
  // Clients may only emit from the `CLIENT_EVENTS` allow-list to
  // prevent forging server-only signals like `quiz_submitted` from
  // the browser. The system events go through service code paths.
  @IsString() @IsIn([...CLIENT_EVENTS]) type!: typeof CLIENT_EVENTS[number];
  @IsOptional() @IsString() @MaxLength(64) courseId?: string;
  @IsOptional() @IsString() @MaxLength(64) lessonId?: string;
  @IsOptional() @IsString() @MaxLength(64) assessmentId?: string;
  @IsOptional() @IsString() @MaxLength(64) classSessionId?: string;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
}

class ListMineQueryDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() courseId?: string;
}

class ListAllQueryDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() userId?: string;
}

@Controller("learning-events")
export class LearningEventsController {
  constructor(private readonly events: LearningEventsService) {}

  /** Any authenticated user records one of their own events. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async emit(@CurrentUser() user: AuthenticatedUser, @Body() dto: EmitEventDto) {
    await this.events.emit({
      tenantId: user.tenantId,
      userId: user.userId,
      type: dto.type,
      courseId: dto.courseId,
      lessonId: dto.lessonId,
      assessmentId: dto.assessmentId,
      classSessionId: dto.classSessionId,
      data: dto.data,
    });
    return { recorded: true };
  }

  @Get("me")
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() q: ListMineQueryDto) {
    return this.events.listMine({
      tenantId: user.tenantId,
      userId: user.userId,
      type: q.type,
      courseId: q.courseId,
    });
  }

  @Roles("admin", "instructor")
  @Get()
  listForStaff(@CurrentUser() user: AuthenticatedUser, @Query() q: ListAllQueryDto) {
    return this.events.listForStaff({
      tenantId: user.tenantId,
      type: q.type,
      courseId: q.courseId,
      userId: q.userId,
    });
  }
}
