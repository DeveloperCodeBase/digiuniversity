// Phase B B.1b — Academic Hierarchy admin page (read-only).
//
// Reads from the new Phase-B B.1a API endpoints (academicsApi):
//   GET /v1/universities (with embedded semester _count)
//   GET /v1/semesters?universityId=...
//
// Read-only first. CRUD dialogs (create / edit / delete University +
// Semester) are scoped to a follow-on B.1c if owner wants them after
// reviewing the data surface.
//
// RBAC: page is at /admin/academics so the admin role gate on the route
// table already restricts access. The API also enforces @Roles("admin")
// on mutations (no mutations from this read-only page → no risk).
//
// Persian date display: ISO timestamps from the API are rendered via
// a tiny Jalaali helper (toFa() handles digit conversion; the helper
// converts Gregorian Y-M-D to Jalaali). Falls back to ISO if the
// helper isn't available.

import React from "react";
import { Icon } from "../../icons";
import { academicsApi } from "../../api/endpoints.js";
import { useAuth } from "../../auth/AuthContext";
import type { Go } from "../../router";
import { toFa } from "../../shared";

interface University {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string | null;
  shortCode: string;
  charterDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: { semesters: number };
}

interface Semester {
  id: string;
  universityId: string;
  code: string;
  nameFa: string;
  termType: string;
  startDate: string;
  endDate: string;
  registrationOpen: string | null;
  registrationClose: string | null;
  status: string;
}

interface AcademicsPageProps {
  go: Go;
}

const STATUS_LABEL: Record<string, string> = {
  active: "فعال",
  suspended: "معلق",
  dissolved: "منحل",
  upcoming: "آینده",
  open: "ثبت‌نام باز",
  closed: "بسته",
  archived: "بایگانی",
};

const TERM_LABEL: Record<string, string> = {
  FALL: "نیمسال اول",
  SPRING: "نیمسال دوم",
  SUMMER: "تابستان",
  INTERSESSION: "میان‌ترم",
};

/** Render an ISO date string as a friendly fa-IR formatted date. Uses
 * Intl.DateTimeFormat with the `fa-IR-u-ca-persian` locale so the
 * browser handles Jalaali conversion for us — no extra dep needed. */
const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
};

