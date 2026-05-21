// Phase-16 R3 — Skeleton primitive.
//
// Loading placeholder that respects prefers-reduced-motion (pulse
// is paused by the global guard in styles.css). Variants cover the
// three shapes that show up across pages:
//
//   text   — single line of text (rounded rect)
//   circle — avatar / icon placeholder
//   rect   — generic block (cards, images, video tiles)
//
// Pair this with the page-level loading state — wrap real content in
// react-query / Suspense and swap to <Skeleton/> while pending.
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export type SkeletonVariant = "text" | "circle" | "rect";

export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  variant?: SkeletonVariant;
  /** Width in CSS (`"40%"`, `"120px"`). Defaults to 100%. */
  w?: string | number;
  /** Height in CSS. Defaults vary by variant. */
  h?: string | number;
  /** Number of stacked skeleton rows (only used for variant=text). */
  lines?: number;
}

const DEFAULT_HEIGHT: Record<SkeletonVariant, string> = {
  text: "12px",
  circle: "36px",
  rect: "100px",
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "text",
  w,
  h,
  lines = 1,
  className,
  style,
  ...props
}) => {
  if (variant === "text" && lines > 1) {
    return (
      <div
        className={cn("flex flex-col gap-2", className)}
        role="status"
        aria-label="در حال بارگذاری"
        {...props}
      >
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            variant="text"
            w={i === lines - 1 ? "60%" : "100%"}
            h={h}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="در حال بارگذاری"
      className={cn(
        "block bg-[color:var(--surface-2)] motion-safe:animate-pulse",
        variant === "circle" ? "rounded-full" : "rounded-[var(--r)]",
        className,
      )}
      style={{
        width: w ?? (variant === "circle" ? DEFAULT_HEIGHT[variant] : "100%"),
        height: h ?? DEFAULT_HEIGHT[variant],
        ...style,
      }}
      {...props}
    />
  );
};
tagDisplayName(Skeleton, "Skeleton");
