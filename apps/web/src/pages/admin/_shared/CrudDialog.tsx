// Phase B R1 Commit F (D62) — shared CRUD dialog used by all 4 admin
// academic pages (SchoolsPage, FacultiesPage, DepartmentsPage,
// ProgramsPage). Extracted to avoid 4× duplication of the same modal
// shape. Keeps the per-page page files small + lets us evolve the
// dialog UX (validation toast, keyboard a11y, RTL form layout) in one
// place.
//
// Pattern:
//   <CrudDialog
//     open={editing != null}
//     mode={editing?.id ? "edit" : "create"}
//     title="..."
//     onClose={() => setEditing(null)}
//     onSubmit={async (data) => { await api.create/update(...); refetch(); }}
//   >
//     <FormField label="نام فارسی" ... />
//     <FormField label="نام انگلیسی" ... />
//   </CrudDialog>

import React from "react";

interface CrudDialogProps {
  open: boolean;
  mode: "create" | "edit";
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  busy?: boolean;
  children: React.ReactNode;
}

export const CrudDialog: React.FC<CrudDialogProps> = ({
  open,
  mode,
  title,
  onClose,
  onSubmit,
  busy = false,
  children,
}) => {
  // Close on Escape for keyboard a11y.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;
  const submitLabel = mode === "create" ? "ایجاد" : "ذخیره";

  return (
    <>
      <div
        className="crud-dialog-backdrop"
        onClick={() => !busy && onClose()}
        aria-hidden="true"
      />
      <div
        className="crud-dialog"
        role="dialog"
        aria-labelledby="crud-dialog-title"
        aria-modal="true"
      >
        <header className="crud-dialog-header">
          <h2 id="crud-dialog-title" className="h-3">
            {title}
          </h2>
          <button
            type="button"
            className="crud-dialog-close"
            onClick={onClose}
            disabled={busy}
            aria-label="بستن"
          >
            ×
          </button>
        </header>
        <form
          className="crud-dialog-body"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) Promise.resolve(onSubmit());
          }}
        >
          <div className="crud-dialog-fields">{children}</div>
          <footer className="crud-dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={busy}
            >
              انصراف
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "..." : submitLabel}
            </button>
          </footer>
        </form>
      </div>
    </>
  );
};
