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
} from "@nestjs/common";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PrismaService } from "../../prisma/prisma.service";

class CreateFacultyDto {
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

class UpdateFacultyDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

@Controller("faculties")
export class FacultiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.faculty.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { departments: { where: { deletedAt: null } } } },
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.faculty.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("faculty not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFacultyDto) {
    return this.prisma.faculty.create({
      data: {
        tenantId: user.tenantId,
        slug: dto.slug.toLowerCase(),
        name: dto.name,
        description: dto.description,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  @Roles("admin")
  @Patch(":id")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateFacultyDto,
  ) {
    const existing = await this.prisma.faculty.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("faculty not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    return this.prisma.faculty.update({
      where: { id },
      data: { ...dto, updatedBy: user.userId },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.faculty.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("faculty not found");
    await this.prisma.faculty.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
