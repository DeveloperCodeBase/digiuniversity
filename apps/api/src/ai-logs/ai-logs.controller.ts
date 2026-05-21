import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditSkip } from "../audit/audit-action.decorator";
import { PrismaService } from "../prisma/prisma.service";

class CreateAiLogDto {
  @IsString() @MinLength(4) @MaxLength(64) requestId!: string;
  @IsString() @MaxLength(256) endpoint!: string;
  @IsString() @MaxLength(128) model!: string;
  @IsString() @MaxLength(128) provider!: string;
  @IsString() @MaxLength(64) mode!: string;
  @IsNumber() @Min(0) @Max(1) confidence!: number;
  @IsBoolean() humanReviewRequired!: boolean;
  @IsObject() request!: Record<string, unknown>;
  @IsObject() response!: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) latencyMs?: number;
  @IsOptional() @IsString() userId?: string;
}

class ListAiLogsQueryDto {
  @IsOptional() @IsString() endpoint?: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) limit?: number = 50;
}

@Controller("ai-logs")
export class AiLogsController {
  private readonly logger = new Logger(AiLogsController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * The current user (any role) logs an AI interaction they just made.
   * In Phase 3 this becomes an internal endpoint the api itself writes
   * to whenever it brokers an ai-gateway call; for now it's exposed so
   * the frontend can also report client-initiated calls.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditSkip() // AiInteractionLog IS its own audit table; don't double-write.
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAiLogDto) {
    return this.prisma.aiInteractionLog.create({
      data: {
        tenantId: user.tenantId,
        userId: dto.userId ?? user.userId,
        requestId: dto.requestId,
        endpoint: dto.endpoint,
        model: dto.model,
        provider: dto.provider,
        mode: dto.mode,
        confidence: dto.confidence,
        humanReviewRequired: dto.humanReviewRequired,
        request: dto.request as Prisma.InputJsonValue,
        response: dto.response as Prisma.InputJsonValue,
        latencyMs: dto.latencyMs,
      },
      select: { id: true, requestId: true, createdAt: true },
    });
  }

  /** Admin / instructor: review recent AI interactions in this tenant. */
  @Roles("admin", "instructor")
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAiLogsQueryDto,
  ) {
    return this.prisma.aiInteractionLog.findMany({
      where: {
        tenantId: user.tenantId,
        ...(query.endpoint ? { endpoint: query.endpoint } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(query.limit ?? 50, 200),
      select: {
        id: true,
        requestId: true,
        userId: true,
        endpoint: true,
        model: true,
        provider: true,
        mode: true,
        confidence: true,
        humanReviewRequired: true,
        latencyMs: true,
        createdAt: true,
      },
    });
  }
}
