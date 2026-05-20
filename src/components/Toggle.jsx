import React from "react";

export const Toggle = ({ on, onChange }) => (
  <button
    type="button"
    onClick={() => onChange?.(!on)}
    aria-pressed={!!on}
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
