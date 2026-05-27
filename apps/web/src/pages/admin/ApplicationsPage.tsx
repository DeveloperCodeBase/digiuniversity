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
import { CrudDialog } from "./_shared/CrudDialog";
import { ConfirmDelete } from "./_shared/ConfirmDelete";

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

// Mirror of backend ALLOWED_TRANSITIONS (Q1.a per D71). Kept in sync by
// convention — Commit I's D12 spec asserts the legality on a sample
// SUBMITTED row so a backend drift would surface in CI.
const ALLOWED_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  SUBMITTED:    ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  INTERVIEW:    ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED:     ["ENROLLED", "WITHDRAWN"],
  ENROLLED:     [],
  REJECTED:     [],
  WITHDRAWN:    [],
};

const TERMINAL_STATES: ReadonlyArray<AppStatus> = ["ENROLLED", "REJECTED", "WITHDRAWN"];

// Unified row shape for rendering the table — promoted from the
// component's useMemo so the drawer state can type-reference it.
type UnifiedRow = {
  kind: ApplicationKind;
  id: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  targetLabel: string; // program name OR department name OR "(unset)"
  status: AppStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  submittedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  resultingId: string | null; // resultingStudentId OR resultingInstructorId
  raw: StudentApplication | InstructorApplication;
};

