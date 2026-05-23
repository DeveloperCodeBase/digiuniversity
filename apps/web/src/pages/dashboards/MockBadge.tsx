// Phase-A R3 — MockBadge.
// Every widget that renders mock/seed data must show this badge so the
// visitor sees `نمونه` and knows the value isn't yet wired to the api.
// Per the Phase-A external-dependency policy (D-stub-strategy): "every
// mock response carries source: 'mock' so the frontend renders a visible
// 'نمونه' badge."
import React from "react";

export interface MockBadgeProps {
  /**
   * Optional override text. Defaults to "نمونه".
   * When the api ships and the same widget reads real data, the badge
   * call is removed instead of being hidden — no silent fallback.
   */
  label?: string;
  /** Smaller variant for inline use beside numbers/headings. */
  size?: "sm" | "md";
}

export const MockBadge: React.FC<MockBadgeProps> = ({ label = "نمونه", size = "md" }) => {
  const isSmall = size === "sm";
  return (
    <span
      data-mock="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: isSmall ? "2px 6px" : "3px 8px",
        background: "color-mix(in oklch, var(--gold, #d4a341) 22%, var(--surface))",
        border: "1px solid color-mix(in oklch, var(--gold, #d4a341) 45%, transparent)",
        color: "var(--gold, #b88a3a)",
        borderRadius: 999,
        fontFamily: "var(--f-mono)",
        fontSize: isSmall ? 9 : 10,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
      title="این داده از API نمی‌آید — مقدار نمونه است"
    >
      <span
        aria-hidden="true"
        style={{
          width: isSmall ? 4 : 5,
          height: isSmall ? 4 : 5,
          borderRadius: 50,
          background: "currentColor",
        }}
      />
      {label}
    </span>
  );
};

export default MockBadge;
