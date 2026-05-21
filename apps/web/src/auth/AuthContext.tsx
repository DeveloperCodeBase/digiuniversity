// =====================================================
// AuthContext — React surface over sessionStore.
//
// Components consume:
//   const { user, isAuthenticated, hasRole, login, register, logout } = useAuth();
//
// `user` mirrors the `user` field of the latest auth response (userId,
// tenantId, tenantSlug, email, roles[]). When the user is unauthenticated
// it's null.
//
// Phase-14.5 C2: dropped @ts-nocheck. The User + Session shapes here
// match the api's `/v1/auth/{login,register,refresh,me}` response
// contracts (per apps/api/src/auth/*.controller.ts). Phase 15 will
// extract these to packages/shared-types with Zod schemas so the
// contract is enforced on both sides; for now this file is the de
// facto source-of-truth on the web side.
// =====================================================

import React from "react";
import { authApi } from "../api/endpoints.js";
import { sessionStore } from "./session-store.js";

// ----- Auth contract -------------------------------------------------

/** Authenticated user, mirrors `/v1/auth/me` response. */
export interface AuthUser {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
  /**
   * Phase-14.7 R2: full display name from User.fullName on the api.
   * Optional + nullable because legacy users may have an empty value.
   * Consumers should fall back to the email local-part.
   */
  fullName?: string | null;
  /** Tenant-scoped role names. Phase 15 adds 6 more values to this list. */
  roles: string[];
}

/** Cached session — what sessionStore persists. */
export interface AuthSession {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  /** ISO-8601 timestamp. */
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

export interface LoginInput {
  tenantSlug: string;
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True if user has ANY of the given role names. */
  hasRole: (...names: string[]) => boolean;
  login: (creds: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

// ----- Context + hook -----------------------------------------------

const AuthContext = React.createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const v = React.useContext(AuthContext);
  if (!v) {
    throw new Error("useAuth must be inside <AuthProvider>");
  }
  return v;
};

// ----- Provider -----------------------------------------------------

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = React.useState<AuthSession | null>(
    () => sessionStore.get() as AuthSession | null
  );

  // Subscribe to changes coming from outside React (e.g. the API client
  // refreshing tokens, or logout from another tab). sessionStore's
  // subscribe returns an unsubscribe fn — but specifically `() =>
  // listeners.delete(fn)` which has type `() => boolean`. useEffect's
  // cleanup contract is `() => void`, so we wrap to discard the bool.
  // (Hidden by @ts-nocheck before Phase-14.5 C2.)
  React.useEffect(() => {
    const unsub = sessionStore.subscribe(setSession);
    return () => {
      unsub();
    };
  }, []);

  const login = React.useCallback(
    async ({ tenantSlug, email, password }: LoginInput): Promise<AuthUser> => {
      const next = (await authApi.login({ tenantSlug, email, password })) as AuthSession;
      sessionStore.set(next);
      return next.user;
    },
    []
  );

  const register = React.useCallback(
    async ({
      tenantSlug,
      email,
      password,
      fullName,
    }: RegisterInput): Promise<AuthUser> => {
      const next = (await authApi.register({
        tenantSlug,
        email,
        password,
        fullName,
      })) as AuthSession;
      sessionStore.set(next);
      return next.user;
    },
    []
  );

  const logout = React.useCallback(async (): Promise<void> => {
    const cur = sessionStore.get() as AuthSession | null;
    if (cur?.refreshToken) {
      try {
        await authApi.logout(cur.refreshToken);
      } catch {
        // ignore — local state still gets cleared below
      }
    }
    sessionStore.clear();
  }, []);

  const user: AuthUser | null = session?.user ?? null;
  const isAuthenticated = !!user;

  const hasRole = React.useCallback(
    (...names: string[]): boolean => {
      if (!user) return false;
      return names.some((n) => user.roles.includes(n));
    },
    [user]
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAuthenticated,
      hasRole,
      login,
      register,
      logout,
    }),
    [session, user, isAuthenticated, hasRole, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
