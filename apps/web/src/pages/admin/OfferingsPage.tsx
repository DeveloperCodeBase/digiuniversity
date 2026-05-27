// Phase B R2 Commit G (D65) — admin OfferingsPage with full CRUD +
// state-machine transition controls + status/mode pills.
//
// Routes to /admin/offerings, lazy-loaded in router.tsx so the chunk
// joins admin-academic.{hash}.js, not main bundle (D61 Constraint #2).
//
// Shape mirrors R1's SchoolsPage (same _shared CrudDialog +
// ConfirmDelete + FormField primitives) plus three R2-specific bits:
//   1. Status pill (SCHEDULED / OPEN / ACTIVE / COMPLETED / CANCELED)
//   2. Inline transition controls (only shows the legal next-states
//      per the same ALLOWED_TRANSITIONS map as the service layer)
//   3. Mode + capacity columns in the table
//
// State machine illegal transitions are also guarded server-side
// (400 with the allowed-from-current list); the client-side filter
// is UX prevention, not security.

import React from "react";

import { academicAdminApi } from "../../api/endpoints.js";
import { useRole } from "../../role";
import { ConfirmDelete } from "./_shared/ConfirmDelete";
import { CrudDialog } from "./_shared/CrudDialog";
import { FormField } from "./_shared/FormField";

type OfferingStatus = "SCHEDULED" | "OPEN" | "ACTIVE" | "COMPLETED" | "CANCELED";
type OfferingMode = "SYNCHRONOUS" | "ASYNCHRONOUS" | "HYBRID";

interface Offering {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string | null;
  shortCode: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  mode: OfferingMode;
  status: OfferingStatus;
  programId: string;
  legacyCohortId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { enrollments: number };
}

interface Program {
  id: string;
  slug: string;
  name: string;
}

interface FormState {
  id?: string;
  programId: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  shortCode: string;
  description: string;
  startDate: string;
  endDate: string;
  capacity: string;
  mode: OfferingMode;
}

const EMPTY_FORM: FormState = {
  programId: "",
  slug: "",
  nameFa: "",
  nameEn: "",
  shortCode: "",
  description: "",
  startDate: "",
  endDate: "",
  capacity: "",
  mode: "SYNCHRONOUS",
};

