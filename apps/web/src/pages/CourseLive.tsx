// Phase-A R2.7 — typed.
// =====================================================
// Course detail (live) — /api/v1/courses/:id, with nested modules + lessons.
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../ui";
import {
  assessmentsApi,
  catalogApi,
  classSessionsApi,
  enrollmentsApi,
} from "../api/endpoints.js";
import { errorMessage } from "../lib/errorMessage";
import { toFa } from "../shared";
import { formatJalaliDate } from "../i18n/format.js";
import type { Go } from "../router";

interface SignInPromptProps { go: Go }
const SignInPrompt: React.FC<SignInPromptProps> = ({ go }) => (
  <main data-screen-label="درس" className="shell" style={{ paddingTop: 80, paddingBottom: 80 }}>
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
      <h2 className="h-2 mt-4">برای دیدن این درس وارد شوید</h2>
      <Button variant="primary" className="mt-7" onClick={() => go("login")}>
        ورود به حساب
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </main>
);

interface MineEnrollment {
  courseId: string | null;
  status: string;
}
interface AiConcept {
  name: string;
  level?: string;
}
interface AiEnvelope {
  model?: string;
  provider?: string;
  mode?: string;
  confidence: number;
  human_review_required?: boolean;
  request_id?: string;
  payload?: {
    summary?: string;
    concepts?: AiConcept[];
  };
}
interface Lesson {
  id: string;
  title: string;
  durationMinutes?: number | null;
}
interface CourseModule {
  id: string;
  title: string;
  description?: string | null;
  lessons?: Lesson[];
}
interface CourseDetail {
  id?: string;
  code: string;
  title: string;
  description?: string | null;
  credits: number;
  language?: string | null;
  level?: string | null;
  modules?: CourseModule[];
}

interface CourseLivePageProps { go: Go; courseId?: string }