// Persian labels for the transition button on each target status. Mirror
// the structure R2 OfferingsPage uses for state-machine buttons.
const TRANSITION_LABEL_FA: Record<AppStatus, string> = {
  SUBMITTED: "ارسال",
  UNDER_REVIEW: "آغاز بازبینی",
  INTERVIEW: "ارجاع به مصاحبه",
  ACCEPTED: "پذیرش",
  ENROLLED: "ثبت‌نام نهایی",
  REJECTED: "رد",
  WITHDRAWN: "انصراف / لغو",
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

  // Phase B R3.b Commit H — drawer + transition state.
  const [selectedRow, setSelectedRow] = React.useState<UnifiedRow | null>(null);
  const [pendingEnrollConfirm, setPendingEnrollConfirm] = React.useState<UnifiedRow | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [drawerError, setDrawerError] = React.useState<string | null>(null);

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

  const rows: UnifiedRow[] = React.useMemo(() => {
    const out: UnifiedRow[] = [];
    if (typeFilter === "all" || typeFilter === "student") {
      for (const s of studentApps) {
        out.push({
          kind: "student",
          id: s.id,
          applicantFullName: s.applicantFullName,
          applicantEmail: s.applicantEmail,
          applicantPhone: s.applicantPhone,
          targetLabel: s.program?.name ?? "(بدون برنامه)",
          status: s.status,
          emailVerified: s.applicantEmailVerifiedAt != null,
          phoneVerified: s.applicantPhoneVerifiedAt != null,
          submittedAt: s.submittedAt,
          decidedAt: s.decidedAt,
          decidedBy: s.decidedBy,
          resultingId: s.resultingStudentId,
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
          applicantPhone: i.applicantPhone,
          targetLabel: i.department?.name ?? i.preferredDepartmentSlug ?? "(بدون گروه)",
          status: i.status,
          emailVerified: i.applicantEmailVerifiedAt != null,
          phoneVerified: i.applicantPhoneVerifiedAt != null,
          submittedAt: i.submittedAt,
          decidedAt: i.decidedAt,
          decidedBy: i.decidedBy,
          resultingId: i.resultingInstructorId,
          raw: i,
        });
      }
    }
    // Sort newest-first
    out.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return out;
  }, [studentApps, instructorApps, typeFilter]);

  // Phase B R3.b Commit H — drawer state sync. When the source rows
  // change (after a refetch following any transition/verification),
  // refresh the drawer's `selectedRow` against the new data so the
  // drawer reflects the post-action state automatically.
  React.useEffect(() => {
    if (!selectedRow) return;
    const refreshed = rows.find((r) => r.id === selectedRow.id && r.kind === selectedRow.kind);
    if (refreshed) {
      setSelectedRow(refreshed);
    } else {
      // Row gone (soft-deleted) — close the drawer.
      setSelectedRow(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // ---------- Transition + verification action handlers (Commit H) ----------

  const api = (kind: ApplicationKind) =>
    kind === "student" ? studentApplicationsApi : instructorApplicationsApi;

  const handleTransition = async (row: UnifiedRow, to: AppStatus) => {
    setBusy(true);
    setDrawerError(null);
    try {
      await api(row.kind).transition(row.id, to);
      await refetch();
      window.toast?.({
        title: "وضعیت تغییر کرد",
        msg: `«${row.applicantFullName}» → ${STATUS_LABEL_FA[to]}`,
        kind: "success",
      });
    } catch (err) {
      const msg =
        (err as { body?: { message?: string | string[] } })?.body?.message ??
        (err instanceof Error ? err.message : "تغییر وضعیت با خطا مواجه شد");
      const text = Array.isArray(msg) ? msg.join("\n") : String(msg);
      setDrawerError(text);
      window.toast?.({ title: "خطا در تغییر وضعیت", msg: text, kind: "danger" });
    } finally {
      setBusy(false);
      setPendingEnrollConfirm(null);
    }
  };

  const handleToggleVerify = async (row: UnifiedRow, channel: "email" | "phone") => {
    setBusy(true);
    setDrawerError(null);
    try {
      const current = channel === "email" ? row.emailVerified : row.phoneVerified;
      const next = !current;
      const a = api(row.kind);
      if (channel === "email") {
        await a.verifyEmail(row.id, next);
      } else {
        await a.verifyPhone(row.id, next);
      }
      await refetch();
    } catch (err) {
      const msg =
        (err as { body?: { message?: string | string[] } })?.body?.message ??
        (err instanceof Error ? err.message : "خطا در تغییر وضعیت تأیید");
      setDrawerError(Array.isArray(msg) ? msg.join("\n") : String(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async (row: UnifiedRow) => {
    setBusy(true);
    setDrawerError(null);
    try {
      await api(row.kind).withdraw(row.id);
      await refetch();
      window.toast?.({
        title: "درخواست انصراف ثبت شد",
        msg: `«${row.applicantFullName}»`,
        kind: "success",
      });
    } catch (err) {
      const msg =
        (err as { body?: { message?: string | string[] } })?.body?.message ??
        (err instanceof Error ? err.message : "انصراف با خطا مواجه شد");
      setDrawerError(Array.isArray(msg) ? msg.join("\n") : String(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleSoftDelete = async (row: UnifiedRow) => {
    const ok = await window.confirmAction?.({
      title: "حذف درخواست",
      body: `درخواست «${row.applicantFullName}» (${STATUS_LABEL_FA[row.status]}) به‌صورت soft-delete حذف می‌شود. این عمل قابل بازگردانی است.`,
      confirmLabel: "حذف",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api(row.kind).delete(row.id);
      await refetch();
      setSelectedRow(null);
      window.toast?.({ title: "درخواست حذف شد", msg: "درخواست به آرشیو حذف‌شده‌ها منتقل شد.", kind: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حذف با خطا مواجه شد";
      window.toast?.({ title: "خطا در حذف", msg, kind: "danger" });
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="page-shell admin-academic-page" data-screen-label="admin-applications">
        <div className="text-center" style={{ padding: 80, color: "var(--fg-mute)" }}>
          دسترسی فقط برای مدیران.
        </div>
      </main>
    );
  }

  // Phase B R3.b Commit H — click row opens the drawer with full
  // transition + verification + withdraw + delete controls.
  const onRowClick = (row: UnifiedRow) => {
    setDrawerError(null);
    setSelectedRow(row);
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

      {/* Phase B R3.b Commit H — applicant detail + transition drawer.
          Reuses CrudDialog as the modal frame. Renders the applicant
          snapshot read-only, plus inline verification toggles +
          transition buttons (only legal next-states shown per the
          mirrored ALLOWED_TRANSITIONS map). */}
      <CrudDialog
        open={selectedRow != null}
        mode="edit"
        title={
          selectedRow
            ? `${selectedRow.kind === "student" ? "درخواست دانشجو" : "درخواست استاد"}: ${selectedRow.applicantFullName}`
            : "جزئیات درخواست"
        }
        busy={busy}
        onClose={() => setSelectedRow(null)}
        onSubmit={() => undefined /* drawer has no submit; actions are inline buttons */}
      >
        {selectedRow ? (
          <div data-application-drawer={selectedRow.id}>
            {/* Applicant snapshot */}
            <div className="card p-4 mb-3" style={{ background: "var(--surface-2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                <div style={{ color: "var(--fg-mute)" }}>ایمیل:</div>
                <div className="mono">{selectedRow.applicantEmail}</div>
                <div style={{ color: "var(--fg-mute)" }}>تلفن:</div>
                <div className="mono">{selectedRow.applicantPhone ?? "—"}</div>
                <div style={{ color: "var(--fg-mute)" }}>هدف:</div>
                <div>{selectedRow.targetLabel}</div>
                <div style={{ color: "var(--fg-mute)" }}>وضعیت:</div>
                <div>
                  <span
                    className={STATUS_PILL_CLASS[selectedRow.status]}
                    style={{ fontSize: 11 }}
                    data-current-status={selectedRow.status}
                  >
                    {STATUS_LABEL_FA[selectedRow.status]}
                  </span>
                </div>
                <div style={{ color: "var(--fg-mute)" }}>تاریخ ارسال:</div>
                <div className="mono" style={{ fontSize: 11 }}>
                  {new Date(selectedRow.submittedAt).toLocaleString("fa-IR")}
                </div>
                {selectedRow.decidedAt ? (
                  <>
                    <div style={{ color: "var(--fg-mute)" }}>تاریخ تصمیم:</div>
                    <div className="mono" style={{ fontSize: 11 }}>
                      {new Date(selectedRow.decidedAt).toLocaleString("fa-IR")}
                    </div>
                  </>
                ) : null}
                {selectedRow.resultingId ? (
                  <>
                    <div style={{ color: "var(--fg-mute)" }}>منتج به:</div>
                    <div className="mono" style={{ fontSize: 11 }}>
                      {selectedRow.kind === "student" ? "Student" : "Instructor"}#{selectedRow.resultingId.slice(-8)}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Q4.a verification toggles */}
            <div className="card p-4 mb-3">
              <div className="mb-2" style={{ fontWeight: 600, fontSize: 13 }}>تأیید مخاطب (Q4.a)</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void handleToggleVerify(selectedRow, "email")}
                  disabled={busy}
                  data-action="toggle-email-verified"
                  data-verified={selectedRow.emailVerified}
                  className={"pill" + (selectedRow.emailVerified ? " pill-green" : "")}
                  style={{ fontSize: 12, padding: "6px 12px", cursor: "pointer" }}
                >
                  ✉ ایمیل {selectedRow.emailVerified ? "✓ تأیید شده" : "تأیید نشده"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleVerify(selectedRow, "phone")}
                  disabled={busy}
                  data-action="toggle-phone-verified"
                  data-verified={selectedRow.phoneVerified}
                  className={"pill" + (selectedRow.phoneVerified ? " pill-green" : "")}
                  style={{ fontSize: 12, padding: "6px 12px", cursor: "pointer" }}
                >
                  ☎ تلفن {selectedRow.phoneVerified ? "✓ تأیید شده" : "تأیید نشده"}
                </button>
              </div>
              <div className="crud-form-helper mt-2">
                Q4.a caveat: گذر از UNDER_REVIEW نیاز به هر دو تأیید دارد (به‌جز انصراف).
              </div>
            </div>

            {/* Transition controls + WITHDRAW (admin-on-behalf) + Delete */}
            <div className="card p-4">
              <div className="mb-2" style={{ fontWeight: 600, fontSize: 13 }}>اقدامات</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ALLOWED_TRANSITIONS[selectedRow.status].map((to) => {
                  // ENROLLED transition shows a confirm dialog because it
                  // triggers the Q5.a transactional side effect.
                  const isEnroll = to === "ENROLLED";
                  return (
                    <button
                      key={to}
                      type="button"
                      disabled={busy}
                      data-action="transition"
                      data-target-status={to}
                      onClick={() => {
                        if (isEnroll) {
                          setPendingEnrollConfirm(selectedRow);
                        } else {
                          void handleTransition(selectedRow, to);
                        }
                      }}
                      className={"btn " + (isEnroll ? "btn-primary" : "btn-ghost")}
                      style={{ fontSize: 12 }}
                    >
                      → {TRANSITION_LABEL_FA[to]}
                    </button>
                  );
                })}
                {!TERMINAL_STATES.includes(selectedRow.status) ? (
                  <button
                    type="button"
                    disabled={busy}
                    data-action="withdraw"
                    onClick={() => void handleWithdraw(selectedRow)}
                    className="btn btn-ghost"
                    style={{ fontSize: 12 }}
                    title="Q7.a: admin می‌تواند به جای متقاضی WITHDRAW کند"
                  >
                    انصراف به نمایندگی
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  data-action="soft-delete"
                  onClick={() => void handleSoftDelete(selectedRow)}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, color: "var(--accent)" }}
                >
                  حذف (soft)
                </button>
              </div>
              {drawerError ? (
                <div
                  className="crud-form-error mt-3"
                  role="alert"
                  data-drawer-error
                >
                  {drawerError}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </CrudDialog>

      {/* Q5.a ENROLLED confirmation — explains the transactional side
          effect (User find-or-create-or-link + Student/Instructor +
          role grant + NotificationLog) before firing. */}
      <ConfirmDelete
        open={pendingEnrollConfirm != null}
        title="ثبت‌نام نهایی (ACCEPTED → ENROLLED)"
        body={
          pendingEnrollConfirm
            ? `با تأیید این اقدام:
  • اگر کاربر متناظر «${pendingEnrollConfirm.applicantEmail}» در سامانه موجود نباشد، یک User جدید + Profile + نقش مربوطه ساخته می‌شود.
  • اگر موجود باشد، درخواست به همان کاربر link می‌شود (بدون duplicate).
  • سپس ${pendingEnrollConfirm.kind === "student" ? "Student" : "Instructor"} row ساخته می‌شود${pendingEnrollConfirm.kind === "instructor" ? " + نقش instructor اعطا می‌گردد" : ""}.
  • NotificationLog «user.password.claim» در صورت ساخت User جدید قرار می‌گیرد.
کل این مرحله transactional است — در صورت خطای هر گام، کل عملیات rollback می‌شود.`
            : ""
        }
        busy={busy}
        onCancel={() => setPendingEnrollConfirm(null)}
        onConfirm={async () => {
          if (pendingEnrollConfirm) {
            await handleTransition(pendingEnrollConfirm, "ENROLLED");
          }
        }}
      />
    </main>
  );
};

export default ApplicationsPage;
