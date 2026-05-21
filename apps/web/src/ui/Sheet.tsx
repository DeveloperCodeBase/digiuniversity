// Phase-16 R3 — Sheet primitive.
//
// A side-anchored dialog. Shares Radix Dialog's focus trap, return-
// focus, Escape dismiss, aria semantics — but slides in from one
// edge instead of centring. We reuse Dialog primitives (no second
// portal stack) and apply different positioning via the `side` prop.
//
// Sides:
//   bottom — slide up from below (mobile breakout rooms, filter sheets)
//   top    — slide down from above (rare; notification banners)
//   start  — slide from the start edge (RTL: right) — admin facet pane
//   end    — slide from the end edge (RTL: left) — main drawer pattern
//
// `side="start"` and `side="end"` use logical properties so RTL flips
// the entry direction automatically without us writing duplicate CSS.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn, tagDisplayName } from "./utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export type SheetSide = "top" | "bottom" | "start" | "end";

const SIDE_CLASS: Record<SheetSide, string> = {
  top: cn(
    "inset-x-0 top-0",
    "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
    "rounded-b-[var(--r-xl)]",
    "pt-[max(1.5rem,env(safe-area-inset-top))]",
  ),
  bottom: cn(
    "inset-x-0 bottom-0",
    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
    "rounded-t-[var(--r-xl)]",
    "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
  ),
  start: cn(
    "inset-y-0 start-0 max-w-[min(420px,90vw)] w-full",
    // `start` slides from the start edge — under RTL the start IS the
    // right edge. Radix' slide-in-from-right covers the LTR case;
    // we override per-direction with explicit data attributes below.
    "data-[state=closed]:slide-out-to-left rtl:data-[state=closed]:slide-out-to-right",
    "data-[state=open]:slide-in-from-left rtl:data-[state=open]:slide-in-from-right",
    "rounded-e-[var(--r-xl)]",
  ),
  end: cn(
    "inset-y-0 end-0 max-w-[min(420px,90vw)] w-full",
    "data-[state=closed]:slide-out-to-right rtl:data-[state=closed]:slide-out-to-left",
    "data-[state=open]:slide-in-from-right rtl:data-[state=open]:slide-in-from-left",
    "rounded-s-[var(--r-xl)]",
  ),
};

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[1500] bg-black/55 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(SheetOverlay, "SheetOverlay");

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: SheetSide;
  /** Render the built-in close (×) button. Defaults to true. */
  showClose?: boolean;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent(
  { side = "bottom", className, children, showClose = true, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-[1600] flex flex-col gap-3 p-5",
          "bg-[color:var(--surface)] text-[color:var(--fg)]",
          "border border-[color:var(--line)] shadow-[var(--shadow-paper)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:duration-200 data-[state=open]:duration-280",
          // Cap max-height on top/bottom sheets so super-long content
          // can still scroll inside the sheet rather than escaping.
          "max-h-[calc(100vh-32px)] overflow-y-auto",
          SIDE_CLASS[side],
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className={cn(
              "absolute end-3 top-3 inline-flex items-center justify-center",
              "w-9 h-9 rounded-[var(--r)]",
              "text-[color:var(--fg-mute)] hover:text-[color:var(--fg)]",
              "hover:bg-[color:var(--surface-2)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40",
              "transition-colors duration-150",
            )}
            aria-label="بستن"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
tagDisplayName(SheetContent, "SheetContent");

export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col gap-1.5 text-start pe-10", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-base font-semibold leading-tight text-[color:var(--fg)]",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(SheetTitle, "SheetTitle");

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        "text-sm leading-relaxed text-[color:var(--fg-mute)]",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(SheetDescription, "SheetDescription");

export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";