const CourseLivePage: React.FC<CourseLivePageProps> = ({ go, courseId }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [course, setCourse] = React.useState<CourseDetail | null>(null);
  const [enrolled, setEnrolled] = React.useState<boolean>(false);
  const [enrolling, setEnrolling] = React.useState<boolean>(false);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [joiningId, setJoiningId] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState<string | null>(null);
  const [analysisBySession, setAnalysisBySession] = React.useState<Record<string, AiEnvelope>>({});
  const [assessments, setAssessments] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!isAuthenticated || !courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      catalogApi.getCourse(courseId),
      enrollmentsApi.listMine().catch(() => []),
      classSessionsApi.list({ courseId }).catch(() => []),
      assessmentsApi.list({ courseId }).catch(() => []),
    ])
      .then(([c, mine, sess, ass]) => {
        if (cancelled) return;
        setCourse(c);
        setEnrolled(
          mine.some((e: MineEnrollment) => e.courseId === courseId && e.status === "active"),
        );
        setSessions(sess);
        setAssessments(ass);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, courseId]);

  const handleJoin = async (sessionId: string) => {
    setJoiningId(sessionId);
    try {
      const res = await classSessionsApi.join(sessionId);
      window.toast?.({
        title: "ورود به کلاس",
        msg: "حضور شما ثبت شد.",
        kind: "success",
      });
      // Open the provider join URL in a new tab — the mock provider
      // returns a deep link back into the SPA so this works locally too.
      if (res.joinUrl) window.open(res.joinUrl, "_blank", "noopener");
    } catch (err) {
      const msg = errorMessage(err);
      window.toast?.({ title: "ورود ناموفق", msg, kind: "warn" });
    } finally {
      setJoiningId(null);
    }
  };

  const handleAnalyze = async (sessionId: string, task = "analyze") => {
    setAnalyzing(sessionId);
    try {
      const envelope = await classSessionsApi.analyze(sessionId, { task });
      setAnalysisBySession((prev) => ({ ...prev, [sessionId]: envelope }));
      window.toast?.({
        title: "تحلیل AI آماده شد",
        msg: `اعتماد: ${envelope.confidence.toFixed(2)}`,
        kind: envelope.human_review_required ? "info" : "success",
      });
    } catch (err) {
      const msg = errorMessage(err);
      window.toast?.({ title: "تحلیل ناموفق", msg, kind: "warn" });
    } finally {
      setAnalyzing(null);
    }
  };

  if (!isAuthenticated) return <SignInPrompt go={go} />;

  const enrol = async () => {
    setEnrolling(true);
    try {
      await enrollmentsApi.enrol({ courseId });
      setEnrolled(true);
      window.toast?.({
        title: "ثبت‌نام انجام شد",
        msg: course?.title || "",
        kind: "success",
      });
    } catch (err) {
      const msg = errorMessage(err);
      window.toast?.({ title: "ثبت‌نام ناموفق", msg, kind: "warn" });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <main data-screen-label="درس زنده" className="shell" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <Button variant="outline" style={{ marginBottom: 28 }}
        onClick={() => go("catalog")}
      >
        <span style={{ display: "inline-flex", transform: "scaleX(-1)" }}>
          <Icon name="arrow" size={14} />
        </span>
        بازگشت به کاتالوگ
      </Button>

      {loading && (
        <p style={{ color: "var(--fg-mute)" }}>در حال بارگذاری از API...</p>
      )}
      {error && (
        <div
          className="rounded-lg"
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

      {course && (
        <article>
          <span className="eyebrow">{course.code}</span>
          <h1 className="h-1 mt-3">{course.title}</h1>
          {course.description && (
            <p style={{ color: "var(--fg-mute)", marginTop: 12, maxWidth: 720, lineHeight: 1.8 }}>
              {course.description}
            </p>
          )}
          <div className="flex gap-2 flex-wrap mt-5">
            <span className="pill" style={{ fontSize: 11 }}>{toFa(String(course.credits))} واحد</span>
            <span className="pill" style={{ fontSize: 11 }}>{course.language?.toUpperCase()}</span>
            {course.level && <span className="pill" style={{ fontSize: 11 }}>{course.level}</span>}
          </div>

          <div className="mt-7 flex gap-3 flex-wrap items-center">
            <Button variant="outline" onClick={() => go("tutor")}>
              <Icon name="sparkle" size={14} />
              پرسش از دستیار AI
            </Button>
            {enrolled ? (
              <div
                className="rounded-lg"
                style={{
                  padding: "10px 16px",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name="check" size={14} />
                در این درس ثبت‌نام کرده‌اید
              </div>
            ) : (
              <Button variant="primary" disabled={enrolling}
                onClick={enrol}
              >
                {enrolling ? "در حال ثبت‌نام..." : "ثبت‌نام در این درس"}
              </Button>
            )}
          </div>

          <section className="mt-12">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <h2 className="h-2">جلسات زنده</h2>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                {toFa(String(sessions.length))} جلسه
              </span>
            </div>
            {sessions.length === 0 ? (
              <p style={{ color: "var(--fg-mute)", marginTop: 12 }}>
                هنوز جلسه‌ای برای این درس برنامه‌ریزی نشده است.
              </p>
            ) : (
              <ul className="mt-5" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                {sessions.map((s) => {
                  const envelope = analysisBySession[s.id];
                  const isJoining = joiningId === s.id;
                  const isAnalyzing = analyzing === s.id;
                  return (
                    <li
                      key={s.id}
                      className="rounded-2xl"
                      style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--line)" }}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}>
                            {new Date(s.scheduledStart).toLocaleString("fa-IR")} → {new Date(s.scheduledEnd).toLocaleTimeString("fa-IR")}
                          </div>
                          <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 6 }}>{s.title}</h3>
                          {s.host && (
                            <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>
                              میزبان: {s.host.fullName || s.host.email}
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap mt-3">
                            <span className="pill" style={{ fontSize: 11 }}>{s.status}</span>
                            <span className="pill" style={{ fontSize: 11 }}>{s.joinPolicy}</span>
                            <span className="pill" style={{ fontSize: 11 }}>{s.provider}</span>
                            {s.recording?.status && s.recording.status !== "none" && (
                              <span className="pill pill-cyan" style={{ fontSize: 11 }}>
                                ضبط: {s.recording.status}
                              </span>
                            )}
                            <span className="pill" style={{ fontSize: 11 }}>
                              {toFa(String(s._count?.attendance ?? 0))} حضور
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="primary" disabled={isJoining}
                            onClick={() => handleJoin(s.id)}
                          >
                            {isJoining ? "..." : "ورود به کلاس"}
                          </Button>
                          {hasRole("admin", "instructor") && (
                            <Button variant="outline" disabled={isAnalyzing}
                              onClick={() => handleAnalyze(s.id, "analyze")}
                            >
                              {isAnalyzing ? "در حال تحلیل..." : "تحلیل AI"}
                            </Button>
                          )}
                        </div>
                      </div>
                      {envelope && (
                        <div
                          className="mt-4 rounded-xl"
                          style={{
                            padding: 16,
                            background: "color-mix(in oklch, var(--accent) 8%, var(--surface))",
                            border: "1px solid var(--accent)",
                          }}
                        >
                          <div className="flex items-baseline justify-between flex-wrap gap-2">
                            <strong style={{ color: "var(--accent)" }}>تحلیل AI</strong>
                            <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                              {envelope.model} · {envelope.provider} · {envelope.mode}
                            </span>
                          </div>
                          <div className="mt-3 flex gap-3 flex-wrap" style={{ fontSize: 12 }}>
                            <span>اعتماد: <strong>{envelope.confidence.toFixed(2)}</strong></span>
                            {envelope.human_review_required && (
                              <span style={{ color: "var(--warn)" }}>
                                نیاز به بازبینی انسانی
                              </span>
                            )}
                            <span className="mono" style={{ color: "var(--fg-mute)" }}>
                              {envelope.request_id}
                            </span>
                          </div>
                          {envelope.payload?.summary && (
                            <p style={{ marginTop: 12, lineHeight: 1.8 }}>{envelope.payload?.summary}</p>
                          )}
                          {(envelope.payload?.concepts?.length ?? 0) > 0 && (
                            <div className="mt-3 flex gap-2 flex-wrap">
                              {envelope.payload?.concepts?.map((c, i) => (
                                <span key={i} className="pill" style={{ fontSize: 11 }}>
                                  {c.name}{c.level ? ` · ${c.level}` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-12">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <h2 className="h-2">آزمون‌ها و تکالیف</h2>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
                {toFa(String(assessments.length))} مورد
              </span>
            </div>
            {assessments.length === 0 ? (
              <p style={{ color: "var(--fg-mute)", marginTop: 12 }}>
                هنوز آزمون یا تکلیفی برای این درس منتشر نشده است.
              </p>
            ) : (
              <ul
                className="mt-5"
                style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}
              >
                {assessments.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-2xl flex items-center justify-between flex-wrap gap-3"
                    style={{
                      padding: "16px 20px",
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="pill"
                          style={{
                            fontSize: 11,
                            background:
                              a.kind === "quiz"
                                ? "color-mix(in oklch, var(--cyan) 16%, var(--bg))"
                                : "color-mix(in oklch, var(--amber) 16%, var(--bg))",
                            color: a.kind === "quiz" ? "var(--cyan)" : "var(--amber)",
                          }}
                        >
                          {a.kind === "quiz" ? "آزمون" : "تکلیف"}
                        </span>
                        <strong style={{ fontSize: 15 }}>{a.title}</strong>
                      </div>
                      <div
                        className="flex gap-3 flex-wrap mt-2"
                        style={{ fontSize: 12, color: "var(--fg-mute)" }}
                      >
                        <span>{toFa(String(a.totalPoints))} نمره</span>
                        <span>{toFa(String(a._count?.questions ?? 0))} سوال</span>
                        <span>{toFa(String(a._count?.submissions ?? 0))} ارسال</span>
                        {a.dueAt && (
                          <span>موعد: {formatJalaliDate(a.dueAt)}</span>
                        )}
                        <span className="pill" style={{ fontSize: 11 }}>{a.status}</span>
                      </div>
                    </div>
                    <Button variant="primary" onClick={() => go("assessment-live", a.id)}
                    >
                      {a.kind === "quiz" ? "شروع آزمون" : "مشاهده تکلیف"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-12">
            <h2 className="h-2">سرفصل‌ها</h2>
            {(!course.modules || course.modules.length === 0) ? (
              <p style={{ color: "var(--fg-mute)", marginTop: 12 }}>
                هنوز فصلی برای این درس تعریف نشده است.
              </p>
            ) : (
              <ol className="mt-5" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                {course.modules.map((m, mi) => (
                  <li
                    key={m.id}
                    className="rounded-2xl"
                    style={{
                      padding: 20,
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}
                      >
                        فصل {toFa(String(mi + 1))}
                      </span>
                      <h3 style={{ fontSize: 17, fontWeight: 600 }}>{m.title}</h3>
                    </div>
                    {m.description && (
                      <p style={{ color: "var(--fg-mute)", marginTop: 8, fontSize: 14 }}>{m.description}</p>
                    )}
                    {m.lessons && m.lessons.length > 0 && (
                      <ul style={{ marginTop: 12, listStyle: "none", padding: 0 }}>
                        {m.lessons.map((l, li) => (
                          <li
                            key={l.id}
                            className="flex items-center justify-between"
                            style={{
                              padding: "10px 0",
                              borderTop: li === 0 ? "1px solid var(--line)" : undefined,
                              borderBottom: "1px solid var(--line)",
                              fontSize: 14,
                            }}
                          >
                            <span>
                              <span
                                className="mono"
                                style={{ fontSize: 11, color: "var(--fg-mute)", marginLeft: 10 }}
                              >
                                {toFa(String(li + 1))}.
                              </span>
                              {l.title}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>
                              {l.durationMinutes
                                ? toFa(String(l.durationMinutes)) + " دقیقه"
                                : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </article>
      )}
    </main>
  );
};

export default CourseLivePage;
