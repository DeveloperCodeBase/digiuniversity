// =====================================================
// Course detail (live) — /api/v1/courses/:id, with nested modules + lessons.
// =====================================================

import React from "react";
import { Icon } from "../icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { catalogApi, enrollmentsApi } from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { toFa } from "../shared.jsx";

const SignInPrompt = ({ go }) => (
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
      <button className="btn btn-primary mt-7" onClick={() => go("login")}>
        ورود به حساب
        <Icon name="arrow" size={14} />
      </button>
    </div>
  </main>
);

const CourseLivePage = ({ go, courseId }) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [course, setCourse] = React.useState(null);
  const [enrolled, setEnrolled] = React.useState(false);
  const [enrolling, setEnrolling] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated || !courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      catalogApi.getCourse(courseId),
      enrollmentsApi.listMine().catch(() => []),
    ])
      .then(([c, mine]) => {
        if (cancelled) return;
        setCourse(c);
        setEnrolled(
          mine.some((e) => e.courseId === courseId && e.status === "active"),
        );
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
  }, [isAuthenticated, courseId]);

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
      const msg = err instanceof ApiError ? err.displayMessage : err.message;
      window.toast?.({ title: "ثبت‌نام ناموفق", msg, kind: "warn" });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <main data-screen-label="درس زنده" className="shell" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <button
        className="btn btn-outline"
        style={{ marginBottom: 28 }}
        onClick={() => go("catalog")}
      >
        <Icon name="arrow" size={14} style={{ transform: "scaleX(-1)" }} />
        بازگشت به کاتالوگ
      </button>

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

          <div className="mt-7">
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
              <button
                className="btn btn-primary"
                disabled={enrolling}
                onClick={enrol}
              >
                {enrolling ? "در حال ثبت‌نام..." : "ثبت‌نام در این درس"}
              </button>
            )}
          </div>

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
