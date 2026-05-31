// Phase-A R2.6 — typed.
// =====================================================
// Live catalog page — talks to /api/v1/faculties + /programs + /courses.
//
// This is the live-data sibling of the mock-driven `Programs.jsx`. The
// existing #programs route still serves the rich marketing layout from
// data.js; this new #catalog route is the integration surface.
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useAuth } from "../auth/AuthContext";
import { catalogApi, enrollmentsApi } from "../api/endpoints.js";
import { errorMessage } from "../lib/errorMessage";
import { toFa } from "../shared";
import { Button } from "../ui";
import type { Go } from "../router";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "مقدماتی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

const DEGREE_LABEL: Record<string, string> = {
  bachelor: "کارشناسی",
  master: "ارشد",
  phd: "دکتری",
  certificate: "گواهی",
};

const SignInPrompt = ({ go }: { go: Go }) => (
  <main data-screen-label="کاتالوگ" className="shell" style={{ paddingTop: 80, paddingBottom: 80 }}>
    <div className="rounded-2xl"
         style={{ padding: "40px", background: "var(--surface)", border: "1px solid var(--line)", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <Icon name="lock" size={28} />
      <h2 className="h-2 mt-4">برای دیدن کاتالوگ زنده وارد شوید</h2>
      <p className="mt-3" style={{ color: "var(--fg-mute)" }}>
        این صفحه داده‌ها را از API واقعی می‌خواند. برای آزمایش با حساب نمونه
        از <code style={{ direction: "ltr" }}>admin@digiuniversity.ir</code> با
        رمز پیش‌فرض استفاده کنید.
      </p>
      <Button variant="primary" className="mt-7" onClick={() => go("login")}>
        ورود به حساب
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </main>
);

interface CatalogFaculty {
  id: string;
  name?: string;
}
interface CatalogProgram {
  id: string;
  name: string;
  degreeLevel?: string;
}
interface CatalogCourse {
  id: string;
  programId: string;
  code: string;
  title: string;
  description?: string | null;
  level?: string | null;
  credits: number;
  _count?: { modules?: number } | null;
}
interface MineEnrollment {
  status: string;
  courseId: string | null;
}

interface CatalogPageProps { go: Go }

const CatalogPage: React.FC<CatalogPageProps> = ({ go }) => {
  const { isAuthenticated, user } = useAuth();

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [faculties, setFaculties] = React.useState<CatalogFaculty[]>([]);
  const [programs, setPrograms] = React.useState<CatalogProgram[]>([]);
  const [courses, setCourses] = React.useState<CatalogCourse[]>([]);
  const [myCourseIds, setMyCourseIds] = React.useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = React.useState<string | null>(null);

  const refreshEnrollments = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const mine = await enrollmentsApi.listMine();
      setMyCourseIds(
        new Set(
          mine
            .filter((e: MineEnrollment) => e.status === "active")
            .map((e: MineEnrollment) => e.courseId)
            .filter((id: string | null): id is string => Boolean(id)),
        ),
      );
    } catch {
      // Non-fatal: catalog still renders without enrolment overlay.
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      catalogApi.listFaculties(),
      catalogApi.listPrograms(),
      catalogApi.listCourses(),
    ])
      .then(([f, p, c]) => {
        if (cancelled) return;
        setFaculties(f);
        setPrograms(p);
        setCourses(c);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    refreshEnrollments();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshEnrollments]);

  if (!isAuthenticated || !user) return <SignInPrompt go={go} />;

  const programById = React.useMemo<Record<string, CatalogProgram>>(
    () => Object.fromEntries(programs.map((p): [string, CatalogProgram] => [p.id, p])),
    [programs],
  );

  const handleEnrol = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await enrollmentsApi.enrol({ courseId });
      window.toast?.({
        title: "ثبت‌نام انجام شد",
        msg: "این درس به فهرست شما اضافه شد.",
        kind: "success",
      });
      await refreshEnrollments();
    } catch (err) {
      const msg = errorMessage(err);
      window.toast?.({ title: "ثبت‌نام ناموفق", msg, kind: "warn" });
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <main data-screen-label="کاتالوگ زنده" className="shell" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="eyebrow">LIVE CATALOG · داده‌های واقعی</span>
          <h1 className="h-1 mt-3">کاتالوگ آموزشی</h1>
          <p style={{ color: "var(--fg-mute)", marginTop: 12, maxWidth: 600 }}>
            این فهرست از سرویس <code style={{ direction: "ltr" }}>/api/v1/courses</code>
            مستقیماً خوانده می‌شود. ثبت‌نام، تغییر وضعیت و فهرست «دوره‌های من»
            همگی به API متصل هستند.
          </p>
        </div>
        <div className="flex items-center gap-3" style={{ fontSize: 13, color: "var(--fg-mute)" }}>
          <span>
            وارد شده به عنوان{" "}
            <strong style={{ color: "var(--fg)" }}>{user.email}</strong>
          </span>
          <span className="pill pill-cyan" style={{ fontSize: 11 }}>
            {user.roles.join(" · ") || "بدون نقش"}
          </span>
        </div>
      </header>

      {loading && (
        <div className="mt-9" style={{ color: "var(--fg-mute)" }}>
          در حال بارگذاری از API...
        </div>
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
          {/* Stats strip */}
          <section
            className="mt-9 rounded-2xl"
            style={{ padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            <div className="flex gap-12 flex-wrap">
              <Stat label="دانشکده‌ها" value={toFa(String(faculties.length))} />
              <Stat label="برنامه‌های تحصیلی" value={toFa(String(programs.length))} />
              <Stat label="دروس" value={toFa(String(courses.length))} />
              <Stat label="ثبت‌نام‌های فعال شما" value={toFa(String(myCourseIds.size))} />
            </div>
          </section>

          {/* Course grid */}
          <section className="mt-9">
            <h2 className="h-2">دروس فعال</h2>
            {courses.length === 0 ? (
              <p style={{ color: "var(--fg-mute)", marginTop: 16 }}>
                هنوز درسی برای این سازمان تعریف نشده است.
              </p>
            ) : (
              <div
                className="mt-6"
                style={{
                  display: "grid",
                  gap: 20,
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                }}
              >
                {courses.map((c) => {
                  const program = programById[c.programId];
                  const enrolled = myCourseIds.has(c.id);
                  return (
                    <article
                      key={c.id}
                      className="rounded-2xl"
                      style={{
                        padding: "22px",
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        minHeight: 220,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className="mono"
                            style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}
                          >
                            {c.code}
                            {program ? " · " + program.name : ""}
                          </div>
                          <h3 className="mt-2" style={{ fontSize: 18, fontWeight: 600 }}>
                            {c.title}
                          </h3>
                        </div>
                        {enrolled && (
                          <span className="pill pill-cyan" style={{ fontSize: 11 }}>
                            ثبت‌نام شده
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p style={{ color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7 }}>
                          {c.description}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap" style={{ marginTop: "auto" }}>
                        {c.level && <span className="pill" style={{ fontSize: 11 }}>{LEVEL_LABEL[c.level] || c.level}</span>}
                        {program?.degreeLevel && (
                          <span className="pill" style={{ fontSize: 11 }}>
                            {DEGREE_LABEL[program.degreeLevel] || program.degreeLevel}
                          </span>
                        )}
                        <span className="pill" style={{ fontSize: 11 }}>{toFa(String(c.credits))} واحد</span>
                        <span className="pill" style={{ fontSize: 11 }}>
                          {toFa(String(c._count?.modules ?? 0))} فصل
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 justify-center" onClick={() => go("course-live", c.id)}
                        >
                          مشاهده فصل‌ها
                        </Button>
                        {enrolled ? (
                          <button
                            className="btn flex-1 justify-center"
                            onClick={() => go("my-courses")}
                            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                          >
                            رفتن به دوره‌های من
                          </button>
                        ) : (
                          <Button variant="primary" className="flex-1 justify-center" disabled={enrolling === c.id}
                            onClick={() => handleEnrol(c.id)}
                          >
                            {enrolling === c.id ? "در حال ثبت‌نام..." : "ثبت‌نام"}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.1em" }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
  </div>
);

export default CatalogPage;
