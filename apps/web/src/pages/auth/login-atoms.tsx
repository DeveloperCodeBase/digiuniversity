// Phase-A R5 — Atomic components for the redesigned login page.
// Typed adapter of docs/my-upload/login/LoginPage.tsx atoms. Inline-style
// heavy by design (matches the template); CSS lives only in the few
// keyframes + the responsive media queries (see PageStyles export).
import React from "react";

// ---- Icon ----------------------------------------------------------------

export interface IconProps {
  d: string;
  size?: number;
  stroke?: number;
}

export const Icon: React.FC<IconProps> = ({ d, size = 18, stroke = 1.6 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

// ---- Field (label + input + hint + error) -------------------------------

export interface FieldProps {
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  rightAdornment?: React.ReactNode;
  error?: string;
}

export const Field: React.FC<FieldProps> = ({ label, hint, required, children, rightAdornment, error }) => (
  <label style={{ display: "block" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: "var(--r5-ink-2)", fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: "var(--r5-danger)", marginInlineStart: 4 }}>*</span>}
      </span>
      {hint}
    </div>
    <div style={{ position: "relative" }}>
      {children}
      {rightAdornment}
    </div>
    {error && <div style={{ marginTop: 6, fontSize: 12, color: "var(--r5-danger)" }}>{error}</div>}
  </label>
);

// ---- TextInput -----------------------------------------------------------

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading icon SVG path. */
  icon?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ icon, style, ...rest }) => {
  return (
    <div style={{ position: "relative" }}>
      <input
        {...rest}
        style={{
          width: "100%",
          padding: icon ? "13px 44px 13px 16px" : "13px 16px",
          fontSize: 15,
          background: "var(--r5-paper)",
          border: "1px solid var(--r5-line-strong)",
          borderRadius: 12,
          transition: "box-shadow 200ms ease, border-color 200ms ease, background 200ms ease",
          color: "var(--r5-ink)",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--r5-sage-deep)";
          e.currentTarget.style.boxShadow = "0 0 0 4px color-mix(in oklch, var(--r5-sage) 25%, transparent)";
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--r5-line-strong)";
          e.currentTarget.style.boxShadow = "none";
          rest.onBlur?.(e);
        }}
      />
      {icon && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            insetInlineEnd: 14,
            transform: "translateY(-50%)",
            color: "var(--r5-muted)",
            pointerEvents: "none",
          }}
        >
          <Icon d={icon} size={18} />
        </div>
      )}
    </div>
  );
};

