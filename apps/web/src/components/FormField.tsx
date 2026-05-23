// Phase-A R2.1 — typed. Label + input + optional hint/error row.
import React from "react";

export interface FormFieldProps {
  label: React.ReactNode;
  placeholder?: string;
  /** If true, the input uses the mono font family (for IDs, codes). */
  mono?: boolean;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Hint shown when no error is present. */
  hint?: React.ReactNode;
  /** Native input type (text/email/password/...). */
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  /** Error message; when set, replaces the hint and tints the border. */
  error?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  mono,
  value,
  onChange,
  hint,
  type = "text",
  required,
  error,
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="font-mono uppercase text-[10px] text-fg-mute tracking-widest">
      {label}{required && <span className="text-rose me-1"> *</span>}
    </span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      aria-invalid={error ? "true" : undefined}
      className="rounded-xl w-full"
      style={{
        padding: "10px 14px",
        background: "var(--surface)",
        border: "1px solid " + (error ? "var(--rose)" : "var(--line-2)"),
        fontFamily: mono ? "var(--f-mono)" : "inherit",
        fontSize: 14,
      }}
    />
    {hint && !error && <span className="text-[11px] text-fg-mute">{hint}</span>}
    {error && <span className="text-[12px] text-rose mt-1">{error}</span>}
  </label>
);

export default FormField;
