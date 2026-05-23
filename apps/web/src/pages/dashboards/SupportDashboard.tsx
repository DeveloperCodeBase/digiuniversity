// Phase-A R3 — Support role home (mocked).
// Master Runbook §5: tickets queue, impersonation with mandatory
// reason+audit, refund processing shortcut.
import React from "react";
import type { Go } from "../../router";
import { DashboardShell } from "./DashboardShell";

interface SupportDashboardProps { go: Go }

export const SupportDashboard: React.FC<SupportDashboardProps> = ({ go }) => (
  <DashboardShell
    title="میز پشتیبانی"
    subtitle="تیکت‌های باز · جان‌سپاری حساب · پردازش بازگشت وجه"
    ctaLabel="گزارش حسابرسی"
    onCta={() => go("audit")}
    go={go}
    kpis={[
      { label: "تیکت باز", value: "۱۴", trend: "− ۲", icon: "headset" },
      { label: "SLA نقض‌شده", value: "۲", trend: "+ ۱", trendDown: true, icon: "warn" },
      { label: "زمان پاسخ متوسط", value: "۳۶m", trend: "− ۵m", icon: "pulse" },
      { label: "بازگشت در صف", value: "۳", icon: "dollar" },
    ]}
  />
);

export default SupportDashboard;
