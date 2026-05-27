// Phase B R3.a Commit I (D68) — admin InstructorsPage with full CRUD +
// expertise tags + department reassignment (dedicated sub-endpoint).
//
// Routes to /admin/instructors; lazy chunk per D66 Path D (NO bucket).
//
// Two extras vs StudentsPage:
//   1. expertise — comma-separated text input, parsed to String[] on
//      submit. Backend validates ArrayMaxSize(20) + per-element max
//      length 64. Chip display in the table.
//   2. department — separate dropdown that uses the dedicated
//      assignDepartment sub-endpoint on save IF the department changed.
//      The main PATCH endpoint doesn't accept departmentId; the
//      sub-endpoint is the only path per service-layer design.

import React from "react";

import { academicAdminApi, instructorApi } from "../../api/endpoints.js";
import { useRole } from "../../role";
import { ConfirmDelete } from "./_shared/ConfirmDelete";
import { CrudDialog } from "./_shared/CrudDialog";
import { FormField, SelectField } from "./_shared/FormField";

type InstructorStatus = "ACTIVE" | "ON_SABBATICAL" | "INACTIVE" | "TERMINATED";
type InstructorRank = "ASSISTANT" | "ASSOCIATE" | "FULL" | "EMERITUS";

interface Department {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  shortCode: string | null;
}

interface Instructor {
  id: string;
  tenantId: string;
  userId: string;
  instructorCode: string;
  departmentId: string | null;
  rank: InstructorRank | null;
  expertise: string[];
  hireDate: string | null;
  status: InstructorStatus;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; fullName: string | null; isActive: boolean };
  department: Department | null;
  _count?: { taughtOfferings: number };
}

interface FormState {
  id?: string;
  userId: string;
  instructorCode: string;
  departmentId: string;
  rank: InstructorRank | "";
  expertiseText: string; // comma-separated
  hireDate: string;
  status: InstructorStatus;
  // Track the original departmentId so we know whether to fire the
  // assignDepartment sub-endpoint on save (only if it actually changed).
  originalDepartmentId?: string;
}

const EMPTY: FormState = {
  userId: "",
  instructorCode: "",
  departmentId: "",
  rank: "",
  expertiseText: "",
  hireDate: "",
  status: "ACTIVE",
};

const STATUS_LABEL_FA: Record<InstructorStatus, string> = {
  ACTIVE: "فعال",
  ON_SABBATICAL: "فرصت مطالعاتی",
  INACTIVE: "غیرفعال",
  TERMINATED: "منقضی",
};

const STATUS_PILL: Record<InstructorStatus, string> = {
  ACTIVE: "pill pill-green",
  ON_SABBATICAL: "pill pill-amber",
  INACTIVE: "pill",
  TERMINATED: "pill pill-rose",
};

const RANK_LABEL_FA: Record<InstructorRank, string> = {
  ASSISTANT: "استادیار",
  ASSOCIATE: "دانشیار",
  FULL: "استاد تمام",
  EMERITUS: "بازنشسته",
};

