import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import { AiBridgeService } from "../ai-bridge/ai-bridge.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { ClassSessionsService } from "./class-sessions.service";

const STATUSES = ["scheduled", "live", "ended", "cancelled"] as const;
const POLICIES = ["enrolled", "public", "invite"] as const;
const ANALYSIS = ["summarize", "extract-concepts", "generate-quiz", "analyze"] as const;

class CreateClassSessionDto {
  @IsString() @MinLength(2) @MaxLength(64) courseId!: string;
  @IsString() @MinLength(2) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsISO8601() scheduledStart!: string;
  @IsISO8601() scheduledEnd!: string;
  @IsOptional() @IsString() @IsIn([...POLICIES]) joinPolicy?: typeof POLICIES[number];
  @IsOptional() @IsString() hostUserId?: string;
}

class UpdateClassSessionDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsISO8601() scheduledStart?: string;
  @IsOptional() @IsISO8601() scheduledEnd?: string;
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
  @IsOptional() @IsString() @IsIn([...POLICIES]) joinPolicy?: typeof POLICIES[number];
}

class ListClassSessionsQueryDto {
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
}

class AnalyzeDto {
  @IsString() @IsIn([...ANALYSIS]) task!: typeof ANALYSIS[number];
  @IsOptional() @IsString() language?: string;
}

@Controller("class-sessions")
export class ClassSessionsController {
  constructor(
    private readonly sessions: ClassSessionsService,
    private readonly ai: AiBridgeService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() q: ListClassSessionsQueryDto) {
    return this.sessions.list(user, q);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.sessions.getById(user, id);
  }

  @Roles("admin", "instructor")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClassSessionDto) {
    return this.sessions.create(user, dto);
  }

  @Roles("admin", "instructor")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateClassSessionDto,
  ) {
    return this.sessions.update(user, id, dto);
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.sessions.softDelete(user, id);
  }

  @Post(":id/join")
  @HttpCode(HttpStatus.OK)
  join(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.sessions.join(user, id);
  }

  @Post(":id/leave")
  @HttpCode(HttpStatus.OK)
  leave(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.sessions.leave(user, id);
  }

  @Roles("admin", "instructor")
  @Get(":id/attendance")
  attendance(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.sessions.attendance(user, id);
  }

  /**
   * Trigger an AI analysis pass on a session. The api forwards to
   * ai-gateway and persists the envelope to AiInteractionLog. Returns
   * the envelope verbatim so the SPA can render the payload + governance
   * fields (confidence, humanReviewRequired).
   */
  @Roles("admin", "instructor")
  @Post(":id/analyze")
  @HttpCode(HttpStatus.OK)
  async analyze(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AnalyzeDto,
  ) {
    const session = await this.sessions.getById(user, id);
    if (!session.course) {
      throw new ForbiddenException("orphaned session");
    }
    return this.ai.post({
      path: `/v1/class-sessions/${id}/${dto.task}`,
      body: {
        tenant_id: user.tenantId,
        course_id: session.courseId,
        class_session_id: id,
        language: dto.language ?? "fa",
        // Pass through any recording urls if present so the gateway has
        // them when an external provider is wired up.
        media_url: session.recording?.mediaUrl ?? undefined,
        transcript_url: session.recording?.transcriptUrl ?? undefined,
      },
      tenantId: user.tenantId,
      userId: user.userId,
    });
  }
}
