// Phase B R1 Commit H (D62) — admin FacultiesPage with full CRUD +
// schoolId FK picker. Same shape as SchoolsPage but adds:
//   • SelectField for parent School
//   • ?schoolId= filter chip if query param present
//   • Server-side school existence check is handled by Commit C — UI
//     just surfaces the BadRequest message.

import React from "react";

import { academicAdminApi } from "../../api/endpoints.js";
import { CrudDialog } from "./_shared/CrudDialog";
import { ConfirmDelete } from "./_shared/ConfirmDelete";
import { FormField, SelectField } from "./_shared/FormField";
import { useRole } from "../../role";

interface Faculty {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  shortCode: string | null;
  description: string | null;
  schoolId: string | null;
  school: { id: string; slug: string; nameFa: string; shortCode: string | null } | null;
  createdAt: string;
  updatedAt: string;
  _count: { departments: number };
}

interface SchoolOption {
  id: string;
  nameFa: string;
  shortCode: string | null;
}

interface FormState {
  id?: string;
  slug: string;
  name: string;
  nameEn: string;
  shortCode: string;
  description: string;
  schoolId: string;
}

const EMPTY: FormState = {
  slug: "",
  name: "",
  nameEn: "",
  shortCode: "",
  description: "",
  schoolId: "",
};

