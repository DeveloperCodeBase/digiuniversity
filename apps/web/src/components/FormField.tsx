// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import React from "react";

export const FormField = ({ label, placeholder, mono, value, onChange, hint, type = "text", required, error }) => (
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
