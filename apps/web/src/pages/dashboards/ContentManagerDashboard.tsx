// Phase-A R3 — Content Manager role home (mocked).
// Master Runbook §5: course approval queue with split-view (preview /
// rubric+checklist), quality criteria, comments thread.
import React from "react";
import type { Go } from "../../router";
import { DashboardShell } from "./DashboardShell";

interface ContentManagerDashboardProps { go: Go }

export const ContentManagerDashboard: React.FC<ContentManagerDashboardProps> = ({ go }) => (
  <DashboardShell
    title="میز مدیر محتوا"
    subtitle="صف بازبینی دروس · معیار کیفیت · بحث‌های بازبینی"
    ctaLabel="ورود به استودیو"
    onCta={() => go("authoring")}
    go={go}
    kpis={[
      { label: "در صف بازبینی", value: "۸", trend: "+ ۲", icon: "file" },
      { label: "تأییدشده این هفته", value: "۱۴", trend: "+ ۳", icon: "check" },
      { label: "بازگشتی با کامنت", value: "۳", trend: "− ۱", icon: "chat" },
      { label: "میانگین زمان بازبینی", value: "۲.۴h", trend: "− ۱۰٪", icon: "pulse" },
    ]}
  />
);

export default ContentManagerDashboard;
