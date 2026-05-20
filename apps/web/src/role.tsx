// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Role context — manages current user role
// =====================================================
import React from "react";

export const ROLES = {
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

export const RoleContext = React.createContext({
  role: ROLES.student,
  setRole: () => {},
});

export const useRole = () => React.useContext(RoleContext);

export const RoleProvider = ({ children }) => {
  const [roleId, setRoleId] = React.useState(() => {
    try { return localStorage.getItem("digiu_role") || "student"; }
    catch { return "student"; }
  });
  const setRole = (id) => {
    if (ROLES[id]) {
      setRoleId(id);
      try { localStorage.setItem("digiu_role", id); } catch {}
    }
  };
  return (
    <RoleContext.Provider value={{ role: ROLES[roleId] || ROLES.student, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};
