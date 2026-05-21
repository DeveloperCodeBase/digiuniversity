// Phase-16 R3 — Input primitive.
//
// Standalone input element themed with OKLCh tokens. Pairs with
// <Label> (Label.tsx) for accessible field composition. For full
// field semantics (label + input + error + help text), use the
// react-hook-form patterns documented in Storybook stories — we
// intentionally don't bake those into the primitive so it stays
// composable.
//
// A11y:
//   - 44 px min touch target (mobile WCAG 2.5.5)
//   - aria-invalid wired to `invalid` prop
//   - placeholder uses --fg-dim so it meets 3:1 contrast (not 4.5:1
//     — placeholder is not a label, just a hint)
//   - focus ring uses --accent with 2px outline
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Mark the field as invalid (red border + ring). Sets aria-invalid. */
  invalid?: boolean;
  /** ID of the element describing this field's error (`aria-describedby`). */
  describedBy?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, invalid, describedBy, type = "text", ...props },
    ref,
  ) {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-invalid={invalid || undefined}
        className={cn(
          // Layout + sizing — 44px min for WCAG touch target
          "block w-full min-h-[44px] px-3.5 py-2.5",
          // Surface
          "bg-[color:var(--surface)] text-[color:var(--fg)]",
          // Border + radius
          "border border-[color:var(--line-2)] rounded-[var(--r)]",
          // Type
          "font-sans text-[14px] leading-normal",
          // Placeholder
          "placeholder:text-[color:var(--fg-dim)]",
          // Focus
          "focus:outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30",
          // Disabled
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Invalid
          "data-[invalid=true]:border-[color:var(--gold)] data-[invalid=true]:focus:ring-[color:var(--gold)]/30",
          // Transition
          "transition-colors duration-150",
          className,
        )}
        {...props}
      />
    );
  },
);
tagDisplayName(Input, "Input");
