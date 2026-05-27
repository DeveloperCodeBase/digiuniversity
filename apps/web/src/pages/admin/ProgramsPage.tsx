// Phase B R1 Commit H (D62) — admin ProgramsPage with full CRUD +
// departmentId FK picker + degreeLevel + durationSemesters fields.

import React from "react";

import { academicAdminApi } from "../../api/endpoints.js";
import { CrudDialog } from "./_shared/CrudDialog";
import { ConfirmDelete } from "./_shared/ConfirmDelete";
import { FormField, SelectField } from "./_shared/FormField";
import { useRole } from "../../role";

interface Program {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  shortCode: string | null;
  description: string | null;
  degreeLevel: string;
  durationSemesters: number | null;
  departmentId: string;
  department: { id: string; slug: string; name: string; shortCode: string | null };
  _count: { courses: number };
}

interface DeptOption {
  id: string;
  name: string;
}

const DEGREE_LEVELS = [
  { value: "bachelor", label: "کارشناسی" },
  { value: "master", label: "کارشناسی ارشد" },
  { value: "phd", label: "دکتری" },
  { value: "certificate", label: "گواهینامه" },
];

interface FormState {
  id?: string;
  slug: string;
  name: string;
  nameEn: string;
  shortCode: string;
  description: string;
  degreeLevel: string;
  durationSemesters: string;
  departmentId: string;
}

const EMPTY: FormState = {
  slug: "", name: "", nameEn: "", shortCode: "", description: "",
  degreeLevel: "bachelor", durationSemesters: "", departmentId: "",
};

