import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { AccessTokenPayload, AuthenticatedUser } from "../auth.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    const secret = config.get<string>("JWT_SECRET");
    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET must be set and at least 32 characters");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (payload.type !== "access") {
      throw new UnauthorizedException("not an access token");
    }
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
