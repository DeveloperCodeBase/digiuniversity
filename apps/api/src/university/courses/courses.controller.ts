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
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

class CreateCourseDto {
  @IsString() @MinLength(2) @MaxLength(64) programId!: string;
  @IsString() @MinLength(2) @MaxLength(32) code!: string;
  @IsString() @MinLength(2) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsInt() @Min(1) credits?: number;
  @IsOptional() @IsString() @MaxLength(8) language?: string;
  @IsOptional() @IsString() @IsIn([...LEVELS]) level?: typeof LEVELS[number];
}

class UpdateCourseDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsInt() @Min(1) credits?: number;
  @IsOptional() @IsString() @MaxLength(8) language?: string;
  @IsOptional() @IsString() @IsIn([...LEVELS]) level?: typeof LEVELS[number];
}

class ListCoursesQueryDto {
  @IsOptional() @IsString() programId?: string;
  @IsOptional() @IsString() @IsIn([...LEVELS]) level?: typeof LEVELS[number];
  @IsOptional() @IsString() @MaxLength(8) language?: string;
}

@Controller("courses")
export class CoursesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCoursesQueryDto,
  ) {
    return this.prisma.course.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(query.programId ? { programId: query.programId } : {}),
        ...(query.level ? { level: query.level } : {}),
        ...(query.language ? { language: query.language } : {}),
      },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        credits: true,
        language: true,
        level: true,
        programId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            modules: { where: { deletedAt: null } },
            enrollments: { where: { deletedAt: null, status: "active" } },
          },
        },
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.course.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        modules: {
          where: { deletedAt: null },
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { orderIndex: "asc" },
              select: {
                id: true,
                title: true,
                orderIndex: true,
                durationMinutes: true,
              },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException("course not found");
    return row;
  }

  // Admin OR instructor — instructors may not provision tenants but can
  // shape course catalogues. Adjust later if a stricter scoping (e.g.
  // "instructor only on their own program") is needed.
  @Roles("admin", "instructor")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("course.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCourseDto) {
    const program = await this.prisma.program.findFirst({
      where: { id: dto.programId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!program) {
      throw new BadRequestException("program does not exist in this tenant");
    }
    return this.prisma.course.create({
      data: {
        tenantId: user.tenantId,
        programId: dto.programId,
        code: dto.code.toUpperCase(),
        title: dto.title,
        description: dto.description,
        credits: dto.credits ?? 3,
        language: dto.language ?? "fa",
        level: dto.level,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin", "instructor")
  @Patch(":id")
  @AuditAction("course.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    const existing = await this.prisma.course.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("course not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    return this.prisma.course.update({
      where: { id },
      data: { ...dto, updatedBy: user.userId },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("course.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.course.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("course not found");
    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
