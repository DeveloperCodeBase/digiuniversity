// Phase-A R3 — Org Manager role home (mocked).
// Master Runbook §5: cohort dashboard, bulk enroll CSV button, seat
// utilization, invoicing summary.
import React from "react";
import type { Go } from "../../router";
import { DashboardShell } from "./DashboardShell";

interface OrgDashboardProps { go: Go }

export const OrgDashboard: React.FC<OrgDashboardProps> = ({ go }) => (
  <DashboardShell
    title="میز مدیر سازمان"
    subtitle="کوهورت‌ها · ظرفیت سیت · صورتحساب · ثبت گروهی"
    ctaLabel="ثبت گروهی CSV"
    onCta={() => go("registration")}
    go={go}
    kpis={[
      { label: "کاربران سازمان", value: "۱۴۰", trend: "+ ۸", icon: "users" },
      { label: "سیت استفاده‌شده", value: "۱۲۲ / ۱۵۰", trend: "+ ۴٪", icon: "layers" },
      { label: "کوهورت فعال", value: "۳", icon: "book" },
      { label: "صورتحساب باز", value: "۱", icon: "dollar" },
    ]}
  />
);

export default OrgDashboard;
