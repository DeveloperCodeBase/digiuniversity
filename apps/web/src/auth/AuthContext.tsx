// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// AuthContext — React surface over sessionStore.
//
// Components consume:
//   const { user, isAuthenticated, hasRole, login, register, logout } = useAuth();
//
// `user` mirrors the `user` field of the latest auth response (userId,
// tenantId, tenantSlug, email, roles[]). When the user is unauthenticated
// it's null.
// =====================================================

import React from "react";
import { authApi } from "../api/endpoints.js";
import { sessionStore } from "./session-store.js";

const AuthContext = React.createContext(null);

export const useAuth = () => {
  const v = React.useContext(AuthContext);
  if (!v) {
    throw new Error("useAuth must be inside <AuthProvider>");
  }
  return v;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = React.useState(() => sessionStore.get());

  // Subscribe to changes coming from outside React (e.g. the API client
  // refreshing tokens, or logout from another tab).
  React.useEffect(() => sessionStore.subscribe(setSession), []);

  const login = React.useCallback(async ({ tenantSlug, email, password }) => {
    const next = await authApi.login({ tenantSlug, email, password });
    sessionStore.set(next);
    return next.user;
  }, []);

  const register = React.useCallback(async ({ tenantSlug, email, password, fullName }) => {
    const next = await authApi.register({ tenantSlug, email, password, fullName });
    sessionStore.set(next);
    return next.user;
  }, []);

  const logout = React.useCallback(async () => {
    const cur = sessionStore.get();
    if (cur?.refreshToken) {
      try {
        await authApi.logout(cur.refreshToken);
      } catch {
        // ignore — local state still gets cleared below
      }
    }
    sessionStore.clear();
  }, []);

  const user = session?.user ?? null;
  const isAuthenticated = !!user;

  const hasRole = React.useCallback(
    (...names) => {
      if (!user) return false;
      return names.some((n) => user.roles.includes(n));
    },
    [user],
  );

  const value = React.useMemo(
    () => ({
      session,
      user,
      isAuthenticated,
      hasRole,
      login,
      register,
      logout,
    }),
    [session, user, isAuthenticated, hasRole, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
