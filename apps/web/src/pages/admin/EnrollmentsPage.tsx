// Phase B R4 Commit E (D73 + D74) — admin EnrollmentsPage.
//
// Closes the D72 spine gap surface: lists all enrollments (course-level
// + program-term), filters by offering / status / program, supports
// manual enroll (admin enrolls a user into an offering and/or course),
// status transitions (service-layer state machine, D74), and soft-delete.
//
// Routes to /admin/enrollments; own per-route lazy chunk (D66 Path D).
//
// Two enrollment shapes are rendered distinctly (Q0.a):
//   • course-level: courseId set → shows the Course code/title
//   • program-term admission: offeringId set + courseId null → shows the
//     CourseOffering name + a «پذیرش دوره‌ای» (program-term) pill

import React from "react";

import {
  enrollmentsAdminApi,
  academicAdminApi,
  studentApi,
} from "../../api/endpoints.js";
import { useRole } from "../../role";
import { CrudDialog } from "./_shared/CrudDialog";

type EnrollmentStatus = "active" | "completed" | "dropped" | "withdrawn";

interface Enrollment {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string | null;
  offeringId: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  user?: { id: string; email: string; fullName: string | null };
  course?: { id: string; code: string; title: string } | null;
  offering?: { id: string; slug: string; nameFa: string; nameEn: string | null } | null;
}

interface ProgramOpt { id: string; slug: string; name: string; }
interface OfferingOpt { id: string; slug: string; nameFa: string; programId: string; }
interface StudentOpt { id: string; userId: string; studentCode: string; user?: { fullName: string | null; email: string } }

const STATUS_LABEL_FA: Record<EnrollmentStatus, string> = {
  active: "فعال",
  completed: "پایان‌یافته",
  dropped: "حذف",
  withdrawn: "انصراف",
};

const STATUS_PILL_CLASS: Record<EnrollmentStatus, string> = {
  active: "pill pill-cyan",
  completed: "pill pill-green",
  dropped: "pill pill-rose",
  withdrawn: "pill",
};

// Mirror of backend ALLOWED_TRANSITIONS (service-layer, D74). Drift
// surfaces in Commit G's spec.
const ALLOWED_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  active: ["completed", "dropped", "withdrawn"],
  completed: [],
  dropped: [],
  withdrawn: [],
};

interface EnrollFormState {
  userId: string;
  offeringId: string;
  courseId: string;
}

const EMPTY_FORM: EnrollFormState = { userId: "", offeringId: "", courseId: "" };