export const ProgramsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<Program[]>([]);
  const [depts, setDepts] = React.useState<DeptOption[]>([]);
  const [filterDeptId, setFilterDeptId] = React.useState("");
  const [filterLevel, setFilterLevel] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FormState | null>(null);
  const [toDelete, setToDelete] = React.useState<Program | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const filter: { departmentId?: string; degreeLevel?: string } = {};
      if (filterDeptId) filter.departmentId = filterDeptId;
      if (filterLevel) filter.degreeLevel = filterLevel;
      const [progs, deptList] = await Promise.all([
        academicAdminApi.listPrograms(filter),
        academicAdminApi.listDepartments(),
      ]);
      setItems(progs);
      setDepts(deptList.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })));
    } finally { setLoading(false); }
  }, [filterDeptId, filterLevel]);

  React.useEffect(() => { refetch(); }, [refetch]);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...EMPTY, departmentId: filterDeptId });
  };
  const openEdit = (p: Program) => {
    setFormError(null);
    setEditing({
      id: p.id, slug: p.slug, name: p.name, nameEn: p.nameEn ?? "", shortCode: p.shortCode ?? "",
      description: p.description ?? "", degreeLevel: p.degreeLevel,
      durationSemesters: p.durationSemesters?.toString() ?? "",
      departmentId: p.departmentId,
    });
  };

  const handleSubmit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return setFormError("«نام فارسی» الزامی است");
    if (!editing.id && !editing.departmentId) return setFormError("«گروه والد» الزامی است");
    if (!editing.id && !editing.slug.trim()) return setFormError("«شناسه» الزامی است");
    setBusy(true); setFormError(null);
    try {
      const body: Record<string, unknown> = { name: editing.name.trim() };
      if (editing.nameEn.trim()) body.nameEn = editing.nameEn.trim();
      if (editing.shortCode.trim()) body.shortCode = editing.shortCode.trim();
      if (editing.description.trim()) body.description = editing.description.trim();
      if (editing.degreeLevel) body.degreeLevel = editing.degreeLevel;
      const ds = parseInt(editing.durationSemesters, 10);
      if (!Number.isNaN(ds) && ds > 0) body.durationSemesters = ds;
      if (editing.id) {
        await academicAdminApi.updateProgram(editing.id, body);
      } else {
        body.slug = editing.slug.trim();
        body.departmentId = editing.departmentId;
        await academicAdminApi.createProgram(body);
      }
      setEditing(null);
      await refetch();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(typeof msg === "string" ? msg : "ذخیره با خطا مواجه شد");
    } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try { await academicAdminApi.deleteProgram(toDelete.id); setToDelete(null); await refetch(); }
    finally { setBusy(false); }
  };

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-programs">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">ساختار آکادمیک</span>
          <h1 className="h-1">برنامه‌های آموزشی</h1>
          <p className="lead">پایین‌ترین سطح ساختار آکادمیک — برنامه‌های دانشگاهی با مقطع تحصیلی مشخص.</p>
        </div>
        {isAdmin ? <button type="button" className="btn btn-primary" onClick={openCreate}>+ افزودن برنامه</button> : null}
      </header>

      <div className="admin-filter-row">
        {depts.length > 0 ? (
          <>
            <label htmlFor="filter-dept" className="admin-filter-label">گروه:</label>
            <select id="filter-dept" className="admin-filter-select" value={filterDeptId} onChange={(e) => setFilterDeptId(e.target.value)}>
              <option value="">همه</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </>
        ) : null}
        <label htmlFor="filter-level" className="admin-filter-label">مقطع:</label>
        <select id="filter-level" className="admin-filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
          <option value="">همه</option>
          {DEGREE_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      {loading ? <div className="admin-loading">در حال بارگذاری…</div>
        : items.length === 0 ? <div className="admin-empty"><p>هنوز برنامه‌ای ثبت نشده است.</p></div>
        : (
          <table className="admin-table">
            <thead>
              <tr><th>نام فارسی</th><th>مقطع</th><th>طول دوره</th><th>گروه والد</th><th>تعداد دروس</th>{isAdmin ? <th aria-label="عملیات" /> : null}</tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} data-program-id={p.id}>
                  <td>
                    {p.name}
                    {p.nameEn ? <div className="text-mute" style={{ fontSize: 12 }}>{p.nameEn}</div> : null}
                  </td>
                  <td>{DEGREE_LEVELS.find((l) => l.value === p.degreeLevel)?.label ?? p.degreeLevel}</td>
                  <td>{p.durationSemesters != null ? `${p.durationSemesters} نیمسال` : "—"}</td>
                  <td>{p.department.name}</td>
                  <td>{p._count.courses}</td>
                  {isAdmin ? (
                    <td className="admin-row-actions">
                      <button type="button" className="btn-icon" onClick={() => openEdit(p)} aria-label={`ویرایش ${p.name}`}>✎</button>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => setToDelete(p)} aria-label={`حذف ${p.name}`}>🗑</button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}

      <CrudDialog open={editing != null} mode={editing?.id ? "edit" : "create"}
        title={editing?.id ? "ویرایش برنامه" : "افزودن برنامه جدید"}
        onClose={() => setEditing(null)} onSubmit={handleSubmit} busy={busy}>
        <FormField label="نام فارسی" name="name" value={editing?.name ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, name: v } : s)} required maxLength={160} />
        <FormField label="نام انگلیسی" name="nameEn" value={editing?.nameEn ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, nameEn: v } : s)} maxLength={160} dir="ltr" />
        {!editing?.id ? (
          <FormField label="شناسه" name="slug" value={editing?.slug ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, slug: v } : s)} required maxLength={64} dir="ltr" helper="ثابت پس از ایجاد" />
        ) : null}
        <SelectField label="مقطع تحصیلی" name="degreeLevel" value={editing?.degreeLevel ?? "bachelor"}
          onChange={(v) => setEditing((s) => s ? { ...s, degreeLevel: v } : s)} options={DEGREE_LEVELS} required />
        <FormField label="طول دوره (نیمسال)" name="durationSemesters" type="number" value={editing?.durationSemesters ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, durationSemesters: v } : s)} />
        <FormField label="کد اختصاری" name="shortCode" value={editing?.shortCode ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, shortCode: v } : s)} maxLength={32} dir="ltr" />
        {!editing?.id ? (
          <SelectField label="گروه والد" name="departmentId" value={editing?.departmentId ?? ""}
            onChange={(v) => setEditing((s) => s ? { ...s, departmentId: v } : s)}
            options={depts.map((d) => ({ value: d.id, label: d.name }))} emptyLabel="انتخاب کنید…" required />
        ) : null}
        <FormField label="توضیحات" name="description" value={editing?.description ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, description: v } : s)} maxLength={2000} />
        {formError ? <div className="crud-form-error" role="alert" style={{ marginTop: 8 }}>{formError}</div> : null}
      </CrudDialog>

      <ConfirmDelete open={toDelete != null} title="حذف برنامه؟"
        body={toDelete ? `برنامه‌ی «${toDelete.name}» نرم-حذف می‌شود.${toDelete._count.courses > 0 ? ` ${toDelete._count.courses} درس ذیل این برنامه قابل دسترسی نخواهد بود تا بازیابی شود.` : ""}` : ""}
        busy={busy} onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </main>
  );
};

export default ProgramsPage;