const parseExpertise = (text: string): string[] =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const InstructorsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<Instructor[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<InstructorStatus | "">("");
  const [filterDept, setFilterDept] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FormState | null>(null);
  const [toDelete, setToDelete] = React.useState<Instructor | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: InstructorStatus; departmentId?: string } = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDept) params.departmentId = filterDept;
      const [list, depts] = await Promise.all([
        instructorApi.list(params),
        academicAdminApi.listDepartments(),
      ]);
      setItems(list as Instructor[]);
      setDepartments(depts as Department[]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDept]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...EMPTY });
  };

  const openEdit = (i: Instructor) => {
    setFormError(null);
    setEditing({
      id: i.id,
      userId: i.userId,
      instructorCode: i.instructorCode,
      departmentId: i.departmentId ?? "",
      rank: i.rank ?? "",
      expertiseText: i.expertise.join(", "),
      hireDate: i.hireDate ? i.hireDate.slice(0, 10) : "",
      status: i.status,
      originalDepartmentId: i.departmentId ?? "",
    });
  };

  const handleSubmit = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        instructorCode: editing.instructorCode.trim(),
        rank: editing.rank || undefined,
        expertise: parseExpertise(editing.expertiseText),
        status: editing.status,
      };
      if (editing.hireDate) body.hireDate = editing.hireDate;

      let id = editing.id;
      if (id) {
        await instructorApi.update(id, body);
      } else {
        body.userId = editing.userId.trim();
        // Initial create can include departmentId directly per backend
        // CreateInstructorDto. Reassignment after create goes through
        // the sub-endpoint.
        if (editing.departmentId) body.departmentId = editing.departmentId;
        const created: Instructor = await instructorApi.create(body);
        id = created.id;
      }

      // If editing and department actually changed, hit the sub-endpoint.
      if (editing.id && editing.departmentId !== editing.originalDepartmentId) {
        await instructorApi.assignDepartment(id, editing.departmentId || null);
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
      await instructorApi.delete(toDelete.id);
      setToDelete(null);
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="page-shell admin-academic-page" data-screen-label="admin-instructors">
        <div className="text-center" style={{ padding: 80, color: "var(--fg-mute)" }}>
          دسترسی فقط برای مدیران.
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-instructors">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">افراد</span>
          <h1 className="h-1">اساتید</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate} data-action="add-instructor">
          + افزودن استاد
        </button>
      </header>

      <div className="admin-filter-row" style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as InstructorStatus | "")}
          className="crud-form-input"
          style={{ maxWidth: 200 }}
          aria-label="فیلتر بر اساس وضعیت"
        >
          <option value="">همه وضعیت‌ها</option>
          {(Object.keys(STATUS_LABEL_FA) as InstructorStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL_FA[s]}
            </option>
          ))}
        </select>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="crud-form-input"
          style={{ maxWidth: 240 }}
          aria-label="فیلتر بر اساس گروه آموزشی"
        >
          <option value="">همه گروه‌ها</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
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
          هیچ استادی ثبت نشده است.
        </div>
      ) : (
        <table className="admin-table" data-table="instructors">
          <thead>
            <tr>
              <th>کد</th>
              <th>نام</th>
              <th>گروه</th>
              <th>مرتبه</th>
              <th>تخصص</th>
              <th>وضعیت</th>
              <th>دوره‌ها</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} onClick={() => openEdit(i)} style={{ cursor: "pointer" }}>
                <td className="mono">{i.instructorCode}</td>
                <td>{i.user.fullName || i.user.email}</td>
                <td>{i.department?.name || "—"}</td>
                <td>{i.rank ? RANK_LABEL_FA[i.rank] : "—"}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {i.expertise.slice(0, 3).map((tag) => (
                      <span key={tag} className="pill" style={{ fontSize: 10 }}>
                        {tag}
                      </span>
                    ))}
                    {i.expertise.length > 3 ? (
                      <span style={{ color: "var(--fg-mute)", fontSize: 11 }}>
                        +{i.expertise.length - 3}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <span className={STATUS_PILL[i.status]} style={{ fontSize: 11 }}>
                    {STATUS_LABEL_FA[i.status]}
                  </span>
                </td>
                <td className="mono">{i._count?.taughtOfferings ?? 0}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setToDelete(i);
                    }}
                    aria-label={`حذف ${i.instructorCode}`}
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
        title={editing?.id ? "ویرایش استاد" : "افزودن استاد"}
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
                helper="کاربر مرتبط — باید نقش 'instructor' را داشته باشد تا بتوان او را به دوره منتسب کرد"
                dir="ltr"
              />
            ) : null}
            <FormField
              label="کد استاد"
              name="instructorCode"
              value={editing.instructorCode}
              onChange={(v) => setEditing((c) => (c ? { ...c, instructorCode: v } : c))}
              required
              maxLength={32}
              dir="ltr"
            />
            <SelectField
              label="گروه آموزشی"
              name="departmentId"
              value={editing.departmentId}
              onChange={(v) => setEditing((c) => (c ? { ...c, departmentId: v } : c))}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              emptyLabel="(بدون گروه)"
              helper={
                editing.id && editing.departmentId !== editing.originalDepartmentId
                  ? "تغییر گروه از طریق sub-resource ذخیره می‌شود"
                  : undefined
              }
            />
            <SelectField
              label="مرتبه علمی"
              name="rank"
              value={editing.rank}
              onChange={(v) => setEditing((c) => (c ? { ...c, rank: v as InstructorRank | "" } : c))}
              options={(Object.keys(RANK_LABEL_FA) as InstructorRank[]).map((r) => ({
                value: r,
                label: RANK_LABEL_FA[r],
              }))}
              emptyLabel="(تعیین نشده)"
            />
            <FormField
              label="تخصص (با کاما جدا کنید)"
              name="expertiseText"
              value={editing.expertiseText}
              onChange={(v) => setEditing((c) => (c ? { ...c, expertiseText: v } : c))}
              helper={`حداکثر 20 تگ، هر کدام ≤ 64 کاراکتر. مثال: machine_learning, nlp, intro_cs`}
              dir="ltr"
            />
            <FormField
              label="تاریخ استخدام"
              name="hireDate"
              type="date"
              value={editing.hireDate}
              onChange={(v) => setEditing((c) => (c ? { ...c, hireDate: v } : c))}
            />
            <SelectField
              label="وضعیت"
              name="status"
              value={editing.status}
              onChange={(v) =>
                setEditing((c) => (c ? { ...c, status: v as InstructorStatus } : c))
              }
              options={(Object.keys(STATUS_LABEL_FA) as InstructorStatus[]).map((s) => ({
                value: s,
                label: STATUS_LABEL_FA[s],
              }))}
              required
            />
          </>
        ) : null}
      </CrudDialog>

      <ConfirmDelete
        open={toDelete != null}
        title="حذف استاد"
        body={
          toDelete
            ? `آیا از حذف استاد ${toDelete.instructorCode} (${toDelete.user.fullName || toDelete.user.email}) اطمینان دارید؟ ${(toDelete._count?.taughtOfferings ?? 0) > 0 ? `این استاد ${toDelete._count?.taughtOfferings} دوره فعال دارد — برای آن‌ها استاد جدید باید مشخص شود (cell به «—» تغییر می‌کند تا واگذار شود).` : "این عملیات قابل بازگردانی است (soft-delete)."}`
            : ""
        }
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
};

export default InstructorsPage;
