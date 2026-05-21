// Phase-16 R3 — Textarea primitive.
//
// Multiline counterpart to <Input>. Shares the same OKLCh + a11y
// treatment. Auto-resize is deliberately NOT built in — most uses are
// in modal forms with fixed dimensions and auto-resize fights with
// layout. Add a separate <AutoResizeTextarea> later if needed.
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  describedBy?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, invalid, describedBy, rows = 4, ...props },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-invalid={invalid || undefined}
        className={cn(
          "block w-full px-3.5 py-2.5",
          "bg-[color:var(--surface)] text-[color:var(--fg)]",
          "border border-[color:var(--line-2)] rounded-[var(--r)]",
          "font-sans text-[14px] leading-relaxed resize-y",
          "placeholder:text-[color:var(--fg-dim)]",
          "focus:outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "data-[invalid=true]:border-[color:var(--gold)] data-[invalid=true]:focus:ring-[color:var(--gold)]/30",
          "transition-colors duration-150",
          className,
        )}
        {...props}
      />
    );
  },
);
tagDisplayName(Textarea, "Textarea");
