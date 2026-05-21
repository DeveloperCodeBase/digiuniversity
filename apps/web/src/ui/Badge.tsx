// Phase-16 R3 — Badge primitive.
//
// Inline status pill. Pure styling component (no Radix, no behaviour).
// 6 semantic variants map onto our OKLCh palette:
//   default — soft accent surface (informational)
//   success — sage (positive)
//   warning — navy (attention, not danger)
//   danger  — gold (red-orange alert)
//   muted   — neutral surface
//   live    — accent + pulsing dot (LIVE indicator on classroom cards)
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "live";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default:
    "bg-[color:var(--accent-soft)] text-[color:var(--accent)] border-[color:var(--accent)]/20",
  success:
    "bg-[color:var(--sage-soft)] text-[color:var(--sage)] border-[color:var(--sage)]/20",
  warning:
    "bg-[color:var(--navy-soft)] text-[color:var(--navy)] border-[color:var(--navy)]/20",
  danger:
    "bg-[color:var(--gold-soft)] text-[color:var(--gold)] border-[color:var(--gold)]/20",
  muted:
    "bg-[color:var(--surface-2)] text-[color:var(--fg-mute)] border-[color:var(--line)]",
  live: "bg-[color:var(--accent)] text-[color:var(--accent-on)] border-transparent",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge(
    { variant = "default", className, children, ...props },
    ref,
  ) {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5",
          "px-2 py-0.5 rounded-full",
          "border text-[11px] font-medium leading-none",
          "font-mono tracking-wide",
          VARIANT_CLASS[variant],
          className,
        )}
        {...props}
      >
        {variant === "live" ? (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-current opacity-90 animate-pulse"
          />
        ) : null}
        {children}
      </span>
    );
  },
);
tagDisplayName(Badge, "Badge");
