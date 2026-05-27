// apps/api/src/identity/profiles/profiles.controller.ts
//
// Phase B R3.a Commit B (D68 + D69) — Profile REST surface.
//
// Profile is strict 1:1 with User (Q2.a). Endpoints:
//   GET    /v1/profile                  — own (SelfOrAdmin self-only)
//   PATCH  /v1/profile                  — edit own (SelfOrAdmin self-only)
//   GET    /v1/profiles                 — list all (admin only) → /admin/profiles UI
//   GET    /v1/users/:userId/profile    — user reads own OR admin reads any
//   PATCH  /v1/users/:userId/profile    — user edits own OR admin edits any
//
// Auto-create-on-read pattern: GET /v1/profile and GET /v1/users/:userId/profile
// auto-instantiate an empty Profile row if none exists for the target user.
// Seed-time backfill (Commit A) covers all existing users; this is a
// safety net for users created post-seed who somehow don't have a
// Profile yet (e.g., raw User insert outside the registration flow).

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { SelfOrAdmin } from "../../auth/decorators/self-or-admin.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { SelfOrAdminGuard } from "../../auth/guards/self-or-admin.guard";
import { AuditAction } from "../../audit/audit-action.decorator";
import { PrismaService } from "../../prisma/prisma.service";

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsISO8601() dateOfBirth?: string;
  @IsOptional() @IsString() @MaxLength(40) phoneNumber?: string;
  @IsOptional() @IsString() @MaxLength(2000) avatarUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(20) nationalId?: string;
  @IsOptional() @IsString() @MaxLength(8) locale?: string;
}

const PROFILE_SELECT = {
  id: true,
  userId: true,
  bio: true,
  dateOfBirth: true,
  phoneNumber: true,
  avatarUrl: true,
  address: true,
  nationalId: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      locale: true,
      isActive: true,
    },
  },
} as const;

@Controller()
@UseGuards(SelfOrAdminGuard)
export class ProfilesController {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Self-service: /v1/profile (own) ----------

  /**
   * Own profile. Auto-creates an empty Profile if none exists for the
   * authenticated user — Profile is supposed to be 1:1 strict per Q2.a,
   * so a missing row is a degenerate state we fix on read instead of
   * surfacing 404.
   */
  @Get("profile")
  @SelfOrAdmin()
  async getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.getOrCreate(user.userId);
  }

  @Patch("profile")
  @SelfOrAdmin()
  @AuditAction("profile.update")
  async updateOwn(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.upsertAndUpdate(user.userId, user.userId, dto);
  }

  // ---------- Admin listing: /v1/profiles (admin only) ----------

  /**
   * Powers the /admin/profiles UI (D69). Admin-only. Tenant-scoped via
   * the joined User.tenantId (Profile itself has no tenantId column —
   * tenant scope flows through Profile.user).
   */
  @Get("profiles")
  @Roles("admin")
  async listAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.profile.findMany({
      where: {
        deletedAt: null,
        user: { tenantId: user.tenantId },
      },
      orderBy: { updatedAt: "desc" },
      select: PROFILE_SELECT,
    });
  }

  // ---------- SelfOrAdmin: /v1/users/:userId/profile ----------

  @Get("users/:userId/profile")
  @SelfOrAdmin({ userIdFrom: "param", paramName: "userId" })
  async getByUserId(@CurrentUser() user: AuthenticatedUser, @Param("userId") targetUserId: string) {
    await this.assertTargetSameTenant(user.tenantId, targetUserId);
    return this.getOrCreate(targetUserId);
  }

  @Patch("users/:userId/profile")
  @SelfOrAdmin({ userIdFrom: "param", paramName: "userId" })
  @AuditAction("profile.update")
  async updateByUserId(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") targetUserId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    await this.assertTargetSameTenant(user.tenantId, targetUserId);
    return this.upsertAndUpdate(targetUserId, user.userId, dto);
  }

  // ---------- helpers ----------

  /**
   * Ensure the target user belongs to the calling user's tenant. Admin
   * doing cross-tenant lookups is explicitly rejected here (super_admin
   * cross-tenant ops are a future Phase B+ concern).
   */
  private async assertTargetSameTenant(tenantId: string, targetUserId: string): Promise<void> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { tenantId: true },
    });
    if (!targetUser) {
      throw new NotFoundException("user not found");
    }
    if (targetUser.tenantId !== tenantId) {
      throw new NotFoundException("user not found");
    }
  }

  private async getOrCreate(userId: string) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    });
    if (existing) return existing;
    // Profile missing — backfill empty row. The seed runs this for all
    // existing users; on-demand creation here covers post-seed user
    // creation (registration flow that bypasses the seed).
    return this.prisma.profile.create({
      data: { userId },
      select: PROFILE_SELECT,
    });
  }

  private async upsertAndUpdate(
    targetUserId: string,
    actorUserId: string,
    dto: UpdateProfileDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }

    // upsert form so we don't 404 on the "empty Profile not yet
    // backfilled" edge case during the same flow as get-on-read.
    try {
      return await this.prisma.profile.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          bio: dto.bio,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          phoneNumber: dto.phoneNumber,
          avatarUrl: dto.avatarUrl,
          address: dto.address,
          nationalId: dto.nationalId,
          locale: dto.locale,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        update: {
          ...dto,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          updatedBy: actorUserId,
        },
        select: PROFILE_SELECT,
      });
    } catch (err) {
      // P2002 — concurrent insert raced our upsert. Surface 400 with a
      // friendly hint; retry from the client side.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("profile concurrency conflict; retry the request");
      }
      throw err;
    }
  }
}
