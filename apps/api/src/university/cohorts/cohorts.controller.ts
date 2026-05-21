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
import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

class CreateCohortDto {
  @IsString() @MinLength(2) @MaxLength(64) programId!: string;
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
}

class UpdateCohortDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
}

class ListCohortsQueryDto {
  @IsOptional() @IsString() programId?: string;
}

@Controller("cohorts")
export class CohortsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCohortsQueryDto,
  ) {
    return this.prisma.cohort.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(query.programId ? { programId: query.programId } : {}),
      },
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        startDate: true,
        endDate: true,
        programId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.cohort.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("cohort not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("cohort.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCohortDto) {
    const program = await this.prisma.program.findFirst({
      where: { id: dto.programId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!program) {
      throw new BadRequestException("program does not exist in this tenant");
    }
    return this.prisma.cohort.create({
      data: {
        tenantId: user.tenantId,
        programId: dto.programId,
        slug: dto.slug.toLowerCase(),
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("cohort.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateCohortDto,
  ) {
    const existing = await this.prisma.cohort.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("cohort not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    return this.prisma.cohort.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("cohort.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.cohort.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("cohort not found");
    await this.prisma.cohort.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
