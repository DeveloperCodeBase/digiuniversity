// Phase-16 R3 — Avatar primitive.
//
// Radix Avatar provides the loaded/error/fallback state machine that
// raw <img> doesn't (gracefully fall back if the image 404s or is
// slow to load — essential for instructor photos pulled from CDNs).
//
// Sizes: sm (28), md (36), lg (44), xl (56). All use Tailwind utilities
// against OKLCh tokens; no extra CSS rules.
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, tagDisplayName } from "./utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-[11px]",
  md: "w-9 h-9 text-[13px]",
  lg: "w-11 h-11 text-[14px]",
  xl: "w-14 h-14 text-[16px]",
};

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: AvatarSize;
}

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(function Avatar({ className, size = "md", ...props }, ref) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full select-none",
        "bg-[color:var(--surface-2)]",
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(Avatar, "Avatar");

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});
tagDisplayName(AvatarImage, "AvatarImage");

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center",
        "bg-[color:var(--surface-3)] text-[color:var(--fg-mute)] font-medium",
        className,
      )}
      {...props}
    />
  );
});
tagDisplayName(AvatarFallback, "AvatarFallback");
