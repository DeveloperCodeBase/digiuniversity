// Phase-A R2.6 — typed.
// =====================================================
// Live progress dashboard.
//
// Reads /api/v1/analytics/student/me + /risk/me. For staff users it
// also pulls /tenant. Every number on the page is real — no mocks —
// and the risk panel surfaces the explainable rule-based factors.
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useAuth } from "../auth/AuthContext";
import { analyticsApi } from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { toFa } from "../shared";
import { Button } from "../ui";
import type { Go } from "../router";

const BAND_COLOR: Record<string, { bg: string; fg: string }> = {
  low: { bg: "color-mix(in oklch, var(--accent) 14%, var(--bg))", fg: "var(--accent)" },
  medium: { bg: "color-mix(in oklch, var(--amber) 16%, var(--bg))", fg: "var(--amber)" },
  high: { bg: "color-mix(in oklch, var(--warn) 18%, var(--bg))", fg: "var(--warn)" },
};
const BAND_LABEL: Record<string, string> = { low: "کم", medium: "متوسط", high: "بالا" };

interface StatPropsLocal { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode }
const Stat: React.FC<StatPropsLocal> = ({ label, value, hint }) => (
  <div
    className="rounded-2xl"
    style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--line)", flex: "1 1 200px", minWidth: 180 }}
  >
    <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}>
      {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{value}</div>
    {hint && (
      <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6 }}>{hint}</div>
    )}
  </div>
);

const EVENT_LABEL: Record<string, string> = {
  course_opened: "ورود به درس",
  lesson_opened: "بازکردن جلسه",
  lesson_completed: "تکمیل جلسه",
  video_played: "پخش ویدئو",
  video_paused: "توقف ویدئو",
  quiz_started: "شروع آزمون",
  quiz_submitted: "ارسال آزمون",
  assignment_submitted: "ارسال تکلیف",
  submission_graded: "نمره‌گذاری شد",
  class_joined: "ورود به کلاس",
  class_left: "خروج از کلاس",
  ai_tutor_asked: "پرسش از دستیار AI",
  ai_summary_viewed: "مشاهده خلاصه AI",
  confusion_reported: "گزارش ابهام",
};