// Mirror of CourseOfferingsService.ALLOWED_TRANSITIONS. Kept in sync
// by convention — see Commit I spec assertion that backs the legality.
const ALLOWED_TRANSITIONS: Record<OfferingStatus, OfferingStatus[]> = {
  SCHEDULED: ["OPEN", "CANCELED"],
  OPEN: ["ACTIVE", "CANCELED"],
  ACTIVE: ["COMPLETED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
};

const STATUS_LABEL_FA: Record<OfferingStatus, string> = {
  SCHEDULED: "زمان‌بندی شده",
  OPEN: "ثبت‌نام باز",
  ACTIVE: "در حال برگزاری",
  COMPLETED: "پایان‌یافته",
  CANCELED: "لغو شده",
};

const MODE_LABEL_FA: Record<OfferingMode, string> = {
  SYNCHRONOUS: "همزمان",
  ASYNCHRONOUS: "ناهمزمان",
  HYBRID: "ترکیبی",
};

export const OfferingsPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<Offering[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FormState | null>(null);
  const [toDelete, setToDelete] = React.useState<Offering | null>(null);
  const [transitionTarget, setTransitionTarget] = React.useState<{ offering: Offering; to: OfferingStatus } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const [offs, progs] = await Promise.all([
        academicAdminApi.listOfferings(),
        academicAdminApi.listPrograms(),
      ]);
      setItems((offs?.data ?? []) as Offering[]);
      setPrograms((progs?.data ?? []) as Program[]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refetch(); }, [refetch]);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...EMPTY_FORM, programId: programs[0]?.id ?? "" });
  };

  const openEdit = (o: Offering) => {
    setFormError(null);
    setEditing({
      id: o.id,
      programId: o.programId,
      slug: o.slug,
      nameFa: o.nameFa,
      nameEn: o.nameEn ?? "",
      shortCode: o.shortCode ?? "",
      description: "",
      startDate: o.startDate ? o.startDate.slice(0, 10) : "",
      endDate: o.endDate ? o.endDate.slice(0, 10) : "",
      capacity: o.capacity != null ? String(o.capacity) : "",
      mode: o.mode,
    });
  };

  const handleSubmit = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        nameFa: editing.nameFa.trim(),
        nameEn: editing.nameEn.trim() || undefined,
        shortCode: editing.shortCode.trim() || undefined,
        description: editing.description.trim() || undefined,
        startDate: editing.startDate || undefined,
        endDate: editing.endDate || undefined,
        capacity: editing.capacity ? Number(editing.capacity) : undefined,
        mode: editing.mode,
      };
      if (editing.id) {
        await academicAdminApi.updateOffering(editing.id, body);
      } else {
        body.programId = editing.programId;
        body.slug = editing.slug.trim().toLowerCase();
        await academicAdminApi.createOffering(body);
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
      await academicAdminApi.deleteOffering(toDelete.id);
      setToDelete(null);
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  const handleTransition = async () => {
    if (!transitionTarget) return;
    setBusy(true);
    try {
      await academicAdminApi.transitionOffering(
        transitionTarget.offering.id,
        transitionTarget.to,
      );
      setTransitionTarget(null);
      await refetch();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      // Surface the state-machine rejection message verbatim — owner
      // explicitly asked for the «allowed from current» list to be
      // visible per D65 R2-Reminder-1 illegal-transition test.
      window.alert(typeof msg === "string" ? msg : "تغییر وضعیت با خطا مواجه شد");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-offerings">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">ساختار آکادمیک</span>
          <h1 className="h-1">دوره‌های ارائه‌شده</h1>
          <p className="lead">
            هر دوره‌ی ارائه‌شده یک ترم خاص از یک برنامه را پوشش می‌دهد. وضعیت دوره از طریق دکمه‌های زیر بین «زمان‌بندی»، «ثبت‌نام»، «اجرا» و «پایان» جابه‌جا می‌شود.
          </p>
        </div>
        {isAdmin ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + افزودن دوره‌ی ارائه‌شده
          </button>
        ) : null}
      </header>

      {loading ? (
        <div className="admin-loading">در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <p>هنوز دوره‌ی ارائه‌شده‌ای ثبت نشده است.</p>
          {isAdmin ? (
            <button type="button" className="btn btn-primary mt-3" onClick={openCreate}>
              + افزودن اولین دوره
            </button>
          ) : null}
        </div>
      ) : (
        <table className="admin-table" role="table">
          <thead>
            <tr>
              <th>نام فارسی</th>
              <th>کد</th>
              <th>وضعیت</th>
              <th>حالت برگزاری</th>
              <th>ظرفیت</th>
              <th>تاریخ شروع</th>
              <th>پیشینه</th>
              {isAdmin ? <th aria-label="عملیات" /> : null}
            </tr>
          </thead>
          <tbody>
            {items.map((o) => {
              const nextStates = ALLOWED_TRANSITIONS[o.status];
              return (
                <tr key={o.id} data-offering-id={o.id} data-status={o.status}>
                  <td>{o.nameFa}</td>
                  <td dir="ltr">{o.shortCode ?? "—"}</td>
                  <td>
                    <span className={`pill pill-status pill-${o.status.toLowerCase()}`}>
                      {STATUS_LABEL_FA[o.status]}
                    </span>
                  </td>
                  <td>{MODE_LABEL_FA[o.mode]}</td>
                  <td>{o.capacity ?? "—"}</td>
                  <td dir="ltr">{o.startDate ? o.startDate.slice(0, 10) : "—"}</td>
                  <td>
                    {o.legacyCohortId ? (
                      <span className="pill pill-legacy" title={o.legacyCohortId}>
                        از Cohort
                      </span>
                    ) : (
                      <span className="text-mute">—</span>
                    )}
                  </td>
                  {isAdmin ? (
                    <td className="admin-row-actions">
                      {nextStates.map((to) => (
                        <button
                          key={to}
                          type="button"
                          className={`btn-icon btn-transition btn-transition-${to.toLowerCase()}`}
                          onClick={() => setTransitionTarget({ offering: o, to })}
                          aria-label={`انتقال به ${STATUS_LABEL_FA[to]}`}
                          title={STATUS_LABEL_FA[to]}
                        >
                          → {STATUS_LABEL_FA[to]}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => openEdit(o)}
                        aria-label={`ویرایش ${o.nameFa}`}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={() => setToDelete(o)}
                        aria-label={`حذف ${o.nameFa}`}
                      >
                        🗑
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <CrudDialog
        open={editing != null}
        mode={editing?.id ? "edit" : "create"}
        title={editing?.id ? "ویرایش دوره‌ی ارائه‌شده" : "افزودن دوره‌ی ارائه‌شده"}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
        busy={busy}
      >
        {!editing?.id ? (
          <label className="form-field">
            <span className="form-field-label">برنامه</span>
            <select
              value={editing?.programId ?? ""}
              onChange={(e) => setEditing((s) => (s ? { ...s, programId: e.target.value } : s))}
              required
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <FormField
          label="نام فارسی"
          name="nameFa"
          value={editing?.nameFa ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, nameFa: v } : s))}
          required
          maxLength={200}
        />
        <FormField
          label="نام انگلیسی"
          name="nameEn"
          value={editing?.nameEn ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, nameEn: v } : s))}
          maxLength={200}
          dir="ltr"
          helper="اختیاری — برای نمایش دوزبانه"
        />
        {!editing?.id ? (
          <FormField
            label="شناسه"
            name="slug"
            value={editing?.slug ?? ""}
            onChange={(v) => setEditing((s) => (s ? { ...s, slug: v } : s))}
            required
            maxLength={64}
            dir="ltr"
            helper="فقط حروف کوچک انگلیسی و خط تیره — مثل «1405-fall-cs»"
          />
        ) : null}
        <FormField
          label="کد اختصاری"
          name="shortCode"
          value={editing?.shortCode ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, shortCode: v } : s))}
          maxLength={32}
          dir="ltr"
          helper="اختیاری — مثل «F1405-CS»"
        />
        <label className="form-field">
          <span className="form-field-label">حالت برگزاری</span>
          <select
            value={editing?.mode ?? "SYNCHRONOUS"}
            onChange={(e) => setEditing((s) => (s ? { ...s, mode: e.target.value as OfferingMode } : s))}
          >
            <option value="SYNCHRONOUS">{MODE_LABEL_FA.SYNCHRONOUS}</option>
            <option value="ASYNCHRONOUS">{MODE_LABEL_FA.ASYNCHRONOUS}</option>
            <option value="HYBRID">{MODE_LABEL_FA.HYBRID}</option>
          </select>
        </label>
        <FormField
          label="تاریخ شروع"
          name="startDate"
          type="date"
          value={editing?.startDate ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, startDate: v } : s))}
        />
        <FormField
          label="تاریخ پایان"
          name="endDate"
          type="date"
          value={editing?.endDate ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, endDate: v } : s))}
        />
        <FormField
          label="ظرفیت"
          name="capacity"
          type="number"
          value={editing?.capacity ?? ""}
          onChange={(v) => setEditing((s) => (s ? { ...s, capacity: v } : s))}
          helper="اختیاری — تعداد دانشجویانی که می‌توانند ثبت‌نام کنند"
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
        title="حذف دوره‌ی ارائه‌شده؟"
        body={
          toDelete
            ? `دوره‌ی «${toDelete.nameFa}» نرم-حذف می‌شود. ${toDelete.legacyCohortId ? "Cohort مرتبط نیز به‌صورت خودکار نرم-حذف می‌شود." : "ارتباط با Cohort وجود ندارد."}`
            : ""
        }
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDelete
        open={transitionTarget != null}
        title="تغییر وضعیت دوره"
        body={
          transitionTarget
            ? `وضعیت دوره‌ی «${transitionTarget.offering.nameFa}» از «${STATUS_LABEL_FA[transitionTarget.offering.status]}» به «${STATUS_LABEL_FA[transitionTarget.to]}» تغییر می‌کند. این عمل در گزارش حسابرسی ثبت می‌شود.`
            : ""
        }
        busy={busy}
        onConfirm={handleTransition}
        onCancel={() => setTransitionTarget(null)}
      />
    </main>
  );
};

export default OfferingsPage;
