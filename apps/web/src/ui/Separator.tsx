// Phase-16 R3 — Separator primitive.
//
// Thin wrapper over @radix-ui/react-separator that adds OKLCh styling.
// Horizontal by default; switch with `orientation="vertical"`.
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn, tagDisplayName } from "./utils";

export type SeparatorProps = React.ComponentPropsWithoutRef<
  typeof SeparatorPrimitive.Root
>;

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(function Separator(
  { className, orientation = "horizontal", decorative = true, ...props },
  ref,
) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-[color:var(--line)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(Separator, "Separator");
