import { createHash, randomBytes } from "node:crypto";

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../prisma/prisma.service";
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  RefreshTokenPayload,
} from "./auth.types";
import { LoginDto } from "./dto/login.dto";
import {
  hashPassword,
  needsRehash,
  passwordAlgorithm,
  verifyPassword,
} from "./password";
import { rejectPwnedPassword } from "./password-breach";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";

interface AuthSuccess {
  accessToken: string;
  accessTokenExpiresIn: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------- registration ----------
  //
  // Self-registration creates a "student" user in an *existing* tenant.
  // Provisioning a new tenant is an admin-only operation handled in
  // TenantsController. We surface conflicts as 409 to make it impossible
  // to enumerate registered emails via the response code alone.

  async register(
    dto: RegisterDto,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthSuccess> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException("unknown tenant");
    }

    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email.toLowerCase() } },
    });
    if (existing) {
      throw new ConflictException("email already registered for this tenant");
    }

    const studentRole = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId: tenant.id, name: "student" } },
    });
    if (!studentRole) {
      throw new UnauthorizedException("tenant has no student role configured");
    }

    // Phase-20 (brought forward): block known-breached passwords via
    // HIBP k-anonymity. Throws BadRequest 400 if the password has
    // ever appeared in a public breach. Fail-open if HIBP is
    // unreachable so a network blip never blocks registration.
    await rejectPwnedPassword(dto.password);

    // Argon2id from the start for every new user. Pre-existing bcrypt
    // users keep working via the lazy-migration path in login() below.
    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        userRoles: { create: [{ roleId: studentRole.id }] },
      },
    });

    return this.issueTokens({ tenant, user, roles: ["student"], meta });
  }

  // ---------- login ----------

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthSuccess> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException("invalid credentials");
    }

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email.toLowerCase() } },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user || !user.isActive) {
      // Intentionally identical error to a bad password — no user enumeration.
      throw new UnauthorizedException("invalid credentials");
    }

    // Phase-20 lazy migration: verifyPassword auto-detects bcrypt vs
    // argon2id by hash prefix, so legacy users keep authenticating.
    const ok = await verifyPassword(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException("invalid credentials");
    }

    // Re-hash legacy bcrypt passwords with Argon2id on successful
    // login. Best-effort: a failed rehash never blocks the user from
    // logging in (their credentials are still valid). We log the
    // upgrade for ops visibility; over time, the population of
    // bcrypt users monotonically shrinks until the legacy branch is
    // empty and can be retired.
    if (needsRehash(user.passwordHash)) {
      const previousAlgo = passwordAlgorithm(user.passwordHash);
      try {
        const rehashed = await hashPassword(dto.password);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: rehashed },
        });
        this.logger.log(
          `password rehashed ${previousAlgo} → argon2id for user=${user.id} tenant=${tenant.id}`,
        );
      } catch (err) {
        // Never throw — the user's login already succeeded.
        this.logger.warn(
          `password rehash failed for user=${user.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    return this.issueTokens({ tenant, user, roles, meta });
  }

  // ---------- refresh ----------
  //
  // We rotate refresh tokens: each refresh issues a new pair AND marks
  // the consumed token as revoked + `replacedBy`. If we ever see a
  // refresh attempt against an already-revoked token, that's a strong
  // signal of theft — we revoke the whole family.

  async refresh(
    dto: RefreshDto,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthSuccess> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException("invalid refresh token");
    }
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("not a refresh token");
    }

    const tokenHash = sha256(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored) {
      throw new UnauthorizedException("refresh token not recognised");
    }
    if (stored.revokedAt) {
      // Suspected replay — burn the whole family for this user.
      this.logger.warn(
        `refresh token replay detected for user=${payload.sub} tenant=${payload.tenantId}`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("refresh token reuse detected");
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("refresh token expired");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true, userRoles: { include: { role: true } } },
    });
    if (!user || !user.isActive || !user.tenant.isActive) {
      throw new UnauthorizedException("user or tenant inactive");
    }
    const roles = user.userRoles.map((ur) => ur.role.name);

    const tokens = await this.issueTokens({
      tenant: user.tenant,
      user,
      roles,
      meta,
    });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: sha256(tokens.refreshToken) },
    });

    return tokens;
  }

  // ---------- logout ----------

  async logout(refreshToken: string): Promise<{ revoked: boolean }> {
    const tokenHash = sha256(refreshToken);
    const found = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!found || found.revokedAt) {
      return { revoked: false };
    }
    await this.prisma.refreshToken.update({
      where: { id: found.id },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  // ---------- helpers ----------

  private async issueTokens(input: {
    tenant: { id: string; slug: string };
    // Phase-14.7 R2: fullName flows into the response so the web client
    // can greet the actual logged-in user instead of the mock role
    // identity ("نسرین رضوی"). Optional because the column is nullable
    // on legacy users.
    user: { id: string; email: string; fullName?: string | null };
    roles: string[];
    meta: { userAgent?: string; ip?: string };
  }): Promise<AuthSuccess> {
    const accessTtl = this.config.get<string>("JWT_ACCESS_TTL", "15m");
    const refreshTtl = this.config.get<string>("JWT_REFRESH_TTL", "30d");
    const refreshExpiresAt = parseDuration(refreshTtl);

    const accessPayload: AccessTokenPayload = {
      sub: input.user.id,
      tenantId: input.tenant.id,
      tenantSlug: input.tenant.slug,
      email: input.user.email,
      roles: input.roles,
      type: "access",
    };

    // We pre-generate the refresh JTI so we can sign it INTO the JWT and
    // then store the row keyed on its hash.
    const jti = randomBytes(16).toString("hex");
    const refreshPayload: RefreshTokenPayload = {
      sub: input.user.id,
      tenantId: input.tenant.id,
      jti,
      type: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, { expiresIn: accessTtl }),
      this.jwt.signAsync(refreshPayload, { expiresIn: refreshTtl }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        tenantId: input.tenant.id,
        userId: input.user.id,
        tokenHash: sha256(refreshToken),
        userAgent: input.meta.userAgent?.slice(0, 256),
        ip: input.meta.ip?.slice(0, 64),
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      accessTokenExpiresIn: accessTtl,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
      user: {
        userId: input.user.id,
        tenantId: input.tenant.id,
        tenantSlug: input.tenant.slug,
        email: input.user.email,
        fullName: input.user.fullName ?? null,
        roles: input.roles,
      },
    };
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseDuration(input: string): Date {
  // Accept "15m", "2h", "30d", "60s". Anything else is treated as seconds.
  const m = /^(\d+)\s*(s|m|h|d)$/i.exec(input.trim());
  const now = Date.now();
  if (!m) {
    const secs = Number(input);
    return new Date(now + (Number.isFinite(secs) ? secs * 1000 : 0));
  }
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const ms =
    unit === "s" ? n * 1_000 :
    unit === "m" ? n * 60_000 :
    unit === "h" ? n * 3_600_000 :
                   n * 86_400_000;
  return new Date(now + ms);
}
