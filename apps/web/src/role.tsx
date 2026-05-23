// =====================================================
// Role context — manages current user role
// =====================================================
//
// Phase-14.5 C1: dropped @ts-nocheck. This file is the RBAC type
// contract that the rest of the app (sidenav, shared.tsx Nav,
// ui.tsx role-switcher, CASL abilities) depends on.
//
// Phase-15 R7: extended the role catalogue from 5 to 10. The
// `student`, `instructor`, `admin`, `parent`, `org` entries stay
// shaped exactly as before. The new five — `ta`, `content_manager`,
// `support`, `moderator`, `super_admin` — get their own ROLES entry
// plus a tailored `nav` list so the sidebar surfaces only the routes
// each capability set can actually use. Display names + avatars are
// placeholders the api can later override per logged-in user.
//
// The RoleId union is the source of truth — TypeScript catches every
// switch / lookup that forgot to handle a new entry. Adjacent ability
// rules live in apps/web/src/auth/ability.ts and the api's
// `AbilityFactory`.
// =====================================================
import React from "react";

export type RoleId =
  | "student"
  | "instructor"
  | "admin"
  | "parent"
  | "org"
  | "ta"
  | "content_manager"
  | "support"
  | "moderator"
  | "super_admin";

// Permissions are deliberately a precise union (not `string`) so a
// new permission added later surfaces in every <Can> check that
// hasn't accounted for it. Phase 15 R7 keeps these coarse flags
// alongside the per-action CASL abilities — both layers are useful
// (RBAC flags for quick nav decisions, CASL for record-level checks).
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
  | "view-progress"
  // ta
  | "tutor-students"
  // content_manager
  | "publish-content"
  // support
  | "audit-read"
  | "reset-passwords"
  // moderator
  | "moderate-discussions"
  // super_admin
  | "cross-tenant";

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
  /** Coarse-grained capability flags; pairs with CASL abilities. */
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
    nav: ["home", "catalog", "progress", "admin", "analytics", "audit", "tutor", "events"],
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
    // Phase-A R3: dedicated Org Manager dashboard at /org.
    homeRoute: "org",
    permissions: ["manage-team", "view-progress", "billing"],
  },
  ta: {
    id: "ta",
    label: "دستیار آموزشی",
    name: "سینا کریمی",
    avatar: "SK",
    color: "cyan",
    subtitle: "دستیار · علوم داده",
    code: "TA-2026-07",
    nav: ["home", "catalog", "my-courses", "classroom", "progress", "tutor"],
    // Phase-A R3: dedicated TA dashboard at /ta replaces the old classroom landing.
    homeRoute: "ta",
    permissions: ["teach", "grade", "tutor-students"],
  },
  content_manager: {
    id: "content_manager",
    label: "مدیر محتوا",
    name: "ندا رحمانی",
    avatar: "NR",
    color: "amber",
    subtitle: "تیم تولید محتوا",
    code: "CM-2026-03",
    nav: ["home", "catalog", "authoring", "analytics", "help"],
    // Phase-A R3: dedicated Content Manager dashboard at /content.
    homeRoute: "content",
    permissions: ["create-content", "publish-content"],
  },
  support: {
    id: "support",
    label: "پشتیبانی",
    name: "حسین مرادی",
    avatar: "HM",
    color: "rose",
    subtitle: "پشتیبانی فنی",
    code: "SUP-2026-12",
    nav: ["home", "admin", "audit", "messages", "help"],
    // Phase-A R3: dedicated Support desk at /support.
    homeRoute: "support",
    permissions: ["audit-read", "reset-passwords"],
  },
  moderator: {
    id: "moderator",
    label: "ناظر",
    name: "زهرا فرجی",
    avatar: "ZF",
    color: "violet",
    subtitle: "ناظر انجمن‌ها",
    code: "MOD-2026-05",
    nav: ["home", "community", "messages", "help"],
    // Phase-A R3: dedicated Moderator queue at /moderate.
    homeRoute: "moderate",
    permissions: ["moderate-discussions", "moderate"],
  },
  super_admin: {
    id: "super_admin",
    label: "ابرمدیر",
    name: "علی هاشمی",
    avatar: "AH",
    color: "violet",
    subtitle: "ابرمدیر · بین‌تنانتی",
    code: "SA-001",
    nav: ["home", "admin", "analytics", "audit", "tutor", "events"],
    // Phase-A R3: dedicated Super Admin overview at /super.
    homeRoute: "super",
    permissions: [
      "manage-users",
      "moderate",
      "configure",
      "billing",
      "audit-read",
      "cross-tenant",
    ],
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

// Set-based check is cheaper to extend than the chained || from the
// pre-R7 5-role world.
const VALID_ROLE_IDS: ReadonlySet<RoleId> = new Set<RoleId>([
  "student",
  "instructor",
  "admin",
  "parent",
  "org",
  "ta",
  "content_manager",
  "support",
  "moderator",
  "super_admin",
]);

/** Safely read the persisted role from localStorage, defaulting to student. */
const readPersistedRole = (): RoleId => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_ROLE_IDS.has(raw as RoleId)) {
      return raw as RoleId;
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
