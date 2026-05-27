// Phase B R3.a Commit I (D68) — admin StudentsPage with full CRUD.
//
// Routes to /admin/students, lazy-loaded in router.tsx so the chunk
// lands as StudentsPage-<hash>.js per D66 Path D (NO admin bucket).
//
// Status field is a plain enum dropdown — R3.a treats StudentStatus
// as free-form (admin can set any value). The state machine guard
// lands in R3.b along with the StudentApplication acceptance side
// effects per D68 split.

import React from "react";

import { studentApi } from "../../api/endpoints.js";
import { useRole } from "../../role";
import { ConfirmDelete } from "./_shared/ConfirmDelete";
import { CrudDialog } from "./_shared/CrudDialog";
import { FormField, SelectField } from "./_shared/FormField";

type StudentStatus = "ENROLLED" | "ON_LEAVE" | "GRADUATED" | "WITHDRAWN" | "DISMISSED";

interface Student {
  id: string;
  tenantId: string;
  userId: string;
  studentCode: string;
  admissionDate: string | null;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    isActive: boolean;
  };
}

interface FormState {
  id?: string;
  userId: string;
  studentCode: string;
  admissionDate: string;
  status: StudentStatus;
}

const EMPTY: FormState = {
  userId: "",
  studentCode: "",
  admissionDate: "",
  status: "ENROLLED",
};

const STATUS_LABEL_FA: Record<StudentStatus, string> = {
  ENROLLED: "ثبت‌نام شده",
  ON_LEAVE: "مرخصی",
  GRADUATED: "فارغ‌التحصیل",
  WITHDRAWN: "انصراف",
  DISMISSED: "اخراج",
};

const STATUS_PILL_CLASS: Record<StudentStatus, string> = {
  ENROLLED: "pill pill-cyan",
  ON_LEAVE: "pill pill-amber",
  GRADUATED: "pill pill-green",
  WITHDRAWN: "pill",
  DISMISSED: "pill pill-rose",
};

export const StudentsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<Student[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<StudentStatus | "">("");
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FormState | null>(null);
  const [toDelete, setToDelete] = React.useState<Student | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const data: Student[] = await studentApi.list(
        filterStatus ? { status: filterStatus } : {},
      );
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...EMPTY });
  };

  const openEdit = (s: Student) => {
    setFormError(null);
    setEditing({
      id: s.id,
      userId: s.userId,
      studentCode: s.studentCode,
      admissionDate: s.admissionDate ? s.admissionDate.slice(0, 10) : "",
      status: s.status,
    });
  };

  const handleSubmit = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        studentCode: editing.studentCode.trim(),
        status: editing.status,
      };
      if (editing.admissionDate) body.admissionDate = editing.admissionDate;
      if (editing.id) {
        await studentApi.update(editing.id, body);
      } else {
        body.userId = editing.userId.trim();
        await studentApi.create(body);
      }
      setEditing(null);
      await refetch();
    } catch (err) {
      const msg =
        (err as { body?: { message?: string | string[] } })?.body?.message ??
        (err instanceof Error ? err.message : "ذخیره با خطا مواجه شد");
      setFormError(Array.isArray(msg) ? msg.join("\n") : String(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await studentApi.delete(toDelete.id);
      setToDelete(null);
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="page-shell admin-academic-page" data-screen-label="admin-students">
        <div className="text-center" style={{ padding: 80, color: "var(--fg-mute)" }}>
          دسترسی فقط برای مدیران.
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-students">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">افراد</span>
          <h1 className="h-1">دانشجویان</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate} data-action="add-student">
          + افزودن دانشجو
        </button>
      </header>

      <div className="admin-filter-row" style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <label className="crud-form-label" style={{ alignSelf: "center" }}>
          فیلتر بر اساس وضعیت:
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StudentStatus | "")}
          className="crud-form-input"
          style={{ maxWidth: 200 }}
        >
          <option value="">همه</option>
          {(Object.keys(STATUS_LABEL_FA) as StudentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL_FA[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--fg-mute)" }}>
          در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--fg-mute)" }}>
          هیچ دانشجویی ثبت نشده است.
        </div>
      ) : (
        <table className="admin-table" data-table="students">
          <thead>
            <tr>
              <th>کد دانشجویی</th>
              <th>نام</th>
              <th>ایمیل</th>
              <th>وضعیت</th>
              <th>تاریخ پذیرش</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} onClick={() => openEdit(s)} style={{ cursor: "pointer" }}>
                <td className="mono">{s.studentCode}</td>
                <td>{s.user.fullName || "—"}</td>
                <td className="mono" style={{ fontSize: 12 }}>{s.user.email}</td>
                <td>
                  <span className={STATUS_PILL_CLASS[s.status]} style={{ fontSize: 11 }}>
                    {STATUS_LABEL_FA[s.status]}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>
                  {s.admissionDate ? new Date(s.admissionDate).toLocaleDateString("fa-IR") : "—"}
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setToDelete(s);
                    }}
                    aria-label={`حذف ${s.studentCode}`}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CrudDialog
        open={editing != null}
        mode={editing?.id ? "edit" : "create"}
        title={editing?.id ? "ویرایش دانشجو" : "افزودن دانشجو"}
        busy={busy}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
      >
        {editing ? (
          <>
            {formError ? (
              <div className="crud-form-error" role="alert" style={{ marginBottom: 8 }}>
                {formError}
              </div>
            ) : null}
            {!editing.id ? (
              <FormField
                label="شناسه کاربر (User ID)"
                name="userId"
                value={editing.userId}
                onChange={(v) => setEditing((c) => (c ? { ...c, userId: v } : c))}
                required
                helper="آی‌دی کاربر در پایگاه داده — از /admin/profiles یا /admin/users قابل کپی است"
                dir="ltr"
              />
            ) : null}
            <FormField
              label="کد دانشجویی"
              name="studentCode"
              value={editing.studentCode}
              onChange={(v) => setEditing((c) => (c ? { ...c, studentCode: v } : c))}
              required
              maxLength={32}
              dir="ltr"
            />
            <SelectField
              label="وضعیت"
              name="status"
              value={editing.status}
              onChange={(v) => setEditing((c) => (c ? { ...c, status: v as StudentStatus } : c))}
              options={(Object.keys(STATUS_LABEL_FA) as StudentStatus[]).map((s) => ({
                value: s,
                label: STATUS_LABEL_FA[s],
              }))}
              required
            />
            <FormField
              label="تاریخ پذیرش"
              name="admissionDate"
              type="date"
              value={editing.admissionDate}
              onChange={(v) => setEditing((c) => (c ? { ...c, admissionDate: v } : c))}
            />
          </>
        ) : null}
      </CrudDialog>

      <ConfirmDelete
        open={toDelete != null}
        title="حذف دانشجو"
        body={
          toDelete
            ? `آیا از حذف دانشجوی ${toDelete.studentCode} (${toDelete.user.fullName || toDelete.user.email}) اطمینان دارید؟ این عملیات قابل بازگردانی است (soft-delete).`
            : ""
        }
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
};

export default StudentsPage;
