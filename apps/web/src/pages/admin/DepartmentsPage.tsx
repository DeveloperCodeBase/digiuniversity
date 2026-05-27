// Phase B R1 Commit H (D62) — admin DepartmentsPage with full CRUD +
// facultyId FK picker (required, since Department.facultyId is NOT NULL).

import React from "react";

import { academicAdminApi } from "../../api/endpoints.js";
import { CrudDialog } from "./_shared/CrudDialog";
import { ConfirmDelete } from "./_shared/ConfirmDelete";
import { FormField, SelectField } from "./_shared/FormField";
import { useRole } from "../../role";

interface Department {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  shortCode: string | null;
  description: string | null;
  facultyId: string;
  faculty: { id: string; slug: string; name: string; shortCode: string | null };
  _count: { programs: number };
}

interface FacultyOption {
  id: string;
  name: string;
}

interface FormState {
  id?: string;
  slug: string;
  name: string;
  nameEn: string;
  shortCode: string;
  description: string;
  facultyId: string;
}

const EMPTY: FormState = {
  slug: "",
  name: "",
  nameEn: "",
  shortCode: "",
  description: "",
  facultyId: "",
};

export const DepartmentsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<Department[]>([]);
  const [faculties, setFaculties] = React.useState<FacultyOption[]>([]);
  const [filterFacultyId, setFilterFacultyId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FormState | null>(null);
  const [toDelete, setToDelete] = React.useState<Department | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const [depts, facList] = await Promise.all([
        academicAdminApi.listDepartments(filterFacultyId ? { facultyId: filterFacultyId } : {}),
        academicAdminApi.listFaculties(),
      ]);
      setItems(depts);
      setFaculties(facList.map((f: { id: string; name: string }) => ({ id: f.id, name: f.name })));
    } finally {
      setLoading(false);
    }
  }, [filterFacultyId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...EMPTY, facultyId: filterFacultyId });
  };
  const openEdit = (d: Department) => {
    setFormError(null);
    setEditing({
      id: d.id, slug: d.slug, name: d.name, nameEn: d.nameEn ?? "", shortCode: d.shortCode ?? "",
      description: d.description ?? "", facultyId: d.facultyId,
    });
  };

  const handleSubmit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return setFormError("«نام فارسی» الزامی است");
    if (!editing.id && !editing.facultyId) return setFormError("«هیأت والد» الزامی است");
    if (!editing.id && !editing.slug.trim()) return setFormError("«شناسه» الزامی است");
    setBusy(true); setFormError(null);
    try {
      const body: Record<string, unknown> = { name: editing.name.trim() };
      if (editing.nameEn.trim()) body.nameEn = editing.nameEn.trim();
      if (editing.shortCode.trim()) body.shortCode = editing.shortCode.trim();
      if (editing.description.trim()) body.description = editing.description.trim();
      if (editing.id) {
        await academicAdminApi.updateDepartment(editing.id, body);
      } else {
        body.slug = editing.slug.trim();
        body.facultyId = editing.facultyId;
        await academicAdminApi.createDepartment(body);
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
    try { await academicAdminApi.deleteDepartment(toDelete.id); setToDelete(null); await refetch(); }
    finally { setBusy(false); }
  };

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-departments">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">ساختار آکادمیک</span>
          <h1 className="h-1">گروه‌های آموزشی</h1>
          <p className="lead">سطح سوم — هر گروه ذیل یک هیأت و دربردارنده‌ی چندین برنامه‌ی آموزشی است.</p>
        </div>
        {isAdmin ? <button type="button" className="btn btn-primary" onClick={openCreate}>+ افزودن گروه</button> : null}
      </header>

      {faculties.length > 0 ? (
        <div className="admin-filter-row">
          <label htmlFor="filter-faculty" className="admin-filter-label">فیلتر بر اساس هیأت:</label>
          <select id="filter-faculty" className="admin-filter-select" value={filterFacultyId} onChange={(e) => setFilterFacultyId(e.target.value)}>
            <option value="">همه</option>
            {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      ) : null}

      {loading ? <div className="admin-loading">در حال بارگذاری…</div>
        : items.length === 0 ? <div className="admin-empty"><p>هنوز گروهی ثبت نشده است.</p></div>
        : (
          <table className="admin-table">
            <thead>
              <tr><th>نام فارسی</th><th>نام انگلیسی</th><th>کد</th><th>هیأت والد</th><th>تعداد برنامه‌ها</th>{isAdmin ? <th aria-label="عملیات" /> : null}</tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} data-department-id={d.id}>
                  <td>{d.name}</td><td>{d.nameEn ?? "—"}</td><td>{d.shortCode ?? "—"}</td>
                  <td>{d.faculty.name}</td><td>{d._count.programs}</td>
                  {isAdmin ? (
                    <td className="admin-row-actions">
                      <button type="button" className="btn-icon" onClick={() => openEdit(d)} aria-label={`ویرایش ${d.name}`}>✎</button>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => setToDelete(d)} aria-label={`حذف ${d.name}`}>🗑</button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}

      <CrudDialog open={editing != null} mode={editing?.id ? "edit" : "create"}
        title={editing?.id ? "ویرایش گروه" : "افزودن گروه جدید"}
        onClose={() => setEditing(null)} onSubmit={handleSubmit} busy={busy}>
        <FormField label="نام فارسی" name="name" value={editing?.name ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, name: v } : s)} required maxLength={160} />
        <FormField label="نام انگلیسی" name="nameEn" value={editing?.nameEn ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, nameEn: v } : s)} maxLength={160} dir="ltr" />
        {!editing?.id ? (
          <FormField label="شناسه" name="slug" value={editing?.slug ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, slug: v } : s)} required maxLength={64} dir="ltr" helper="ثابت پس از ایجاد" />
        ) : null}
        <FormField label="کد اختصاری" name="shortCode" value={editing?.shortCode ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, shortCode: v } : s)} maxLength={32} dir="ltr" />
        {!editing?.id ? (
          <SelectField label="هیأت والد" name="facultyId" value={editing?.facultyId ?? ""}
            onChange={(v) => setEditing((s) => s ? { ...s, facultyId: v } : s)}
            options={faculties.map((f) => ({ value: f.id, label: f.name }))} emptyLabel="انتخاب کنید…" required />
        ) : null}
        <FormField label="توضیحات" name="description" value={editing?.description ?? ""} onChange={(v) => setEditing((s) => s ? { ...s, description: v } : s)} maxLength={2000} />
        {formError ? <div className="crud-form-error" role="alert" style={{ marginTop: 8 }}>{formError}</div> : null}
      </CrudDialog>

      <ConfirmDelete open={toDelete != null} title="حذف گروه؟"
        body={toDelete ? `گروه «${toDelete.name}» نرم-حذف می‌شود.` : ""}
        busy={busy} onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </main>
  );
};

export default DepartmentsPage;
