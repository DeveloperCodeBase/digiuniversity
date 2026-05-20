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
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PrismaService } from "../../prisma/prisma.service";

class CreateDepartmentDto {
  @IsString() @MinLength(2) @MaxLength(64) facultyId!: string;
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

class UpdateDepartmentDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

class ListDepartmentsQueryDto {
  @IsOptional() @IsString() facultyId?: string;
}

@Controller("departments")
export class DepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDepartmentsQueryDto,
  ) {
    return this.prisma.department.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(query.facultyId ? { facultyId: query.facultyId } : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        facultyId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { programs: { where: { deletedAt: null } } } },
      },
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.department.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("department not found");
    return row;
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDepartmentDto) {
    // Faculty must belong to the same tenant.
    const faculty = await this.prisma.faculty.findFirst({
      where: { id: dto.facultyId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!faculty) {
      throw new BadRequestException("faculty does not exist in this tenant");
    }
    return this.prisma.department.create({
      data: {
        tenantId: user.tenantId,
        facultyId: dto.facultyId,
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
    @Body() dto: UpdateDepartmentDto,
  ) {
    const existing = await this.prisma.department.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("department not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    return this.prisma.department.update({
      where: { id },
      data: { ...dto, updatedBy: user.userId },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("department not found");
    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
