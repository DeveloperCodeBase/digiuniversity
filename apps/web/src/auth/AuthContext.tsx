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
import {
  AbilityContext,
  buildAbility,
  type AppAbility,
  type PackedRules,
} from "./ability";

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
  /** Tenant-scoped role names. Phase 15 R1 widened to 10 in the DB. */
  roles: string[];
  /**
   * Phase-15 R7: packed CASL rules from the api's `/v1/auth/me`. Only
   * present on responses from /me; login/register responses today
   * don't include it, so AuthProvider fetches /me after each login
   * to populate this and persists alongside the session.
   */
  abilities?: PackedRules;
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
  /**
   * Phase-15 R7: CASL ability built from the user's packed rules. Empty
   * ability when unauthenticated so callers can always `ability.can(...)`
   * without a null check. Prefer the `<Can>` JSX wrapper from
   * `auth/Can.tsx` for render-time gates.
   */
  ability: AppAbility;
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

/**
 * After login/register the session has tokens but no ability rules
 * (login response on the api doesn't include them — only /me does).
 * This helper fetches /me with the brand-new access token and merges
 * the abilities into the stored session, so the SPA's <Can> guards
 * activate immediately without a second render-cycle delay.
 *
 * Best-effort: a network blip while fetching /me leaves the session
 * authenticated but with an empty ability set. The Layout-level
 * auth-gate covers the obvious case (workspace routes require
 * authentication); <Can> just under-renders if abilities never
 * arrive. The next reload re-runs hydrateAbilities().
 */
const hydrateAbilities = async (session: AuthSession): Promise<AuthSession> => {
  try {
    const me = (await authApi.me()) as { abilities?: PackedRules };
    return {
      ...session,
      user: { ...session.user, abilities: me.abilities },
    };
  } catch {
    return session;
  }
};

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

  // On mount with a pre-existing session (e.g. page reload), fetch
  // /v1/auth/me to refresh the user's ability set. We do not block
  // rendering on this — the stored session is good enough for routing
  // and the Can guards fall safely closed until abilities arrive.
  React.useEffect(() => {
    const cur = sessionStore.get() as AuthSession | null;
    if (!cur) return;
    if (cur.user && Array.isArray(cur.user.abilities) && cur.user.abilities.length > 0) {
      return; // already hydrated
    }
    void hydrateAbilities(cur).then((next) => {
      sessionStore.set(next);
    });
  }, []);

  const login = React.useCallback(
    async ({ tenantSlug, email, password }: LoginInput): Promise<AuthUser> => {
      const next = (await authApi.login({ tenantSlug, email, password })) as AuthSession;
      sessionStore.set(next);
      const hydrated = await hydrateAbilities(next);
      sessionStore.set(hydrated);
      return hydrated.user;
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
      const hydrated = await hydrateAbilities(next);
      sessionStore.set(hydrated);
      return hydrated.user;
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

  // Rehydrate the CASL ability whenever the user's packed rules
  // change (login, logout, refresh, /me-on-mount hydration). Memoised
  // by reference so a no-op render doesn't rebuild the ability object
  // — CASL caches its internal rule index on the instance, so we want
  // identity stability.
  const ability = React.useMemo<AppAbility>(
    () => buildAbility(user?.abilities),
    [user?.abilities],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAuthenticated,
      hasRole,
      ability,
      login,
      register,
      logout,
    }),
    [session, user, isAuthenticated, hasRole, ability, login, register, logout]
  );

  // Publish the ability on its own context too so `<Can>` from
  // auth/Can.tsx works without each consumer pulling useAuth() first.
  // The two contexts are kept in sync by sharing the memoised ability.
  return (
    <AuthContext.Provider value={value}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </AuthContext.Provider>
  );
};
