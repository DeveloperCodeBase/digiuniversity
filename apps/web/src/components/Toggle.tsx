// Phase-A R2.1 — typed. Binary on/off pill toggle (controlled).
import React from "react";

export interface ToggleProps {
  on: boolean;
  onChange?: (next: boolean) => void;
  /**
   * R7.7d — accessible name for screen readers. Defaults to a generic
   * Persian label if not supplied, so the Toggle never trips axe's
   * `button-name` rule (was a Gate A §2 critical residual). Call sites
   * SHOULD pass a contextual label (e.g., the policy name, the setting
   * name) for better SR experience — Phase B settings-polish will sweep
   * the un-labeled callers.
   */
  label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ on, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange?.(!on)}
    aria-pressed={!!on}
    aria-label={label || "تغییر وضعیت"}
    className="p-0 cursor-pointer rounded-full relative border-none transition-colors"
    style={{
      width: 38,
      height: 22,
      background: on ? "var(--accent)" : "var(--surface-3)",
    }}
  >
    <span
      className="toggle-knob absolute rounded-full"
      style={{
        top: 2,
        [on ? "left" : "right"]: 2,
        width: 18,
        height: 18,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }}
    />
  </button>
);

export default Toggle;
