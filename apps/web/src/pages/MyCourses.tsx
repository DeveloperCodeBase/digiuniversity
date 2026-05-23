// Phase-A R2.5 — typed.
// =====================================================
// "My courses" — live view of the current user's enrollments.
//
// Reads /api/v1/enrollments/me; supports withdrawing and (for instructors
// looking at their own enrolment as a student in a co-taught course)
// marking complete via PATCH /enrollments/:id/status.
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useAuth } from "../auth/AuthContext";
import { enrollmentsApi } from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { toFa } from "../shared";
import { formatJalaliDate } from "../i18n/format.js";
import { Button } from "../ui";
import type { Go } from "../router";

type EnrollmentStatus = "active" | "completed" | "dropped" | "withdrawn";

interface Enrollment {
  id: string;
  status: EnrollmentStatus | string;
  courseId?: string;
  enrolledAt?: string;
  cohort?: { name?: string };
  course?: { code?: string; title?: string };
}

const STATUS_LABEL: Record<string, string> = {
  active: "فعال",
  completed: "اتمام‌یافته",
  dropped: "حذف‌شده",
  withdrawn: "انصراف",
};

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  active: { bg: "color-mix(in oklch, var(--accent) 16%, var(--bg))", fg: "var(--accent)" },
  completed: { bg: "color-mix(in oklch, var(--cyan) 16%, var(--bg))", fg: "var(--cyan)" },
  dropped: { bg: "color-mix(in oklch, var(--warn) 14%, var(--bg))", fg: "var(--warn)" },
  withdrawn: { bg: "color-mix(in oklch, var(--warn) 14%, var(--bg))", fg: "var(--warn)" },
};

interface SignInPromptProps { go: Go }
const SignInPrompt: React.FC<SignInPromptProps> = ({ go }) => (
  <main data-screen-label="دوره‌های من" className="shell" style={{ paddingTop: 80, paddingBottom: 80 }}>
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
      <h2 className="h-2 mt-4">برای دیدن دوره‌های خود وارد شوید</h2>
      <Button variant="primary" className="mt-7" onClick={() => go("login")}>
        ورود به حساب
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </main>
);

interface MyCoursesPageProps { go: Go }

const MyCoursesPage: React.FC<MyCoursesPageProps> = ({ go }) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Enrollment[]>([]);
  const [actingOn, setActingOn] = React.useState<string | null>(null);

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const mine = (await enrollmentsApi.listMine()) as Enrollment[];
      setItems(mine);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? (err as { displayMessage?: string }).displayMessage ?? "خطای ناشناخته"
          : err instanceof Error
            ? err.message
            : "خطای ناشناخته";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) return <SignInPrompt go={go} />;

  const withdraw = async (id: string): Promise<void> => {
    setActingOn(id);
    try {
      await enrollmentsApi.setStatus(id, "withdrawn");
      window.toast?.({ title: "انصراف ثبت شد", msg: "", kind: "info" });
      await load();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? (err as { displayMessage?: string }).displayMessage ?? "خطای ناشناخته"
          : err instanceof Error
            ? err.message
            : "خطای ناشناخته";
      window.toast?.({ title: "خطا", msg, kind: "warn" });
    } finally {
      setActingOn(null);
    }
  };

  const active = items.filter((e) => e.status === "active");
  const completed = items.filter((e) => e.status === "completed");
  const inactive = items.filter((e) => e.status === "dropped" || e.status === "withdrawn");

  return (
    <main data-screen-label="دوره‌های من" className="shell" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <header>
        <span className="eyebrow">MY ENROLMENTS</span>
        <h1 className="h-1 mt-3">دوره‌های من</h1>
        <p style={{ color: "var(--fg-mute)", marginTop: 12, maxWidth: 600 }}>
          هر دوره‌ای که در آن ثبت‌نام کرده‌اید اینجا فهرست می‌شود. می‌توانید
          از یک دوره فعال انصراف دهید (وضعیت <code style={{ direction: "ltr" }}>withdrawn</code>).
        </p>
      </header>

      <section className="mt-7 flex gap-12 flex-wrap"
               style={{ padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16 }}>
        <Stat label="فعال" value={toFa(String(active.length))} />
        <Stat label="اتمام‌یافته" value={toFa(String(completed.length))} />
        <Stat label="غیرفعال" value={toFa(String(inactive.length))} />
      </section>

      {loading && (
        <p className="mt-9" style={{ color: "var(--fg-mute)" }}>در حال بارگذاری از API...</p>
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

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div
              className="mt-9 rounded-2xl"
              style={{
                padding: 32,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                textAlign: "center",
              }}
            >
              <p style={{ color: "var(--fg-mute)" }}>هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید.</p>
              <Button variant="primary" className="mt-5" onClick={() => go("catalog")}>
                مشاهده کاتالوگ
                <Icon name="arrow" size={14} />
              </Button>
            </div>
          ) : (
            <div
              className="mt-9"
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              }}
            >
              {items.map((e) => {
                const color = STATUS_COLOR[e.status] || STATUS_COLOR.active;
                return (
                  <article
                    key={e.id}
                    className="rounded-2xl"
                    style={{
                      padding: 22,
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div
                          className="mono"
                          style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}
                        >
                          {e.course?.code || "—"}
                        </div>
                        <h3 className="mt-2" style={{ fontSize: 17, fontWeight: 600 }}>
                          {e.course?.title || "(دوره حذف‌شده)"}
                        </h3>
                      </div>
                      <span
                        className="pill"
                        style={{
                          fontSize: 11,
                          background: color.bg,
                          color: color.fg,
                          border: "1px solid " + color.fg,
                        }}
                      >
                        {STATUS_LABEL[e.status] || e.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>
                      ثبت‌نام: {formatJalaliDate(e.enrolledAt)}
                      {e.cohort?.name ? " · گروه: " + e.cohort.name : ""}
                    </div>
                    <div className="flex gap-2" style={{ marginTop: "auto" }}>
                      <Button variant="outline" className="flex-1 justify-center" onClick={() => go("course-live", e.courseId)}
                      >
                        مشاهده درس
                      </Button>
                      {e.status === "active" && (
                        <button
                          className="btn flex-1 justify-center"
                          disabled={actingOn === e.id}
                          onClick={() => withdraw(e.id)}
                          style={{
                            background: "color-mix(in oklch, var(--warn) 14%, transparent)",
                            color: "var(--warn)",
                            border: "1px solid var(--warn)",
                          }}
                        >
                          {actingOn === e.id ? "..." : "انصراف"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
};

interface MyCoursesStatProps { label: React.ReactNode; value: React.ReactNode }
const Stat: React.FC<MyCoursesStatProps> = ({ label, value }) => (
  <div>
    <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.1em" }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
  </div>
);

export default MyCoursesPage;
