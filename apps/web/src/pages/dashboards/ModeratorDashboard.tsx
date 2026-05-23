// Phase-A R3 — Moderator role home (mocked).
// Master Runbook §5: flagged content queue, forum reports,
// auto-moderation rules table.
import React from "react";
import type { Go } from "../../router";
import { DashboardShell } from "./DashboardShell";

interface ModeratorDashboardProps { go: Go }

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({ go }) => (
  <DashboardShell
    title="میز نظارت انجمن‌ها"
    subtitle="گزارش‌های پرچم‌خورده · قوانین خودکار · بحث‌های فعال"
    ctaLabel="رفتن به انجمن"
    onCta={() => go("community")}
    go={go}
    kpis={[
      { label: "گزارش پرچم‌خورده", value: "۲۲", trend: "+ ۴", icon: "warn" },
      { label: "بحث‌های فعال", value: "۸۴", icon: "chat" },
      { label: "قانون خودکار فعال", value: "۹", icon: "shield" },
      { label: "اقدام امروز", value: "۱۱", trend: "+ ۲", icon: "check" },
    ]}
  />
);

export default ModeratorDashboard;
