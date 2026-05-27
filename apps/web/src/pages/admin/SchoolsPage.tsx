// Phase B R1 Commit G (D62) — admin SchoolsPage with full CRUD.
//
// Routes to /admin/schools, lazy-loaded in router.tsx (Commit I) so
// the chunk doesn't leak into the main bundle (D61 Constraint #2).
//
// CRUD shape:
//   • Page mount → fetch list → render table.
//   • "+ افزودن دانشکده" button → opens CrudDialog in "create" mode.
//   • Click row → opens CrudDialog in "edit" mode pre-populated.
//   • Trash icon on row → ConfirmDelete modal → POST soft-delete.
//   • All mutations refetch the list afterwards to stay consistent
//     with the server-side audit log.

import React from "react";

import { academicAdminApi } from "../../api/endpoints.js";
import { CrudDialog } from "./_shared/CrudDialog";
import { ConfirmDelete } from "./_shared/ConfirmDelete";
import { FormField } from "./_shared/FormField";
import { useRole } from "../../role";

interface School {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string | null;
  shortCode: string | null;
  description: string | null;
  iconName: string | null;
  sortOrder: number;
  charterDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { faculties: number };
}

interface FormState {
  id?: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  shortCode: string;
  description: string;
  sortOrder: string;
}

const EMPTY: FormState = {
  slug: "",
  nameFa: "",
  nameEn: "",
  shortCode: "",
  description: "",
  sortOrder: "0",
};

export const SchoolsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FormState | null>(null);
  const [toDelete, setToDelete] = React.useState<School | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await academicAdminApi.listSchools();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...EMPTY });
  };

  const openEdit = (school: School) => {
    setFormError(null);
    setEditing({
      id: school.id,
      slug: school.slug,
      nameFa: school.nameFa,
      nameEn: school.nameEn ?? "",
      shortCode: school.shortCode ?? "",
      description: school.description ?? "",
      sortOrder: String(school.sortOrder ?? 0),
    });
  };

  const handleSubmit = async () => {
    if (!editing) return;
    if (!editing.nameFa.trim()) {
      setFormError("«نام فارسی» الزامی است");
      return;
    }
    if (!editing.slug.trim()) {
      setFormError("«شناسه» الزامی است");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        nameFa: editing.nameFa.trim(),
      };
      if (editing.nameEn.trim()) body.nameEn = editing.nameEn.trim();
      if (editing.shortCode.trim()) body.shortCode = editing.shortCode.trim();
      if (editing.description.trim()) body.description = editing.description.trim();
      const so = parseInt(editing.sortOrder, 10);
      if (!Number.isNaN(so)) body.sortOrder = so;

      if (editing.id) {
        await academicAdminApi.updateSchool(editing.id, body);
      } else {
        body.slug = editing.slug.trim();
        await academicAdminApi.createSchool(body);
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
      await academicAdminApi.deleteSchool(toDelete.id);
      setToDelete(null);
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-schools">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">ساختار آکادمیک</span>
          <h1 className="h-1">دانشکده‌ها</h1>
          <p className="lead">
            بالاترین سطح ساختار آکادمیک. هر دانشکده می‌تواند چندین هیأت دانشکده‌ای زیر خود داشته باشد.
          </p>
        </div>
        {isAdmin ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + افزودن دانشکده
          </button>
        ) : null}
      </header>

      {loading ? (
        <div className="admin-loading">در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <p>هنوز دانشکده‌ای ثبت نشده است.</p>
          {isAdmin ? (
            <button type="button" className="btn btn-primary mt-3" onClick={openCreate}>
              + افزودن اولین دانشکده
            </button>
          ) : null}
        </div>
      ) : (
        <table className="admin-table" role="table">
          <thead>
            <tr>
              <th>نام فارسی</th>
              <th>نام انگلیسی</th>
              <th>کد اختصاری</th>
              <th>شناسه</th>
              <th>تعداد هیأت‌ها</th>
              {isAdmin ? <th aria-label="عملیات" /> : null}
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} data-school-id={s.id}>
                <td>{s.nameFa}</td>
                <td>{s.nameEn ?? "—"}</td>
                <td>{s.shortCode ?? "—"}</td>
                <td dir="ltr">{s.slug}</td>
                <td>{s._count.faculties}</td>
                {isAdmin ? (
                  <td className="admin-row-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => openEdit(s)}
                      aria-label={`ویرایش ${s.nameFa}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      onClick={() => setToDelete(s)}
                      aria-label={`حذف ${s.nameFa}`}
                    >
                      🗑
                    </button>
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
        title={editing?.id ? "ویرایش دانشکده" : "افزودن دانشکده جدید"}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
        busy={busy}
      >
        <FormField
          label="نام فارسی"
          name="nameFa"
          value={editing?.nameFa ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, nameFa: v } : s))}
          required
          maxLength={160}
        />
        <FormField
          label="نام انگلیسی"
          name="nameEn"
          value={editing?.nameEn ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, nameEn: v } : s))}
          maxLength={160}
          dir="ltr"
          helper="اختیاری — برای نمایش دوزبانه"
        />
        <FormField
          label="شناسه"
          name="slug"
          value={editing?.slug ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, slug: v } : s))}
          required
          maxLength={64}
          dir="ltr"
          helper="فقط حروف کوچک انگلیسی و خط تیره — مثل «stem» یا «humanities»"
        />
        <FormField
          label="کد اختصاری"
          name="shortCode"
          value={editing?.shortCode ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, shortCode: v } : s))}
          maxLength={32}
          dir="ltr"
          helper="اختیاری — مثل «STEM» یا «HUM»"
        />
        <FormField
          label="ترتیب نمایش"
          name="sortOrder"
          type="number"
          value={editing?.sortOrder ?? "0"}
          onChange={(v) => setEditing((s) => (s ? { ...s, sortOrder: v } : s))}
        />
        <FormField
          label="توضیحات"
          name="description"
          value={editing?.description ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, description: v } : s))}
          maxLength={2000}
        />
        {formError ? (
          <div className="crud-form-error" role="alert" style={{ marginTop: 8 }}>
            {formError}
          </div>
        ) : null}
      </CrudDialog>

      <ConfirmDelete
        open={toDelete != null}
        title="حذف دانشکده؟"
        body={
          toDelete
            ? `دانشکده‌ی «${toDelete.nameFa}» نرم-حذف می‌شود. ${toDelete._count.faculties > 0 ? `${toDelete._count.faculties} هیأت تحت این دانشکده، ارجاع خود را از دست می‌دهند ولی پاک نمی‌شوند.` : "تحت این دانشکده هیأتی ثبت نشده است."}`
            : ""
        }
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </main>
  );
};

export default SchoolsPage;
