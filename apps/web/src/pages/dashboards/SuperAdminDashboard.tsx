// Phase-A R3 — Super Admin role home (mocked).
// Master Runbook §5: tenants table, system health gauges, feature flags
// grid, cross-tenant analytics, impersonate button (audited).
import React from "react";
import type { Go } from "../../router";
import { DashboardShell } from "./DashboardShell";

interface SuperAdminDashboardProps { go: Go }

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ go }) => (
  <DashboardShell
    title="میز ابرمدیر"
    subtitle="نمای بین‌تنانتی · سلامت سیستم · جان‌سپاری حساب"
    ctaLabel="بازبینی حسابرسی"
    onCta={() => go("audit")}
    go={go}
    kpis={[
      { label: "تنانت‌ها", value: "۱۲", trend: "+ ۱", icon: "layers" },
      { label: "کاربران فعال (۲۴h)", value: "۸,۴۰۰", trend: "+ ۳.۲٪", icon: "users" },
      { label: "خطاهای ۵xx", value: "۰.۸٪", trend: "+ ۰.۲", trendDown: true, icon: "shield" },
      { label: "خط فعالیت AI", value: "۹۲٪", trend: "− ۱.۱٪", icon: "sparkle" },
    ]}
  />
);

export default SuperAdminDashboard;
