// Phase-A R3 — TA role home (mocked).
// Master Runbook §5: assigned offerings list, grading queue scoped to
// TA permissions, NO authoring access.
import React from "react";
import type { Go } from "../../router";
import { DashboardShell } from "./DashboardShell";

interface TADashboardProps { go: Go }

export const TADashboard: React.FC<TADashboardProps> = ({ go }) => (
  <DashboardShell
    title="میز دستیار آموزشی"
    subtitle="دروس واگذارشده · صف نمره‌گذاری · پشتیبانی دانشجو"
    ctaLabel="شروع نمره‌گذاری"
    onCta={() => go("assessment")}
    go={go}
    kpis={[
      { label: "دروس واگذار", value: "۲", icon: "book" },
      { label: "ارسال در صف", value: "۱۸", trend: "+ ۵", icon: "file" },
      { label: "ساعت آفیس ساعت", value: "۴h", icon: "calendar" },
      { label: "دانشجوی فعال", value: "۹۲", trend: "+ ۲", icon: "users" },
    ]}
  />
);

export default TADashboard;