export const EnrollmentsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<Enrollment[]>([]);
  const [programs, setPrograms] = React.useState<ProgramOpt[]>([]);
  const [offerings, setOfferings] = React.useState<OfferingOpt[]>([]);
  const [students, setStudents] = React.useState<StudentOpt[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<EnrollmentStatus | "">("");
  const [filterOffering, setFilterOffering] = React.useState<string>("");
  const [filterProgram, setFilterProgram] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [enrollForm, setEnrollForm] = React.useState<EnrollFormState | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, progs, offs, studs] = await Promise.all([
        enrollmentsAdminApi.adminList({
          status: filterStatus || undefined,
          offeringId: filterOffering || undefined,
          programId: filterProgram || undefined,
        }) as Promise<Enrollment[]>,
        academicAdminApi.listPrograms() as Promise<ProgramOpt[]>,
        academicAdminApi.listOfferings() as Promise<OfferingOpt[]>,
        studentApi.list() as Promise<StudentOpt[]>,
      ]);
      setItems(Array.isArray(list) ? list : []);
      setPrograms(Array.isArray(progs) ? progs : []);
      setOfferings(Array.isArray(offs) ? offs : []);
      setStudents(Array.isArray(studs) ? studs : []);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterOffering, filterProgram]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  const handleManualEnroll = async () => {
    if (!enrollForm) return;
    if (!enrollForm.offeringId && !enrollForm.courseId) {
      setFormError("حداقل یکی از «دوره ارائه‌شده» یا «درس» را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await enrollmentsAdminApi.manualEnroll({
        userId: enrollForm.userId,
        offeringId: enrollForm.offeringId || undefined,
        courseId: enrollForm.courseId || undefined,
      });
      setEnrollForm(null);
      await refetch();
      window.toast?.({ title: "ثبت‌نام انجام شد", msg: "دانشجو با موفقیت ثبت‌نام شد.", kind: "success" });
    } catch (err) {
      const msg =
        (err as { body?: { message?: string | string[] } })?.body?.message ??
        (err instanceof Error ? err.message : "ثبت‌نام با خطا مواجه شد");
      setFormError(Array.isArray(msg) ? msg.join("\n") : String(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleTransition = async (row: Enrollment, to: EnrollmentStatus) => {
    setBusy(true);
    try {
      await enrollmentsAdminApi.transition(row.id, to);
      await refetch();
      window.toast?.({ title: "وضعیت تغییر کرد", msg: `→ ${STATUS_LABEL_FA[to]}`, kind: "success" });
    } catch (err) {
      const msg =
        (err as { body?: { message?: string | string[] } })?.body?.message ??
        (err instanceof Error ? err.message : "تغییر وضعیت با خطا مواجه شد");
      window.toast?.({ title: "خطا", msg: Array.isArray(msg) ? msg.join("\n") : String(msg), kind: "danger" });
    } finally {
      setBusy(false);
    }
  };

  const handleSoftDelete = async (row: Enrollment) => {
    const ok = await window.confirmAction?.({
      title: "حذف ثبت‌نام",
      body: `ثبت‌نام «${row.user?.fullName || row.user?.email}» حذف می‌شود (soft-delete، قابل بازگردانی).`,
      confirmLabel: "حذف",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await enrollmentsAdminApi.delete(row.id);
      await refetch();
      window.toast?.({ title: "ثبت‌نام حذف شد", msg: "به آرشیو منتقل شد.", kind: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حذف با خطا مواجه شد";
      window.toast?.({ title: "خطا در حذف", msg, kind: "danger" });
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="page-shell admin-academic-page" data-screen-label="admin-enrollments">
        <div className="text-center" style={{ padding: 80, color: "var(--fg-mute)" }}>
          دسترسی فقط برای مدیران.
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-enrollments">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">افراد</span>
          <h1 className="h-1">ثبت‌نام‌ها</h1>
          <p className="mt-1" style={{ color: "var(--fg-mute)", fontSize: 13 }}>
            ثبت‌نام‌های دوره‌ای (پذیرش در یک ترم) و درسی. ثبت‌نام دستی، تغییر وضعیت و حذف.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setFormError(null); setEnrollForm({ ...EMPTY_FORM }); }}
          data-action="open-manual-enroll"
        >
          + ثبت‌نام دستی
        </button>
      </header>

      <div className="admin-filter-row" style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as EnrollmentStatus | "")} className="crud-form-input" style={{ maxWidth: 180 }} aria-label="فیلتر وضعیت">
          <option value="">همه وضعیت‌ها</option>
          {(Object.keys(STATUS_LABEL_FA) as EnrollmentStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL_FA[s]}</option>
          ))}
        </select>
        <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="crud-form-input" style={{ maxWidth: 220 }} aria-label="فیلتر برنامه">
          <option value="">همه برنامه‌ها</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterOffering} onChange={(e) => setFilterOffering(e.target.value)} className="crud-form-input" style={{ maxWidth: 240 }} aria-label="فیلتر دوره ارائه‌شده">
          <option value="">همه دوره‌های ارائه‌شده</option>
          {offerings.map((o) => <option key={o.id} value={o.id}>{o.nameFa}</option>)}
        </select>
        <span style={{ alignSelf: "center", color: "var(--fg-mute)", fontSize: 12 }}>{items.length} ثبت‌نام</span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--fg-mute)" }}>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--fg-mute)" }}>هیچ ثبت‌نامی با این فیلترها یافت نشد.</div>
      ) : (
        <table className="admin-table" data-table="enrollments">
          <thead>
            <tr>
              <th>دانشجو</th>
              <th>نوع / هدف</th>
              <th>وضعیت</th>
              <th>تاریخ ثبت‌نام</th>
              <th>اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => {
              const isProgramTerm = e.courseId === null && e.offeringId !== null;
              return (
                <tr key={e.id} data-enrollment-id={e.id} data-shape={isProgramTerm ? "program-term" : "course-level"}>
                  <td>{e.user?.fullName || e.user?.email || e.userId.slice(-8)}</td>
                  <td>
                    {isProgramTerm ? (
                      <>
                        <span className="pill pill-amber" style={{ fontSize: 10, marginLeft: 6 }}>پذیرش دوره‌ای</span>
                        {e.offering?.nameFa ?? "—"}
                      </>
                    ) : (
                      <>
                        <span className="pill" style={{ fontSize: 10, marginLeft: 6 }}>درسی</span>
                        {e.course ? `${e.course.code} — ${e.course.title}` : "—"}
                      </>
                    )}
                  </td>
                  <td>
                    <span className={STATUS_PILL_CLASS[e.status]} style={{ fontSize: 11 }} data-status={e.status}>
                      {STATUS_LABEL_FA[e.status]}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{new Date(e.enrolledAt).toLocaleDateString("fa-IR")}</td>
                  <td className="admin-row-actions">
                    {ALLOWED_TRANSITIONS[e.status].map((to) => (
                      <button
                        key={to}
                        type="button"
                        disabled={busy}
                        data-action="transition"
                        data-target-status={to}
                        onClick={() => void handleTransition(e, to)}
                        className="btn-icon"
                        style={{ fontSize: 11 }}
                      >
                        → {STATUS_LABEL_FA[to]}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={busy}
                      data-action="soft-delete"
                      onClick={() => void handleSoftDelete(e)}
                      className="btn-icon btn-icon-danger"
                      aria-label="حذف ثبت‌نام"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Manual enroll dialog */}
      <CrudDialog
        open={enrollForm != null}
        mode="create"
        title="ثبت‌نام دستی"
        busy={busy}
        onClose={() => setEnrollForm(null)}
        onSubmit={handleManualEnroll}
      >
        {enrollForm ? (
          <>
            {formError ? (
              <div className="crud-form-error" role="alert" style={{ marginBottom: 8 }}>{formError}</div>
            ) : null}
            <label className="crud-form-label" htmlFor="enroll-student">دانشجو</label>
            <select
              id="enroll-student"
              value={enrollForm.userId}
              onChange={(ev) => setEnrollForm((c) => (c ? { ...c, userId: ev.target.value } : c))}
              className="crud-form-input"
              data-control="enroll-student"
            >
              <option value="">— انتخاب دانشجو —</option>
              {students.map((s) => (
                <option key={s.id} value={s.userId}>
                  {(s.user?.fullName || s.user?.email || s.studentCode)} ({s.studentCode})
                </option>
              ))}
            </select>
            <div className="crud-form-helper mb-2">حداقل یکی از دو مورد زیر را انتخاب کنید:</div>
            <label className="crud-form-label" htmlFor="enroll-offering">دوره ارائه‌شده (پذیرش دوره‌ای)</label>
            <select
              id="enroll-offering"
              value={enrollForm.offeringId}
              onChange={(ev) => setEnrollForm((c) => (c ? { ...c, offeringId: ev.target.value } : c))}
              className="crud-form-input"
            >
              <option value="">— بدون —</option>
              {offerings.map((o) => <option key={o.id} value={o.id}>{o.nameFa}</option>)}
            </select>
            <div className="crud-form-helper">یا ثبت‌نام درسی از طریق API (در این نسخه فقط پذیرش دوره‌ای از UI).</div>
          </>
        ) : null}
      </CrudDialog>
    </main>
  );
};

export default EnrollmentsPage;
