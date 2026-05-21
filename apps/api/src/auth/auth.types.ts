/**
 * Shape stored in the JWT and rehydrated by JwtStrategy. Every
 * controller that uses @CurrentUser() receives this.
 */
export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
  /**
   * Phase-14.7 R2: full display name (matches User.fullName). Optional
   * because the JWT may not carry it (legacy tokens) and because some
   * users may have a null fullName. Web clients should fall back to
   * the email local-part when this is empty.
   */
  fullName?: string | null;
  roles: string[];
}

/** Payload signed into the access JWT. */
export interface AccessTokenPayload {
  sub: string;          // user id
  tenantId: string;
  tenantSlug: string;
  email: string;
  roles: string[];
  type: "access";
}

/** Payload signed into the refresh JWT (kept small on purpose). */
export interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  jti: string;          // refresh-token row id
  type: "refresh";
}
