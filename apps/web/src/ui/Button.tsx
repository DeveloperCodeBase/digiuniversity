// Phase-16 R3 — Button primitive.
//
// Composes with the existing `.btn` family in styles.css (lines 292+),
// so the visual identity is unchanged: new pages get a typed React API
// + accessibility + asChild composition, existing pages keep their
// ad-hoc `<button className="btn btn-primary">` and look identical.
//
// Variants map 1:1 to existing CSS classes:
//   primary   → .btn .btn-primary
//   secondary → .btn .btn-amber (legacy name; warm accent)
//   ghost     → .btn .btn-ghost
//   outline   → .btn .btn-outline
//   ink       → .btn .btn-ink  (high-contrast dark fill, rare use)
//   danger    → custom (not in legacy CSS) — derived from --gold/--rose
//
// Sizes map to .btn / .btn-sm / .btn-lg.
//
// Composition via @radix-ui/react-slot lets consumers do
// `<Button asChild><Link to="/x">...</Link></Button>` so the button
// keeps its styling but the rendered element is whatever child
// provides — invaluable for routing-anchor use-cases.
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn, tagDisplayName } from "./utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "ink"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-amber",
  ghost: "btn btn-ghost",
  outline: "btn btn-outline",
  ink: "btn btn-ink",
  // Danger uses inline OKLCh utilities — there is no .btn-danger in
  // legacy CSS yet. Keeps the gold/rose semantic colour available
  // without sprinkling another class into styles.css. Token-only,
  // no hardcoded hex.
  danger:
    "btn !bg-[color:var(--gold)] !text-white !border-transparent hover:!bg-[color:oklch(0.45_0.18_30)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
  icon: "btn-sm !p-0 !w-10 !h-10 justify-center", // 40-px touch target on mobile
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render as the child element via Radix Slot (e.g. wrap a <Link>). */
  asChild?: boolean;
  /** When true, render the spinner + disable the button. */
  loading?: boolean;
  /** Optional left icon (rendered before children, RTL-aware via flow). */
  leftIcon?: React.ReactNode;
  /** Optional right icon (rendered after children). */
  rightIcon?: React.ReactNode;
}

/**
 * Touchable Button. Always at least 40×40 (size=icon) or sized from
 * legacy `.btn` paddings (40px+ in practice). Persian copy renders RTL
 * correctly because `.btn` uses `font-family: inherit` and the parent
 * `<html dir="rtl">` flips the flex direction implicitly.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    const Comp: React.ElementType = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        className={cn(
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          loading && "opacity-70 cursor-wait",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {loading ? (
          <ButtonSpinner />
        ) : leftIcon ? (
          <span className="inline-flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        {children}
        {!loading && rightIcon ? (
          <span className="inline-flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        ) : null}
      </Comp>
    );
  },
);
tagDisplayName(Button, "Button");

const ButtonSpinner: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    aria-hidden="true"
    style={{ animation: "auth-loading-spin 0.9s linear infinite" }}
  >
    <circle
      cx="7"
      cy="7"
      r="5"
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="1.8"
    />
    <circle
      cx="7"
      cy="7"
      r="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeDasharray="10 22"
      transform="rotate(-90 7 7)"
    />
  </svg>
);