interface SignInPromptProps { go: Go }
const SignInPrompt: React.FC<SignInPromptProps> = ({ go }) => (
  <main className="shell" style={{ paddingTop: 80, paddingBottom: 80 }}>
    <div
      className="rounded-2xl"
      style={{
        padding: 40,
        background: "var(--surface)",
        border: "1px solid var(--line)",
        maxWidth: 560,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <Icon name="lock" size={28} />
      <h2 className="h-2 mt-4">برای دیدن داشبورد وارد شوید</h2>
      <Button variant="primary" className="mt-7" onClick={() => go("login")}>
        ورود به حساب
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </main>
);

interface ProgressPageProps { go: Go }

const ProgressPage: React.FC<ProgressPageProps> = ({ go }) => {
  const { isAuthenticated, user, hasRole } = useAuth();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<any>(null);
  const [risk, setRisk] = React.useState<any>(null);
  const [tenantSummary, setTenantSummary] = React.useState<any>(null);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const staff = hasRole("admin");
    Promise.all([
      analyticsApi.studentMe(),
      analyticsApi.riskMe(),
      staff ? analyticsApi.tenant() : Promise.resolve(null),
    ])
      .then(([s, r, t]) => {
        if (cancelled) return;
        setSummary(s);
        setRisk(r);
        setTenantSummary(t);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.displayMessage : err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hasRole]);

  if (!isAuthenticated) return <SignInPrompt go={go} />;

  return (
    <main className="shell" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <header>
        <span className="eyebrow">LIVE PROGRESS · داده‌های واقعی</span>
        <h1 className="h-1 mt-3">پیشرفت من</h1>
        <p style={{ color: "var(--fg-mute)", marginTop: 12, maxWidth: 720 }}>
          هر عدد در این صفحه مستقیماً از <code style={{ direction: "ltr" }}>/api/v1/analytics</code>
          خوانده می‌شود. ثبت‌نام‌ها، حضور در کلاس‌ها، ارسال آزمون‌ها و
          استفاده از دستیار AI همگی به صورت رویداد ذخیره می‌شوند.
        </p>
      </header>

      {loading && (
        <p className="mt-9" style={{ color: "var(--fg-mute)" }}>در حال بارگذاری...</p>
      )}
      {error && (
        <div
          className="mt-9 rounded-lg"
          style={{
            padding: "14px 18px",
            background: "color-mix(in oklch, var(--warn) 18%, var(--bg))",
            border: "1px solid var(--warn)",
            color: "var(--warn)",
          }}
        >
          {error}
        </div>
      )}

      {summary && (
        <>
          <section className="mt-9 flex gap-4 flex-wrap">
            <Stat
              label="ثبت‌نام‌های فعال"
              value={toFa(String(summary.enrollments.active))}
              hint={`از ${toFa(String(summary.enrollments.total))} کل ثبت‌نام`}
            />
            <Stat
              label="آزمون‌ها / تکالیف"
              value={toFa(String(summary.submissions.total))}
              hint={
                summary.submissions.graded
                  ? `${toFa(String(summary.submissions.graded))} نمره‌گذاری‌شده`
                  : "هنوز نمره‌ای ثبت نشده"
              }
            />
            <Stat
              label="میانگین نمره"
              value={
                summary.submissions.averageGrade !== null
                  ? toFa(summary.submissions.averageGrade.toFixed(1))
                  : "—"
              }
              hint="از ۱۰۰"
            />
            <Stat
              label="حضور در کلاس"
              value={toFa(String(summary.sessions.joined))}
              hint="ثبت‌های Attendance"
            />
            <Stat
              label="تعامل با AI"
              value={toFa(String(summary.aiInteractions))}
              hint="درخواست‌های ai-gateway"
            />
          </section>

          {risk && (
            <section
              className="mt-9 rounded-2xl"
              style={{
                padding: 22,
                background: BAND_COLOR[risk.band]?.bg || "var(--surface)",
                border: "1px solid " + (BAND_COLOR[risk.band]?.fg || "var(--line)"),
              }}
            >
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", color: BAND_COLOR[risk.band]?.fg }}>
                    RISK · {risk.source}
                  </div>
                  <h2 className="h-2 mt-2">شاخص ریسک یادگیری</h2>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: BAND_COLOR[risk.band]?.fg,
                      lineHeight: 1,
                    }}
                  >
                    {toFa((risk.score * 100).toFixed(0))}
                    <span style={{ fontSize: 16, color: "var(--fg-mute)" }}>%</span>
                  </div>
                  <div className="pill mt-2" style={{ fontSize: 11 }}>
                    {BAND_LABEL[risk.band] || risk.band}
                  </div>
                </div>
              </div>
              {risk.factors.length === 0 ? (
                <p className="mt-4" style={{ color: "var(--fg-mute)" }}>
                  هیچ عامل ریسک قابل توجهی شناسایی نشده است.
                </p>
              ) : (
                <ul
                  className="mt-4"
                  style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {risk.factors.map((f: { key: string; label: string; contribution: number; detail: string }) => (
                    <li
                      key={f.key}
                      className="rounded-lg"
                      style={{
                        padding: "12px 14px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <strong style={{ fontSize: 14 }}>{f.label}</strong>
                        <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                          +{toFa((f.contribution * 100).toFixed(0))}%
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>
                        {f.detail}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p
                className="mt-4"
                style={{ fontSize: 12, color: "var(--fg-mute)", borderTop: "1px solid var(--line)", paddingTop: 12 }}
              >
                این شاخص بر اساس قواعد تعریف‌شده محاسبه می‌شود و
                <strong> هرگز تصمیم نهایی نمی‌گیرد</strong> — برای بازبینی انسانی است.
              </p>
            </section>
          )}

          <section className="mt-9">
            <h2 className="h-2">آخرین رویدادها</h2>
            {summary.recentEvents.length === 0 ? (
              <p style={{ color: "var(--fg-mute)", marginTop: 12 }}>
                هنوز هیچ رویدادی ثبت نشده است. برای شروع، در یک کلاس شرکت کنید یا
                آزمونی را ارسال کنید.
              </p>
            ) : (
              <ul
                className="mt-5"
                style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}
              >
                {summary.recentEvents.map((e: { id: string; type: string; occurredAt: string }) => (
                  <li
                    key={e.id}
                    className="rounded-lg flex items-center justify-between"
                    style={{
                      padding: "10px 14px",
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      fontSize: 13,
                    }}
                  >
                    <span>{EVENT_LABEL[e.type] || e.type}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                      {new Date(e.occurredAt).toLocaleString("fa-IR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {tenantSummary && (
            <section className="mt-12">
              <h2 className="h-2">داشبورد سازمان (مدیر)</h2>
              <div className="mt-5 flex gap-4 flex-wrap">
                <Stat label="کاربران فعال" value={toFa(String(tenantSummary.users))} />
                <Stat label="دوره‌ها" value={toFa(String(tenantSummary.courses))} />
                <Stat label="جلسات کلاس" value={toFa(String(tenantSummary.classSessions))} />
                <Stat label="ارسال‌ها" value={toFa(String(tenantSummary.submissions))} />
                <Stat
                  label="میانگین نمره کل"
                  value={
                    tenantSummary.averageGrade !== null
                      ? toFa(tenantSummary.averageGrade.toFixed(1))
                      : "—"
                  }
                />
                <Stat label="فراخوانی‌های AI" value={toFa(String(tenantSummary.aiInteractions))} />
              </div>
              {Object.keys(tenantSummary.eventsByType || {}).length > 0 && (
                <div
                  className="mt-7 rounded-2xl"
                  style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--line)" }}
                >
                  <strong>توزیع رویدادها</strong>
                  <ul
                    className="mt-3"
                    style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {Object.entries(tenantSummary.eventsByType as Record<string, number>)
                      .sort((a, b) => b[1] - a[1])
                      .map(([t, count]) => (
                        <li
                          key={t}
                          className="flex items-center justify-between"
                          style={{ fontSize: 13, paddingBlock: 6, borderBottom: "1px solid var(--line)" }}
                        >
                          <span>{EVENT_LABEL[t] || t}</span>
                          <span className="mono">{toFa(String(count))}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
};

export default ProgressPage;
