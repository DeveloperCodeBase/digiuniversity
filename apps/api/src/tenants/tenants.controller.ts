import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { AuditAction } from "../audit/audit-action.decorator";
import { PrismaService } from "../prisma/prisma.service";

class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller("tenants")
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Each authenticated user can read their own tenant. Other tenants
   * are intentionally not enumerable from this endpoint.
   */
  @Get("me")
  async myTenant(@CurrentUser() user: AuthenticatedUser) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });
    return tenant;
  }

  /**
   * Provision a brand-new tenant. Restricted to existing admins — in
   * practice that means only the seed admin until other admins are
   * promoted via /users/:id/roles (Phase 2.5).
   */
  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("tenant.create")
  async create(@Body() dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        slug: dto.slug.toLowerCase(),
        name: dto.name,
        isActive: dto.isActive ?? true,
        // Every tenant gets the three default roles so registration
        // can land users in a sensible default.
        roles: {
          create: [
            { name: "admin", label: "مدیر سامانه" },
            { name: "instructor", label: "استاد" },
            { name: "student", label: "دانشجو" },
          ],
        },
      },
      select: { id: true, slug: true, name: true, isActive: true },
    });
  }
}
