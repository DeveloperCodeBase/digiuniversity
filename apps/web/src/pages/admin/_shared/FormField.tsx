// Phase B R1 Commit F (D62) — shared FormField primitive used by all
// 4 admin academic pages. RTL-aware label-above-input layout with
// optional helper text + error message slot. Keeps each page's form
// JSX compact + consistent visually.

import React from "react";

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  dir?: "rtl" | "ltr" | "auto";
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  helper,
  error,
  required = false,
  maxLength,
  dir,
}) => {
  const id = `admin-field-${name}`;
  return (
    <div className={"crud-form-field" + (error ? " has-error" : "")}>
      <label htmlFor={id} className="crud-form-label">
        {label}
        {required ? <span className="required-mark"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        dir={dir}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          error ? `${id}-error` : helper ? `${id}-helper` : undefined
        }
        className="crud-form-input"
      />
      {helper && !error ? (
        <div id={`${id}-helper`} className="crud-form-helper">
          {helper}
        </div>
      ) : null}
      {error ? (
        <div id={`${id}-error`} className="crud-form-error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
};

// SelectField: same shape, but for FK pickers (e.g., schoolId on Faculty).
interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  emptyLabel?: string;  // "(بدون دانشکده)" for an empty / detach option
  helper?: string;
  error?: string;
  required?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  emptyLabel,
  helper,
  error,
  required = false,
}) => {
  const id = `admin-select-${name}`;
  return (
    <div className={"crud-form-field" + (error ? " has-error" : "")}>
      <label htmlFor={id} className="crud-form-label">
        {label}
        {required ? <span className="required-mark"> *</span> : null}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        className="crud-form-input"
      >
        {emptyLabel != null ? <option value="">{emptyLabel}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {helper && !error ? (
        <div id={`${id}-helper`} className="crud-form-helper">
          {helper}
        </div>
      ) : null}
      {error ? (
        <div id={`${id}-error`} className="crud-form-error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
};
