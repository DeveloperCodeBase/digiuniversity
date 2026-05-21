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
} from "@nestjs/common";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditAction } from "../audit/audit-action.decorator";
import { PrismaService } from "../prisma/prisma.service";

const STATUSES = ["none", "processing", "ready", "failed"] as const;

class CreateRecordingDto {
  @IsString() @MinLength(2) @MaxLength(64) classSessionId!: string;
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
  @IsOptional() @IsString() @MaxLength(2048) mediaUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) transcriptUrl?: string;
  @IsOptional() @IsInt() @Min(0) durationSeconds?: number;
}

class UpdateRecordingDto {
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
  @IsOptional() @IsString() @MaxLength(2048) mediaUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) transcriptUrl?: string;
  @IsOptional() @IsInt() @Min(0) durationSeconds?: number;
}

class ListRecordingsQueryDto {
  @IsOptional() @IsString() classSessionId?: string;
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
}

@Controller("recordings")
export class RecordingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() q: ListRecordingsQueryDto) {
    return this.prisma.recording.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(q.classSessionId ? { classSessionId: q.classSessionId } : {}),
        ...(q.status ? { status: q.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        classSession: {
          select: { id: true, title: true, courseId: true, scheduledStart: true },
        },
      },
      take: 200,
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.recording.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: { classSession: { select: { id: true, title: true } } },
    });
    if (!row) throw new NotFoundException("recording not found");
    return row;
  }

  @Roles("admin", "instructor")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("recording.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRecordingDto) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: dto.classSessionId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!session) throw new BadRequestException("class session not in this tenant");
    return this.prisma.recording.upsert({
      where: { classSessionId: dto.classSessionId },
      create: {
        tenantId: user.tenantId,
        classSessionId: dto.classSessionId,
        status: dto.status ?? "none",
        mediaUrl: dto.mediaUrl,
        transcriptUrl: dto.transcriptUrl,
        durationSeconds: dto.durationSeconds,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
      update: {
        status: dto.status ?? undefined,
        mediaUrl: dto.mediaUrl ?? undefined,
        transcriptUrl: dto.transcriptUrl ?? undefined,
        durationSeconds: dto.durationSeconds ?? undefined,
        updatedBy: user.userId,
        deletedAt: null,
      },
    });
  }

  @Roles("admin", "instructor")
  @Patch(":id")
  @AuditAction("recording.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateRecordingDto,
  ) {
    const existing = await this.prisma.recording.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("recording not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    return this.prisma.recording.update({
      where: { id },
      data: { ...dto, updatedBy: user.userId },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("recording.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.recording.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("recording not found");
    await this.prisma.recording.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
