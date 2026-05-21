import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { IsString, MaxLength, MinLength } from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { hashPassword, verifyPassword } from "../auth/password";
import { rejectPwnedPassword } from "../auth/password-breach";
import { AuditAction } from "../audit/audit-action.decorator";
import { PrismaService } from "../prisma/prisma.service";

class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser) {
    // Always re-read from the DB so the response reflects role changes
    // and account state, not stale JWT claims.
    const row = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        locale: true,
        isActive: true,
        createdAt: true,
        userRoles: { include: { role: { select: { name: true, label: true } } } },
      },
    });
    if (!row || row.id !== user.userId) {
      return null;
    }
    return {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      locale: row.locale,
      isActive: row.isActive,
      createdAt: row.createdAt,
      roles: row.userRoles.map((ur) => ({ name: ur.role.name, label: ur.role.label })),
      tenantSlug: user.tenantSlug,
    };
  }

  @Post("me/change-password")
  @HttpCode(HttpStatus.OK)
  @AuditAction("user.password.change")
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    const row = await this.prisma.user.findUnique({ where: { id: user.userId } });
    if (!row) {
      throw new BadRequestException("user not found");
    }
    // Phase-20 password helper handles both Argon2id and legacy bcrypt
    // current-password checks. The NEW password always lands as
    // Argon2id regardless of the previous algorithm.
    const ok = await verifyPassword(row.passwordHash, dto.currentPassword);
    if (!ok) {
      throw new BadRequestException("current password is wrong");
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("new password must differ from current");
    }
    // Block known-breached passwords on rotation too — same policy
    // as registration. Fails open on HIBP outage.
    await rejectPwnedPassword(dto.newPassword);
    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash },
    });
    // Invalidate every existing refresh token: a password change is a
    // strong signal that any leaked session should die.
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { changed: true };
  }

  /** Admin: list users in the current tenant. */
  @Roles("admin")
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const users = await this.prisma.user.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        userRoles: { include: { role: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      isActive: u.isActive,
      createdAt: u.createdAt,
      roles: u.userRoles.map((ur) => ur.role.name),
    }));
  }
}
