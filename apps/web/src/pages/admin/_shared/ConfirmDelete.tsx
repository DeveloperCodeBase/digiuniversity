// Phase B R1 Commit F (D62) — confirm-soft-delete modal shared by all
// 4 admin academic pages. Distinct from CrudDialog (which submits a
// form); this is a yes/no danger dialog with a warning message.

import React from "react";

interface ConfirmDeleteProps {
  open: boolean;
  title: string;
  body: string;
  busy?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
  open,
  title,
  body,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <>
      <div
        className="crud-dialog-backdrop"
        onClick={() => !busy && onCancel()}
        aria-hidden="true"
      />
      <div
        className="crud-dialog crud-dialog-confirm"
        role="alertdialog"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-body"
        aria-modal="true"
      >
        <header className="crud-dialog-header">
          <h2 id="confirm-delete-title" className="h-3">
            {title}
          </h2>
        </header>
        <div className="crud-dialog-body">
          <p id="confirm-delete-body" className="crud-dialog-warning">
            {body}
          </p>
          <footer className="crud-dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={busy}
            >
              انصراف
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => Promise.resolve(onConfirm())}
              disabled={busy}
            >
              {busy ? "..." : "حذف"}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
};
