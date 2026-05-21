// Phase-16 R3 — Dialog primitive.
//
// Radix Dialog handles focus trap, return-focus, Escape dismiss, and
// aria semantics. We theme the overlay + content + add a default
// close button. RTL is automatic from <html dir>.
//
// The Classroom poll/breakout overlays migrate to this in R6.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn, tagDisplayName } from "./utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
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
tagDisplayName(DialogOverlay, "DialogOverlay");

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Render the built-in close (×) button in the top corner. */
  showClose?: boolean;
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  { className, children, showClose = true, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Position — centred. On <md it fills with safe-area-inset
          // so phones don't lose content behind the home indicator.
          "fixed left-1/2 top-1/2 z-[1600] -translate-x-1/2 -translate-y-1/2",
          "w-[min(560px,calc(100vw-32px))] max-h-[calc(100vh-48px)] overflow-auto",
          // Surface
          "bg-[color:var(--surface)] text-[color:var(--fg)]",
          "border border-[color:var(--line)] rounded-[var(--r-xl)]",
          "shadow-[var(--shadow-paper)] p-6",
          // Mobile fullscreen-ish — owner asked for full-screen on <md
          "max-md:w-[calc(100vw-16px)] max-md:max-h-[calc(100vh-16px)] max-md:rounded-[var(--r-lg)]",
          "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          // Animations from Radix data attrs
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
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
tagDisplayName(DialogContent, "DialogContent");

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col gap-1.5 text-start mb-4 pe-10", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-tight text-[color:var(--fg)]",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(DialogTitle, "DialogTitle");

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
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
tagDisplayName(DialogDescription, "DialogDescription");

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:items-center sm:justify-end",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";
