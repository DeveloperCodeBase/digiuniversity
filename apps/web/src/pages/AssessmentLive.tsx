// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Live assessment runner.
//
// Loads /api/v1/assessments/:id (with questions; correctAnswer is
// redacted server-side for students) and the student's prior
// submission. Quiz answers are kept in component state, draft-saved on
// blur (POST /submissions with finalize:false), and finalised on
// submit. After finalising, the auto-graded result is shown inline.
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useAuth } from "../auth/AuthContext";
import { assessmentsApi, submissionsApi } from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { toFa } from "../shared";
import { formatJalaliDate } from "../i18n/format.js";

const STATUS_LABEL = {
  draft: "پیش‌نویس",
  submitted: "ارسال‌شده",
  graded: "نمره‌گذاری‌شده",
};

const SignInPrompt = ({ go }) => (
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
      <h2 className="h-2 mt-4">برای پاسخ به آزمون وارد شوید</h2>
      <button className="btn btn-primary mt-7" onClick={() => go("login")}>
        ورود به حساب
        <Icon name="arrow" size={14} />
      </button>
    </div>
  </main>
);

const AssessmentLivePage = ({ go, assessmentId }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [assessment, setAssessment] = React.useState(null);
  const [submission, setSubmission] = React.useState(null);
  const [answers, setAnswers] = React.useState({});
  const [pending, setPending] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [aiDraft, setAiDraft] = React.useState(null);
  const [aiPending, setAiPending] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated || !assessmentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      assessmentsApi.get(assessmentId),
      submissionsApi.getMine(assessmentId).catch(() => null),
    ])
      .then(([a, s]) => {
        if (cancelled) return;
        setAssessment(a);
        setSubmission(s);
        if (s?.answers && typeof s.answers === "object") {
          setAnswers(s.answers);
        }
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
  }, [isAuthenticated, assessmentId]);

  if (!isAuthenticated) return <SignInPrompt go={go} />;

  const isFinal =
    submission && (submission.status === "submitted" || submission.status === "graded");

  const setMcAnswer = (questionId, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selectedIndex } }));
  };
  const setTextAnswer = (questionId, text) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { text } }));
  };

  const saveDraft = async () => {
    if (!assessment || isFinal) return;
    setSavingDraft(true);
    try {
      const saved = await submissionsApi.submit({
        assessmentId: assessment.id,
        answers,
        finalize: false,
      });
      setSubmission(saved);
    } catch (err) {
      const msg = err instanceof ApiError ? err.displayMessage : err.message;
      window.toast?.({ title: "ذخیره ناموفق", msg, kind: "warn" });
    } finally {
      setSavingDraft(false);
    }
  };

  const finalize = async () => {
    if (!assessment) return;
    if (!window.confirm("ارسال نهایی — پس از این قابل تغییر نیست. ادامه؟")) return;
    setPending(true);
    try {
      const saved = await submissionsApi.submit({
        assessmentId: assessment.id,
        answers,
        finalize: true,
      });
      setSubmission(saved);
      window.toast?.({
        title: "ارسال شد",
        msg:
          typeof saved.grade === "number"
            ? `نمره: ${toFa(saved.grade.toFixed(0))} از ۱۰۰`
            : "نتایج پس از بازبینی منتشر می‌شود.",
        kind: "success",
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.displayMessage : err.message;
      window.toast?.({ title: "ارسال ناموفق", msg, kind: "warn" });
    } finally {
      setPending(false);
    }
  };

  const requestAiDraft = async () => {
    if (!submission) return;
    setAiPending(true);
    try {
      const env = await submissionsApi.aiGradeDraft(submission.id);
      setAiDraft(env);
    } catch (err) {
      const msg = err instanceof ApiError ? err.displayMessage : err.message;
      window.toast?.({ title: "تحلیل ناموفق", msg, kind: "warn" });
    } finally {
      setAiPending(false);
    }
  };

  return (
    <main className="shell" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <button className="btn btn-outline" onClick={() => go("catalog")} style={{ marginBottom: 28 }}>
        <Icon name="arrow" size={14} style={{ transform: "scaleX(-1)" }} />
        بازگشت به کاتالوگ
      </button>

      {loading && <p style={{ color: "var(--fg-mute)" }}>در حال بارگذاری...</p>}
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

      {assessment && (
        <>
          <header>
            <span className="eyebrow">{assessment.kind === "quiz" ? "QUIZ" : "ASSIGNMENT"}</span>
            <h1 className="h-1 mt-3">{assessment.title}</h1>
            {assessment.description && (
              <p style={{ color: "var(--fg-mute)", marginTop: 12, maxWidth: 720, lineHeight: 1.8 }}>
                {assessment.description}
              </p>
            )}
            <div className="flex gap-2 flex-wrap mt-5">
              <span className="pill" style={{ fontSize: 11 }}>{assessment.status}</span>
              <span className="pill" style={{ fontSize: 11 }}>
                {toFa(String(assessment.totalPoints))} نمره
              </span>
              {assessment.dueAt && (
                <span className="pill" style={{ fontSize: 11 }}>
                  موعد: {formatJalaliDate(assessment.dueAt)}
                </span>
              )}
              {submission && (
                <span className="pill pill-cyan" style={{ fontSize: 11 }}>
                  {STATUS_LABEL[submission.status] || submission.status}
                </span>
              )}
            </div>
          </header>

          {submission?.status === "graded" && typeof submission.grade === "number" && (
            <div
              className="mt-7 rounded-2xl"
              style={{
                padding: 24,
                background: "color-mix(in oklch, var(--accent) 10%, var(--surface))",
                border: "1px solid var(--accent)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>نمره نهایی</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>
                {toFa(String(Math.round(submission.grade)))} <span style={{ fontSize: 18, color: "var(--fg-mute)" }}>/ ۱۰۰</span>
              </div>
              {submission.feedback && (
                <p style={{ marginTop: 12, lineHeight: 1.8 }}>{submission.feedback}</p>
              )}
            </div>
          )}

          {assessment.questions && assessment.questions.length > 0 ? (
            <ol className="mt-9" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {assessment.questions.map((q, i) => {
                const a = answers[q.id] || {};
                return (
                  <li
                    key={q.id}
                    className="rounded-2xl"
                    style={{
                      padding: 20,
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}>
                        سوال {toFa(String(i + 1))} · {toFa(String(q.points))} نمره
                      </span>
                    </div>
                    <p style={{ marginTop: 6, fontSize: 16, lineHeight: 1.8 }}>{q.prompt}</p>

                    {q.kind === "multiple_choice" && Array.isArray(q.options) && (
                      <div className="mt-4" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {q.options.map((opt, idx) => (
                          <label
                            key={idx}
                            className="rounded-lg assessment-option"
                            style={{
                              padding: "12px 14px",
                              border: "1px solid " + (a.selectedIndex === idx ? "var(--accent)" : "var(--line)"),
                              background: a.selectedIndex === idx ? "var(--accent-soft)" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              cursor: isFinal ? "default" : "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name={"q_" + q.id}
                              disabled={isFinal}
                              checked={a.selectedIndex === idx}
                              onChange={() => setMcAnswer(q.id, idx)}
                              style={{ accentColor: "var(--accent)" }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {(q.kind === "short_answer" || q.kind === "essay") && (
                      <textarea
                        rows={q.kind === "essay" ? 8 : 2}
                        disabled={isFinal}
                        value={a.text || ""}
                        onChange={(e) => setTextAnswer(q.id, e.target.value)}
                        placeholder="پاسخ خود را اینجا بنویسید..."
                        className="mt-3"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--line)",
                          borderRadius: 8,
                          color: "var(--fg)",
                          fontFamily: "inherit",
                          fontSize: 14,
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-9" style={{ color: "var(--fg-mute)" }}>
              این آزمون هنوز سوالی ندارد.
            </p>
          )}

          {!isFinal && assessment.questions && assessment.questions.length > 0 && (
            <div className="mt-9 flex gap-3 flex-wrap">
              <button
                className="btn btn-outline"
                onClick={saveDraft}
                disabled={savingDraft || pending}
              >
                {savingDraft ? "..." : "ذخیره پیش‌نویس"}
              </button>
              <button
                className="btn btn-primary"
                onClick={finalize}
                disabled={pending || savingDraft}
              >
                {pending ? "در حال ارسال..." : "ارسال نهایی"}
              </button>
            </div>
          )}

          {/* Staff-only: AI grade draft */}
          {isFinal && submission && hasRole("admin", "instructor") && (
            <section
              className="mt-12 rounded-2xl"
              style={{ padding: 22, background: "var(--surface)", border: "1px solid var(--line)" }}
            >
              <div className="flex items-end justify-between flex-wrap gap-2">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>پیش‌نویس نمره‌دهی AI</h3>
                  <p style={{ color: "var(--fg-mute)", fontSize: 13, marginTop: 4 }}>
                    این فقط یک پیشنهاد است — نمره نهایی نیاز به تأیید استاد دارد.
                  </p>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={requestAiDraft}
                  disabled={aiPending}
                >
                  {aiPending ? "..." : "درخواست پیش‌نویس"}
                </button>
              </div>
              {aiDraft && (
                <div className="mt-4">
                  <div className="flex gap-3 flex-wrap" style={{ fontSize: 12 }}>
                    <span>اعتماد: <strong>{aiDraft.confidence.toFixed(2)}</strong></span>
                    <span style={{ color: "var(--warn)" }}>نیاز به بازبینی انسانی</span>
                    <span className="mono" style={{ color: "var(--fg-mute)" }}>{aiDraft.request_id}</span>
                  </div>
                  <div className="mt-3" style={{ fontSize: 18 }}>
                    نمره پیشنهادی:{" "}
                    <strong style={{ color: "var(--accent)" }}>
                      {toFa(String(aiDraft.payload?.suggested_grade ?? "—"))}
                    </strong>
                    <span style={{ color: "var(--fg-mute)", fontSize: 14 }}> / ۱۰۰</span>
                  </div>
                  {aiDraft.payload?.feedback && (
                    <p style={{ marginTop: 12, lineHeight: 1.8 }}>{aiDraft.payload.feedback}</p>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
};

export default AssessmentLivePage;
