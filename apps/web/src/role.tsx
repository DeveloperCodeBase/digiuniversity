// =====================================================
// Role context — manages current user role
// =====================================================
//
// Phase-14.5 C1: dropped @ts-nocheck. This file is the RBAC type
// contract that the rest of the app (sidenav, shared.tsx Nav,
// ui.tsx role-switcher, Phase 15 CASL abilities-factory) depends on.
//
// Today there are 5 hard-coded roles. Phase 15 extends to 9
// (TA, ContentManager, Support, Moderator, SuperAdmin added;
// `org` renamed to `OrganizationManager`) AND wires the role to come
// from `/v1/auth/me` instead of localStorage. When that lands, the
// RoleId union below grows; everything that imports it gets a
// compile-time TODO list of places to update.
// =====================================================
import React from "react";

export type RoleId = "student" | "instructor" | "admin" | "parent" | "org";

// Permissions are deliberately a precise union (not `string`) so a
// new permission added in Phase 15 surfaces in every <Can> check
// that hasn't accounted for it. The cost is one type update per
// permission added; the benefit is no silent typos.
export type RolePermission =
  // student
  | "learn"
  | "submit"
  | "discuss"
  | "view-grades"
  // instructor
  | "teach"
  | "grade"
  | "approve-ai"
  | "create-content"
  // admin
  | "manage-users"
  | "moderate"
  | "configure"
  | "billing"
  // parent
  | "view-child"
  | "view-bills"
  | "communicate"
  // org
  | "manage-team"
  | "view-progress";

export interface Role {
  /** Stable identifier; matches the key in ROLES. */
  id: RoleId;
  /** Persian display label ("دانشجو", "استاد", ...). */
  label: string;
  /** Display name of the seed user for this role. */
  name: string;
  /** Two-letter avatar initials. */
  avatar: string;
  /** CSS token name for the role colour ("cyan", "amber", "violet", "rose"). */
  color: string;
  /** One-line role context (department / cohort / etc.). */
  subtitle: string;
  /** Mock identifier shown under the name. */
  code: string;
  /** Route ids visible in the top nav for this role. */
  nav: string[];
  /** Route id rendered after login for this role. */
  homeRoute: string;
  /** Coarse-grained capability flags; Phase 15 swaps these for CASL abilities. */
  permissions: RolePermission[];
}

export const ROLES: Record<RoleId, Role> = {
  student: {
    id: "student",
    label: "دانشجو",
    name: "نسرین رضوی",
    avatar: "نر",
    color: "cyan",
    subtitle: "ارشد علوم داده",
    code: "ST-84-02-17",
    nav: ["home", "catalog", "my-courses", "progress", "tutor", "calendar", "community"],
    homeRoute: "progress",
    permissions: ["learn", "submit", "discuss", "view-grades"],
  },
  instructor: {
    id: "instructor",
    label: "استاد",
    name: "دکتر آرش عظیمی",
    avatar: "AA",
    color: "amber",
    subtitle: "دانشکده علوم رایانه",
    code: "FA-09-A47",
    nav: ["home", "catalog", "instructor", "authoring", "classroom", "analytics", "tutor"],
    homeRoute: "progress",
    permissions: ["teach", "grade", "approve-ai", "create-content"],
  },
  admin: {
    id: "admin",
    label: "مدیر",
    name: "احمد محمدی",
    avatar: "AM",
    color: "violet",
    subtitle: "مدیر سامانه‌ها",
    code: "AD-001",
    nav: ["home", "catalog", "progress", "admin", "analytics", "tutor", "events"],
    homeRoute: "progress",
    permissions: ["manage-users", "moderate", "configure", "billing"],
  },
  parent: {
    id: "parent",
    label: "والد",
    name: "محمد رضوی",
    avatar: "MR",
    color: "rose",
    subtitle: "والد · نسرین رضوی",
    code: "PR-84-02",
    nav: ["home", "parent", "calendar", "credential", "help"],
    homeRoute: "parent",
    permissions: ["view-child", "view-bills", "communicate"],
  },
  org: {
    id: "org",
    label: "سازمان",
    name: "شرکت دانش‌بنیان فردا",
    avatar: "DF",
    color: "amber",
    subtitle: "Enterprise · ۱۴۰ کاربر",
    code: "ORG-2026-DF",
    nav: ["home", "admin", "analytics", "events", "pricing", "help"],
    homeRoute: "admin",
    permissions: ["manage-team", "view-progress", "billing"],
  },
};

export interface RoleContextValue {
  role: Role;
  setRole: (id: RoleId) => void;
}

export const RoleContext = React.createContext<RoleContextValue>({
  role: ROLES.student,
  // Default no-op — overridden by RoleProvider; only triggered if a
  // consumer renders outside the provider (which is a bug).
  setRole: () => {},
});

export const useRole = (): RoleContextValue => React.useContext(RoleContext);

const STORAGE_KEY = "digiu_role";

/** Safely read the persisted role from localStorage, defaulting to student. */
const readPersistedRole = (): RoleId => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (raw === "student" || raw === "instructor" || raw === "admin" || raw === "parent" || raw === "org")) {
      return raw;
    }
  } catch {
    // localStorage may be blocked (Safari private mode, iframe); fall through.
  }
  return "student";
};

export interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider = ({ children }: RoleProviderProps) => {
  const [roleId, setRoleId] = React.useState<RoleId>(readPersistedRole);

  const setRole = React.useCallback((id: RoleId) => {
    if (id in ROLES) {
      setRoleId(id);
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // ignore — same reason as readPersistedRole
      }
    }
  }, []);

  const value = React.useMemo<RoleContextValue>(
    () => ({ role: ROLES[roleId] ?? ROLES.student, setRole }),
    [roleId, setRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