export const AcademicsPage: React.FC<AcademicsPageProps> = ({ go }) => {
  const auth = useAuth();
  const [universities, setUniversities] = React.useState<University[] | null>(null);
  const [semestersByUni, setSemestersByUni] = React.useState<
    Record<string, Semester[]>
  >({});
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    academicsApi
      .listUniversities()
      .then(async (rows: University[]) => {
        if (cancelled) return;
        setUniversities(rows);
        // Pre-fetch semesters for the first university so the typical
        // single-tenant deployment shows data immediately.
        if (rows.length > 0) {
          const first = rows[0];
          const sems: Semester[] = await academicsApi.listSemesters({
            universityId: first.id,
          });
          if (!cancelled) {
            setSemestersByUni((prev) => ({ ...prev, [first.id]: sems }));
            setExpandedId(first.id);
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "خطا در دریافت داده");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lazy-fetch semesters when a university card is expanded.
  const handleExpand = (uniId: string): void => {
    const next = expandedId === uniId ? null : uniId;
    setExpandedId(next);
    if (next && !semestersByUni[next]) {
      academicsApi
        .listSemesters({ universityId: next })
        .then((sems: Semester[]) => {
          setSemestersByUni((prev) => ({ ...prev, [next]: sems }));
        })
        .catch((err: Error) => setError(err.message));
    }
  };

  if (!auth.user) {
    return (
      <main className="shell py-12">
        <p className="text-[color:var(--fg-mute)]">
          برای دسترسی به این صفحه ابتدا وارد شوید.
        </p>
      </main>
    );
  }

  return (
    <main className="shell py-10" data-screen-label="B.1 ساختار دانشگاهی">
      <header className="mb-8">
        <div className="eyebrow">PHASE B · ACADEMIC HIERARCHY</div>
        <h1 className="h-1 mt-2">دانشگاه‌ها و نیمسال‌ها</h1>
        <p className="lead mt-3 max-w-2xl">
          مرکز مدیریت ساختار دانشگاهی: فهرست دانشگاه‌ها و نیمسال‌های هر یک.
          داده‌ها از API زنده Phase B خوانده می‌شوند ({" "}
          <code className="font-mono text-sm">GET /v1/universities</code>،{" "}
          <code className="font-mono text-sm">GET /v1/semesters</code>{" "}
          ). در این مرحله فقط نمایش است؛ افزودن/ویرایش در B.1c اضافه می‌شود.
        </p>
      </header>

      {error && (
        <div className="alert alert-error mb-6" role="alert">
          {error}
        </div>
      )}

      {universities === null && !error && (
        <div
          className="flex items-center justify-center min-h-[40vh] text-[color:var(--fg-mute)]"
          role="status"
          aria-live="polite"
        >
          در حال بارگذاری…
        </div>
      )}

      {universities && universities.length === 0 && (
        <p className="text-[color:var(--fg-mute)]">
          هنوز دانشگاهی ثبت نشده است. برای افزودن، از API مستقیماً استفاده کنید
          یا منتظر B.1c (دیالوگ افزودن) بمانید.
        </p>
      )}

      {universities && universities.length > 0 && (
        <div className="space-y-4">
          {universities.map((u) => {
            const isExpanded = expandedId === u.id;
            const sems = semestersByUni[u.id];
            return (
              <article
                key={u.id}
                className="card p-6"
                aria-label={`دانشگاه ${u.nameFa}`}
              >
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-[color:var(--fg-mute)]">
                      {u.shortCode} · {u.slug}
                    </div>
                    <h2 className="text-xl font-semibold mt-1">{u.nameFa}</h2>
                    {u.nameEn && (
                      <div className="text-sm text-[color:var(--fg-mute)] mt-1">
                        {u.nameEn}
                      </div>
                    )}
                    <div className="text-sm mt-2">
                      منشور:{" "}
                      <span className="font-medium">
                        {formatDate(u.charterDate)}
                      </span>
                      <span className="mx-3">·</span>
                      وضعیت:{" "}
                      <span className="font-medium">
                        {STATUS_LABEL[u.status] || u.status}
                      </span>
                      <span className="mx-3">·</span>
                      {toFa(String(u._count?.semesters ?? 0))} نیمسال
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleExpand(u.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "بستن نیمسال‌ها" : "نمایش نیمسال‌ها"}
                  >
                    <Icon
                      name={isExpanded ? "chevronUp" : "chevronDown"}
                      size={16}
                    />
                    {isExpanded ? "بستن" : "نیمسال‌ها"}
                  </button>
                </header>

                {isExpanded && (
                  <div className="mt-6 border-t pt-4">
                    {!sems && (
                      <div className="text-sm text-[color:var(--fg-mute)]">
                        در حال بارگذاری نیمسال‌ها…
                      </div>
                    )}
                    {sems && sems.length === 0 && (
                      <div className="text-sm text-[color:var(--fg-mute)]">
                        هنوز نیمسالی برای این دانشگاه ثبت نشده است.
                      </div>
                    )}
                    {sems && sems.length > 0 && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[color:var(--fg-mute)]">
                            <th className="text-start py-2">کد</th>
                            <th className="text-start py-2">نام</th>
                            <th className="text-start py-2">نوع</th>
                            <th className="text-start py-2">بازه</th>
                            <th className="text-start py-2">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sems.map((s) => (
                            <tr
                              key={s.id}
                              className="border-t border-[color:var(--line)]"
                            >
                              <td className="py-3 font-mono text-xs">
                                {s.code}
                              </td>
                              <td className="py-3">{s.nameFa}</td>
                              <td className="py-3">
                                {TERM_LABEL[s.termType] || s.termType}
                              </td>
                              <td className="py-3">
                                {formatDate(s.startDate)} —{" "}
                                {formatDate(s.endDate)}
                              </td>
                              <td className="py-3">
                                <span className="pill">
                                  {STATUS_LABEL[s.status] || s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <footer className="mt-12 text-xs text-[color:var(--fg-mute)]">
        Phase B · B.1b · ساختار دانشگاهی — اطلاعات از API زنده. برای مدیریت
        کامل (افزودن/حذف/ویرایش) به B.1c مراجعه کنید.
      </footer>
    </main>
  );
};

export default AcademicsPage;
