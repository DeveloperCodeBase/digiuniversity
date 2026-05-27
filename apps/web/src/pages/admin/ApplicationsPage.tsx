// Phase B R3.b Commit G (D71) — admin ApplicationsPage list with filters.
//
// Unified view of StudentApplication + InstructorApplication per Q9.a.
// Type tab filter (همه / دانشجو / استاد) + status pill filter +
// program/department filter (context-dependent on the type tab).
//
// Routes to /admin/applications, lazy-loaded in router.tsx (NO admin
// bucket per D66 Path D — own per-route chunk).
//
// Commit G scope: list + filters only. The transition dialog +
// verification flag UI + withdraw flow land in Commit H. Click on a
// row in Commit G surfaces a read-only summary toast; Commit H replaces
// that with a full drawer.

import React from "react";

import { studentApplicationsApi, instructorApplicationsApi, academicAdminApi } from "../../api/endpoints.js";
import { useRole } from "../../role";

type AppStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "INTERVIEW"
  | "ACCEPTED"
  | "ENROLLED"
  | "REJECTED"
  | "WITHDRAWN";

type ApplicationKind = "student" | "instructor";

interface BaseApplication {
  id: string;
  tenantId: string;
  userId: string | null;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  applicantEmailVerifiedAt: string | null;
  applicantPhoneVerifiedAt: string | null;
  status: AppStatus;
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentApplication extends BaseApplication {
  programId: string;
  resultingStudentId: string | null;
  program?: { id: string; slug: string; name: string };
}

interface InstructorApplication extends BaseApplication {
  departmentId: string | null;
  preferredDepartmentSlug: string | null;
  expertise: string[];
  resultingInstructorId: string | null;
  department?: { id: string; slug: string; name: string } | null;
}

interface ProgramOpt { id: string; slug: string; name: string; }
interface DepartmentOpt { id: string; slug: string; name: string; }

const STATUS_LABEL_FA: Record<AppStatus, string> = {
  SUBMITTED: "ارسال شده",
  UNDER_REVIEW: "در حال بازبینی",
  INTERVIEW: "مصاحبه",
  ACCEPTED: "پذیرفته‌شده",
  ENROLLED: "ثبت‌نام نهایی",
  REJECTED: "رد شده",
  WITHDRAWN: "انصراف",
};

const STATUS_PILL_CLASS: Record<AppStatus, string> = {
  SUBMITTED: "pill",
  UNDER_REVIEW: "pill pill-amber",
  INTERVIEW: "pill pill-cyan",
  ACCEPTED: "pill pill-green",
  ENROLLED: "pill pill-green",
  REJECTED: "pill pill-rose",
  WITHDRAWN: "pill",
};

const VERIFY_DOT = (verified: boolean): React.CSSProperties => ({
  display: "inline-block",
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: verified ? "var(--accent)" : "var(--line)",
  marginLeft: 4,
});

export const ApplicationsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [typeFilter, setTypeFilter] = React.useState<"all" | ApplicationKind>("all");
  const [statusFilter, setStatusFilter] = React.useState<AppStatus | "">("");
  const [programFilter, setProgramFilter] = React.useState<string>("");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("");

