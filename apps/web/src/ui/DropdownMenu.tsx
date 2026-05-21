// Phase-16 R3 — DropdownMenu primitive.
//
// Radix dropdown gives us:
//   - keyboard navigation (Up/Down/Home/End)
//   - typeahead first-letter focus
//   - Portal mount so the menu escapes overflow:hidden parents
//   - dir=rtl flip detection from <html dir>
//
// We theme it with our paper-card shadow + line tokens. Animations use
// the Radix data-state attributes (no framer-motion).
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn, tagDisplayName } from "./utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent(
  { className, sideOffset = 6, align = "end", ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-[1200] min-w-[180px] overflow-hidden",
          "rounded-[var(--r-lg)] border border-[color:var(--line)]",
          "bg-[color:var(--surface)] p-1 shadow-[var(--shadow-paper)]",
          // Radix data-state animations — no framer-motion
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
tagDisplayName(DropdownMenuContent, "DropdownMenuContent");

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    /** Mark the item as destructive (red text). */
    destructive?: boolean;
  }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex select-none items-center gap-2.5",
        "min-h-[36px] px-2.5 py-1.5 rounded-[var(--r)]",
        "text-[13px] outline-none cursor-pointer",
        "text-[color:var(--fg)]",
        "data-[highlighted]:bg-[color:var(--surface-2)]",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        destructive &&
          "text-[color:var(--gold)] data-[highlighted]:bg-[color:var(--gold-soft)]",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(DropdownMenuItem, "DropdownMenuItem");

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider",
        "text-[color:var(--fg-dim)]",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(DropdownMenuLabel, "DropdownMenuLabel");

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-[color:var(--line)]", className)}
      {...props}
    />
  );
});
tagDisplayName(DropdownMenuSeparator, "DropdownMenuSeparator");
