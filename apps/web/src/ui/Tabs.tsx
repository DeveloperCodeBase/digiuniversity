// Phase-16 R3 — Tabs primitive.
//
// Radix Tabs gives us keyboard navigation (Arrow Left/Right or
// Home/End), `aria-selected` wiring, focus management on activation.
// We theme the trigger with an active underline in --accent that
// flips correctly under RTL because both flex-direction and the
// underline use logical properties.
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn, tagDisplayName } from "./utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-[var(--r-lg)]",
        "bg-[color:var(--surface-2)] border border-[color:var(--line)]",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(TabsList, "TabsList");

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center min-h-[36px] px-3.5",
        "text-[13px] font-medium leading-none rounded-[var(--r)]",
        "text-[color:var(--fg-mute)]",
        "data-[state=active]:bg-[color:var(--surface)] data-[state=active]:text-[color:var(--fg)]",
        "data-[state=active]:shadow-[var(--shadow-1)]",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(TabsTrigger, "TabsTrigger");

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40 rounded-[var(--r)]",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(TabsContent, "TabsContent");