  const [studentApps, setStudentApps] = React.useState<StudentApplication[]>([]);
  const [instructorApps, setInstructorApps] = React.useState<InstructorApplication[]>([]);
  const [programs, setPrograms] = React.useState<ProgramOpt[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentOpt[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch both lists so the «همه» tab can union them; cheap
      // for the demo seed sizes. Future scale-up: fetch only the active
      // type filter, or paginate.
      const [students, instructors, progs, depts] = await Promise.all([
        studentApplicationsApi.list({
          status: statusFilter || undefined,
          programId: programFilter || undefined,
        }) as Promise<StudentApplication[]>,
        instructorApplicationsApi.list({
          status: statusFilter || undefined,
          departmentId: departmentFilter || undefined,
        }) as Promise<InstructorApplication[]>,
        academicAdminApi.listPrograms() as Promise<ProgramOpt[]>,
        academicAdminApi.listDepartments() as Promise<DepartmentOpt[]>,
      ]);
      setStudentApps(Array.isArray(students) ? students : []);
      setInstructorApps(Array.isArray(instructors) ? instructors : []);
      setPrograms(Array.isArray(progs) ? progs : []);
      setDepartments(Array.isArray(depts) ? depts : []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, programFilter, departmentFilter]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  // Unified row shape for rendering the table.
  type UnifiedRow = {
    kind: ApplicationKind;
    id: string;
    applicantFullName: string;
    applicantEmail: string;
    targetLabel: string; // program name OR department name OR "(unset)"
    status: AppStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    submittedAt: string;
    raw: StudentApplication | InstructorApplication;
  };

  const rows: UnifiedRow[] = React.useMemo(() => {
    const out: UnifiedRow[] = [];
    if (typeFilter === "all" || typeFilter === "student") {
      for (const s of studentApps) {
        out.push({
          kind: "student",
          id: s.id,
          applicantFullName: s.applicantFullName,
          applicantEmail: s.applicantEmail,
          targetLabel: s.program?.name ?? "(بدون برنامه)",
          status: s.status,
          emailVerified: s.applicantEmailVerifiedAt != null,
          phoneVerified: s.applicantPhoneVerifiedAt != null,
          submittedAt: s.submittedAt,
          raw: s,
        });
      }
    }
    if (typeFilter === "all" || typeFilter === "instructor") {
      for (const i of instructorApps) {
        out.push({
          kind: "instructor",
          id: i.id,
          applicantFullName: i.applicantFullName,
          applicantEmail: i.applicantEmail,
          targetLabel: i.department?.name ?? i.preferredDepartmentSlug ?? "(بدون گروه)",
          status: i.status,
          emailVerified: i.applicantEmailVerifiedAt != null,
          phoneVerified: i.applicantPhoneVerifiedAt != null,
          submittedAt: i.submittedAt,
          raw: i,
        });
      }
    }
    // Sort newest-first
    out.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return out;
  }, [studentApps, instructorApps, typeFilter]);

  if (!isAdmin) {
    return (
      <main className="page-shell admin-academic-page" data-screen-label="admin-applications">
        <div className="text-center" style={{ padding: 80, color: "var(--fg-mute)" }}>
          دسترسی فقط برای مدیران.
        </div>
      </main>
    );
  }

  // Commit G placeholder: clicking a row surfaces a toast pointing to
  // Commit H. Replaced by the full drawer in H.
  const onRowClick = (row: UnifiedRow) => {
    window.toast?.({
      title: `درخواست ${row.kind === "student" ? "دانشجو" : "استاد"} — ${row.applicantFullName}`,
      msg: `وضعیت: ${STATUS_LABEL_FA[row.status]} · ID: ${row.id.slice(-8)}. کنترل‌های انتقال و تأیید در Commit H در همین صفحه ظاهر می‌شوند.`,
      kind: "info",
    });
  };

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-applications">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">افراد</span>
          <h1 className="h-1">درخواست‌ها</h1>
          <p className="mt-1" style={{ color: "var(--fg-mute)", fontSize: 13 }}>
            صندوق ورودی درخواست‌های دانشجویی و استادی. وضعیت + تأیید ایمیل/تلفن +
            تصمیم نهایی برای هر درخواست در همین صفحه قابل مدیریت است.
          </p>
        </div>
      </header>

      {/* Type filter tabs (Q9.a unified view) */}
      <div
        className="admin-filter-row"
        role="tablist"
        aria-label="نوع درخواست"
        style={{ display: "flex", gap: 8, margin: "12px 0" }}
      >
        {([
          ["all", "همه"],
          ["student", "دانشجو"],
          ["instructor", "استاد"],
        ] as const).map(([val, label]) => (
          <button
            key={val}
            type="button"
            role="tab"
            aria-selected={typeFilter === val}
            data-app-type-filter={val}
            onClick={() => setTypeFilter(val)}
            className={"pill" + (typeFilter === val ? " pill-cyan" : "")}
            style={{ cursor: "pointer", fontSize: 13, padding: "6px 14px" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Secondary filters (status + program/department, contextual) */}
      <div
        className="admin-filter-row"
        style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AppStatus | "")}
          className="crud-form-input"
          style={{ maxWidth: 200 }}
          aria-label="فیلتر بر اساس وضعیت"
        >
          <option value="">همه وضعیت‌ها</option>
          {(Object.keys(STATUS_LABEL_FA) as AppStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL_FA[s]}
            </option>
          ))}
        </select>

        {(typeFilter === "all" || typeFilter === "student") ? (
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="crud-form-input"
            style={{ maxWidth: 240 }}
            aria-label="فیلتر بر اساس برنامه (دانشجو)"
          >
            <option value="">همه برنامه‌ها</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : null}

        {(typeFilter === "all" || typeFilter === "instructor") ? (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="crud-form-input"
            style={{ maxWidth: 240 }}
            aria-label="فیلتر بر اساس گروه آموزشی (استاد)"
          >
            <option value="">همه گروه‌ها</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : null}

        <span style={{ alignSelf: "center", color: "var(--fg-mute)", fontSize: 12 }}>
          {rows.length} درخواست
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--fg-mute)" }}>
          در حال بارگذاری…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--fg-mute)" }}>
          هیچ درخواستی با این فیلترها یافت نشد.
        </div>
      ) : (
        <table className="admin-table" data-table="applications">
          <thead>
            <tr>
              <th>نوع</th>
              <th>نام متقاضی</th>
              <th>ایمیل</th>
              <th>هدف</th>
              <th>وضعیت</th>
              <th>تأیید</th>
              <th>تاریخ ارسال</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.kind}:${r.id}`}
                data-application-id={r.id}
                data-application-kind={r.kind}
                onClick={() => onRowClick(r)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <span
                    className={"pill " + (r.kind === "student" ? "pill-cyan" : "pill-amber")}
                    style={{ fontSize: 11 }}
                  >
                    {r.kind === "student" ? "دانشجو" : "استاد"}
                  </span>
                </td>
                <td>{r.applicantFullName}</td>
                <td className="mono" style={{ fontSize: 12 }}>{r.applicantEmail}</td>
                <td>{r.targetLabel}</td>
                <td>
                  <span className={STATUS_PILL_CLASS[r.status]} style={{ fontSize: 11 }}>
                    {STATUS_LABEL_FA[r.status]}
                  </span>
                </td>
                <td aria-label={`تأیید ایمیل ${r.emailVerified ? "بله" : "خیر"}، تلفن ${r.phoneVerified ? "بله" : "خیر"}`}>
                  <span title="ایمیل" data-verify-email={r.emailVerified}>
                    ✉
                    <span style={VERIFY_DOT(r.emailVerified)} />
                  </span>
                  <span title="تلفن" data-verify-phone={r.phoneVerified} style={{ marginRight: 8 }}>
                    ☎
                    <span style={VERIFY_DOT(r.phoneVerified)} />
                  </span>
                </td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {new Date(r.submittedAt).toLocaleString("fa-IR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default ApplicationsPage;