export const FacultiesPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<Faculty[]>([]);
  const [schools, setSchools] = React.useState<SchoolOption[]>([]);
  const [filterSchoolId, setFilterSchoolId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FormState | null>(null);
  const [toDelete, setToDelete] = React.useState<Faculty | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const [faculties, schoolList] = await Promise.all([
        academicAdminApi.listFaculties(filterSchoolId ? { schoolId: filterSchoolId } : {}),
        academicAdminApi.listSchools(),
      ]);
      setItems(faculties);
      setSchools(
        schoolList.map((s: { id: string; nameFa: string; shortCode: string | null }) => ({
          id: s.id,
          nameFa: s.nameFa,
          shortCode: s.shortCode,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [filterSchoolId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...EMPTY, schoolId: filterSchoolId });
  };
  const openEdit = (f: Faculty) => {
    setFormError(null);
    setEditing({
      id: f.id,
      slug: f.slug,
      name: f.name,
      nameEn: f.nameEn ?? "",
      shortCode: f.shortCode ?? "",
      description: f.description ?? "",
      schoolId: f.schoolId ?? "",
    });
  };

  const handleSubmit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setFormError("«نام فارسی» الزامی است");
      return;
    }
    if (!editing.slug.trim() && !editing.id) {
      setFormError("«شناسه» الزامی است");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        name: editing.name.trim(),
      };
      if (editing.nameEn.trim()) body.nameEn = editing.nameEn.trim();
      if (editing.shortCode.trim()) body.shortCode = editing.shortCode.trim();
      if (editing.description.trim()) body.description = editing.description.trim();
      // schoolId: "" → null (detach) on PATCH; required to send empty string explicitly.
      if (editing.id) {
        if (editing.schoolId !== undefined) body.schoolId = editing.schoolId;
        await academicAdminApi.updateFaculty(editing.id, body);
      } else {
        body.slug = editing.slug.trim();
        if (editing.schoolId) body.schoolId = editing.schoolId;
        await academicAdminApi.createFaculty(body);
      }
      setEditing(null);
      await refetch();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(typeof msg === "string" ? msg : "ذخیره با خطا مواجه شد");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await academicAdminApi.deleteFaculty(toDelete.id);
      setToDelete(null);
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-faculties">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">ساختار آکادمیک</span>
          <h1 className="h-1">هیأت‌های دانشکده‌ای</h1>
          <p className="lead">سطح دوم — هر هیأت ذیل یک دانشکده قرار می‌گیرد و چندین گروه را در بر دارد.</p>
        </div>
        {isAdmin ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + افزودن هیأت
          </button>
        ) : null}
      </header>

      {schools.length > 0 ? (
        <div className="admin-filter-row">
          <label htmlFor="filter-school" className="admin-filter-label">
            فیلتر بر اساس دانشکده:
          </label>
          <select
            id="filter-school"
            className="admin-filter-select"
            value={filterSchoolId}
            onChange={(e) => setFilterSchoolId(e.target.value)}
          >
            <option value="">همه</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.nameFa}</option>
            ))}
          </select>
        </div>
      ) : null}

      {loading ? (
        <div className="admin-loading">در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <p>هنوز هیأتی ثبت نشده است.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>نام فارسی</th>
              <th>نام انگلیسی</th>
              <th>کد اختصاری</th>
              <th>دانشکده</th>
              <th>تعداد گروه‌ها</th>
              {isAdmin ? <th aria-label="عملیات" /> : null}
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} data-faculty-id={f.id}>
                <td>{f.name}</td>
                <td>{f.nameEn ?? "—"}</td>
                <td>{f.shortCode ?? "—"}</td>
                <td>{f.school ? f.school.nameFa : <span className="text-mute">(بدون دانشکده)</span>}</td>
                <td>{f._count.departments}</td>
                {isAdmin ? (
                  <td className="admin-row-actions">
                    <button type="button" className="btn-icon" onClick={() => openEdit(f)} aria-label={`ویرایش ${f.name}`}>✎</button>
                    <button type="button" className="btn-icon btn-icon-danger" onClick={() => setToDelete(f)} aria-label={`حذف ${f.name}`}>🗑</button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CrudDialog
        open={editing != null}
        mode={editing?.id ? "edit" : "create"}
        title={editing?.id ? "ویرایش هیأت" : "افزودن هیأت جدید"}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
        busy={busy}
      >
        <FormField label="نام فارسی" name="name" value={editing?.name ?? ""} onChange={(v) => setEditing((s) => (s ? { ...s, name: v } : s))} required maxLength={160} />
        <FormField label="نام انگلیسی" name="nameEn" value={editing?.nameEn ?? ""} onChange={(v) => setEditing((s) => (s ? { ...s, nameEn: v } : s))} maxLength={160} dir="ltr" />
        {!editing?.id ? (
          <FormField label="شناسه" name="slug" value={editing?.slug ?? ""} onChange={(v) => setEditing((s) => (s ? { ...s, slug: v } : s))} required maxLength={64} dir="ltr" helper="ثابت پس از ایجاد" />
        ) : null}
        <FormField label="کد اختصاری" name="shortCode" value={editing?.shortCode ?? ""} onChange={(v) => setEditing((s) => (s ? { ...s, shortCode: v } : s))} maxLength={32} dir="ltr" />
        <SelectField
          label="دانشکده والد"
          name="schoolId"
          value={editing?.schoolId ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, schoolId: v } : s))}
          options={schools.map((s) => ({ value: s.id, label: s.nameFa }))}
          emptyLabel="(بدون دانشکده)"
          helper="اختیاری — هیأت می‌تواند بدون دانشکده‌ی والد هم وجود داشته باشد"
        />
        <FormField label="توضیحات" name="description" value={editing?.description ?? ""} onChange={(v) => setEditing((s) => (s ? { ...s, description: v } : s))} maxLength={2000} />
        {formError ? <div className="crud-form-error" role="alert" style={{ marginTop: 8 }}>{formError}</div> : null}
      </CrudDialog>

      <ConfirmDelete
        open={toDelete != null}
        title="حذف هیأت؟"
        body={toDelete ? `هیأت «${toDelete.name}» نرم-حذف می‌شود. ${toDelete._count.departments > 0 ? `${toDelete._count.departments} گروه ذیل آن نیز قابل دسترسی نخواهد بود تا بازیابی شود.` : ""}` : ""}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </main>
  );
};

export default FacultiesPage;
