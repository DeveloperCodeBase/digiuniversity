// Phase-16 R3 — Card primitive family.
//
// Composes with legacy `.card`, `.card-flat`, `.card-bordered`
// (styles.css L343+). Three variants cover every existing use:
//
//   default — gradient surface with shadow (most cards: dashboards, hero stats)
//   flat    — flat surface, smaller radius (compact list items, course rows)
//   bordered — outline only, no fill (knowledge graph nodes, ghost cards)
//
// The Header/Title/Description/Content/Footer sub-components match the
// shadcn/ui surface API so existing patterns from the audit's reference
// library translate directly. We do NOT introduce new CSS rules — the
// sub-components are layout-only divs with spacing utilities.
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export type CardVariant = "default" | "flat" | "bordered";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Optional override for the inner padding. Defaults to legacy paddings. */
  padding?: "none" | "sm" | "md" | "lg";
}

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: "card",
  flat: "card-flat",
  bordered: "card-bordered",
};

const PADDING_OVERRIDE: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "!p-0",
  sm: "!p-3",
  md: "!p-5",
  lg: "!p-7",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", padding, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        VARIANT_CLASS[variant],
        padding ? PADDING_OVERRIDE[padding] : "",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(Card, "Card");

// ----- Sub-components ----------------------------------------------

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 mb-4", className)}
      {...props}
    />
  );
});
tagDisplayName(CardHeader, "CardHeader");

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-base font-semibold leading-tight text-fg",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(CardTitle, "CardTitle");

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm leading-relaxed text-fg-mute", className)}
      {...props}
    />
  );
});
tagDisplayName(CardDescription, "CardDescription");

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props} />;
});
tagDisplayName(CardContent, "CardContent");

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-3 mt-4 pt-4 border-t border-line",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(CardFooter, "CardFooter");
