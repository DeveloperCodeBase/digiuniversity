// Phase-16 R3 — EmptyState primitive.
//
// What "no data here" should look like for every empty list in the
// app: empty courses, empty notifications, empty messages, empty
// assignments, empty audit log. Always shows icon + title + body +
// optional CTA.
//
// One source of truth means the user never wonders "is this an error
// or is there just nothing here?" — the visual signature is the same.
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export interface EmptyStateProps
  // Omit the native `title` attribute (string tooltip) so we can give
  // it a React-node type for the visible heading.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Icon node (SVG / Icon component). Centered above title. */
  icon?: React.ReactNode;
  /** Required short title (Persian display text). */
  title: React.ReactNode;
  /** Optional body copy — explain why it's empty + what the user can do. */
  body?: React.ReactNode;
  /** Optional CTA — primary action when there's something the user can do. */
  cta?: React.ReactNode;
  /** Visual density. Default = comfortable; compact for in-card empties. */
  density?: "compact" | "comfortable";
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    { icon, title, body, cta, density = "comfortable", className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          "flex flex-col items-center text-center",
          density === "compact" ? "gap-2 py-6" : "gap-4 py-12",
          className,
        )}
        {...props}
      >
        {icon ? (
          <div
            aria-hidden="true"
            className={cn(
              "flex items-center justify-center rounded-full",
              "bg-[color:var(--surface-2)] text-[color:var(--fg-mute)]",
              density === "compact" ? "w-10 h-10" : "w-14 h-14",
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5 max-w-[420px]">
          <h3
            className={cn(
              "font-semibold text-[color:var(--fg)]",
              density === "compact" ? "text-sm" : "text-base",
            )}
          >
            {title}
          </h3>
          {body ? (
            <p
              className={cn(
                "text-[color:var(--fg-mute)] leading-relaxed",
                density === "compact" ? "text-xs" : "text-sm",
              )}
            >
              {body}
            </p>
          ) : null}
        </div>
        {cta ? <div className="mt-2">{cta}</div> : null}
      </div>
    );
  },
);
tagDisplayName(EmptyState, "EmptyState");