// ---- Checkbox ------------------------------------------------------------

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, hint }) => (
  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
    {/* R7.3 B.1 — was a `<span role="checkbox" tabindex="0">` with no
        accessible name (Lighthouse + axe both flag `aria-toggle-field-name`).
        Although the `<label>` wraps the span, screen readers reading the
        span as a focusable checkbox don't follow the label-text association
        reliably. Adding aria-label tied to the prop's `label` string makes
        the accessible name explicit. Native `<input type="checkbox">` would
        be cleaner but requires re-wiring the custom visual — deferred to
        Phase B form-primitives sub-R. */}
    <span
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      onClick={() => onChange(!checked)}
      style={{
        marginTop: 2,
        width: 20,
        height: 20,
        borderRadius: 6,
        background: checked ? "var(--r5-ink)" : "var(--r5-paper)",
        border: `1px solid ${checked ? "var(--r5-ink)" : "var(--r5-line-strong)"}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--r5-paper)",
        transition: "all 180ms ease",
        flexShrink: 0,
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: checked ? "scale(1)" : "scale(0)",
          transition: "transform 200ms cubic-bezier(.22,1.4,.4,1)",
        }}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 14, color: "var(--r5-ink-2)" }}>{label}</span>
      {hint && <span style={{ fontSize: 12, color: "var(--r5-muted)" }}>{hint}</span>}
    </span>
  </label>
);

// ---- Eyebrow -------------------------------------------------------------

export interface EyebrowProps { text: string; subtext?: string }

export const Eyebrow: React.FC<EyebrowProps> = ({ text, subtext }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: "var(--r5-mono)",
      fontSize: 11,
      color: "var(--r5-muted)",
      letterSpacing: "0.22em",
    }}
  >
    <span style={{ width: 28, height: 1, background: "var(--r5-line-strong)" }} />
    <span>
      {text}
      {subtext ? ` · ${subtext}` : ""}
    </span>
  </div>
);

// ---- PillButton ----------------------------------------------------------

export interface PillButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}

export const PillButton: React.FC<PillButtonProps> = ({ children, onClick, ariaLabel }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    style={{
      width: 36,
      height: 36,
      borderRadius: 999,
      background: "var(--r5-paper)",
      border: "1px solid var(--r5-line)",
      color: "var(--r5-ink-2)",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 160ms ease, transform 160ms ease",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--r5-bg-2)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--r5-paper)"; }}
  >
    {children}
  </button>
);

// ---- Wordmark ------------------------------------------------------------

export const Wordmark: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div
      aria-hidden
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "var(--r5-ink)",
        color: "var(--r5-paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: "-0.02em",
      }}
    >
      د.
    </div>
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--r5-ink)" }}>دانشگاه برخط هوشمند ایران</span>
      <span
        style={{
          marginTop: 4,
          fontSize: 10,
          fontFamily: "var(--r5-mono)",
          color: "var(--r5-muted)",
          letterSpacing: "0.18em",
        }}
      >
        AI · NATIVE · LEARNING
      </span>
    </div>
  </div>
);

// ---- Spinner -------------------------------------------------------------

export const Spinner: React.FC = () => (
  <span
    style={{
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: "2px solid color-mix(in oklch, var(--r5-paper) 40%, transparent)",
      borderTopColor: "var(--r5-paper)",
      display: "inline-block",
      animation: "r5-spin 800ms linear infinite",
    }}
  />
);

// ---- PassStrength --------------------------------------------------------

export interface PassStrengthProps { value: string }

export const PassStrength: React.FC<PassStrengthProps> = ({ value }) => {
  const score = React.useMemo<number>(() => {
    let s = 0;
    if (value.length >= 6) s++;
    if (value.length >= 10) s++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) s++;
    if (/\d/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return Math.min(s, 4);
  }, [value]);
  if (!value) return null;
  const labels = ["خیلی ضعیف", "ضعیف", "متوسط", "قوی", "خیلی قوی"];
  const colors = ["#a64837", "#c4783a", "#b88a3a", "#7a8f4e", "#4a7a4e"];
  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 3, flex: 1 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < score ? colors[score] : "var(--r5-line)",
              transition: "background 240ms ease",
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: 11,
          fontFamily: "var(--r5-mono)",
          color: colors[score],
          letterSpacing: "0.04em",
          minWidth: 70,
          textAlign: "start",
        }}
      >
        {labels[score]}
      </span>
    </div>
  );
};

// ---- SsoButton -----------------------------------------------------------

export interface SsoButtonProps {
  label: string;
  hint?: string;
  glyph: React.ReactNode;
  onClick?: () => void;
}

export const SsoButton: React.FC<SsoButtonProps> = ({ label, hint, glyph, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      background: "var(--r5-paper)",
      border: "1px solid var(--r5-line-strong)",
      borderRadius: 12,
      padding: "11px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: "pointer",
      color: "var(--r5-ink)",
      transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      minWidth: 0,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 6px 18px -8px rgba(0,0,0,.25)";
      e.currentTarget.style.borderColor = "var(--r5-sage-deep)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "none";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "var(--r5-line-strong)";
    }}
  >
    <span style={{ display: "inline-flex", width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
      {glyph}
    </span>
    <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, alignItems: "flex-start" }}>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</span>
      {hint && <span style={{ fontSize: 10.5, color: "var(--r5-muted)", marginTop: 2 }}>{hint}</span>}
    </span>
  </button>
);

export const GoogleGlyph: React.ReactElement = (
  <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92A8.8 8.8 0 0 0 17.64 9.2Z" />
    <path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.92-2.26a5.4 5.4 0 0 1-8.04-2.83H.92v2.34A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.96 10.73a5.4 5.4 0 0 1 0-3.46V4.93H.92a9 9 0 0 0 0 8.14l3.04-2.34Z" />
    <path fill="#EA4335" d="M9 3.58a4.9 4.9 0 0 1 3.46 1.35l2.59-2.59A8.7 8.7 0 0 0 9 0 9 9 0 0 0 .92 4.93l3.04 2.34A5.4 5.4 0 0 1 9 3.58Z" />
  </svg>
);

export const NationalGlyph: React.ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 3 4 6v5c0 5 3.4 9 8 10 4.6-1 8-5 8-10V6l-8-3Z" />
    <path d="m8.5 12 2.4 2.4L15.5 10" />
  </svg>
);

export const OrgGlyph: React.ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="6" width="8" height="14" rx="1.4" />
    <rect x="13" y="3" width="8" height="17" rx="1.4" />
    <path d="M6 10h2M6 14h2M16 7h2M16 11h2M16 15h2" />
  </svg>
);

// ---- DemoBox -------------------------------------------------------------

export interface DemoBoxProps {
  onFill: () => void;
  roleLabel: string;
  email: string;
  password: string;
}

export const DemoBox: React.FC<DemoBoxProps> = ({ onFill, roleLabel, email, password }) => (
  <div
    style={{
      background: "var(--r5-ink)",
      color: "var(--r5-paper)",
      borderRadius: 14,
      padding: "14px 16px",
      fontFamily: "var(--r5-mono)",
      fontSize: 12.5,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background:
          "repeating-linear-gradient(45deg, rgba(255,255,255,.02) 0 8px, transparent 8px 16px)",
        pointerEvents: "none",
      }}
    />
    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ background: "var(--r5-gold)", color: "var(--r5-ink)", padding: "2px 6px", borderRadius: 4, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>
          DEMO
        </span>
        <span style={{ opacity: 0.75 }}>حساب نمایشی برای {roleLabel}</span>
      </div>
      <button
        type="button"
        onClick={onFill}
        style={{
          background: "color-mix(in oklch, var(--r5-paper) 15%, transparent)",
          color: "var(--r5-paper)",
          border: "1px solid color-mix(in oklch, var(--r5-paper) 25%, transparent)",
          borderRadius: 8,
          padding: "4px 10px",
          fontFamily: "var(--r5-mono)",
          fontSize: 11,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        پر کردن خودکار ←
      </button>
    </div>
    <div style={{ position: "relative", display: "grid", gap: 4, opacity: 0.92 }}>
      <div>
        <span style={{ opacity: 0.5 }}>email · </span>
        {email}
      </div>
      <div>
        <span style={{ opacity: 0.5 }}>pass &nbsp;· </span>
        {password}
      </div>
    </div>
  </div>
);

// ---- useToast (R5-scoped, distinct from global window.toast) ------------

export interface UseToastReturn {
  node: React.ReactNode;
  show: (msg: string) => void;
}

export const useR5Toast = (): UseToastReturn => {
  const [msg, setMsg] = React.useState<string | null>(null);
  const tid = React.useRef<number>(0);
  const show = React.useCallback((m: string): void => {
    setMsg(m);
    if (typeof window !== "undefined") {
      window.clearTimeout(tid.current);
      tid.current = window.setTimeout(() => setMsg(null), 2800);
    }
  }, []);
  const node = (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        insetInlineStart: 24,
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "var(--r5-ink)",
          color: "var(--r5-paper)",
          padding: "11px 18px",
          borderRadius: 999,
          fontSize: 13.5,
          fontWeight: 500,
          boxShadow: "0 12px 32px -8px rgba(0,0,0,.4)",
          transform: msg ? "translateY(0)" : "translateY(20px)",
          opacity: msg ? 1 : 0,
          transition: "all 320ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        {msg || " "}
      </div>
    </div>
  );
  return { node, show };
};
