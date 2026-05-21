// Phase-16 R3 — shared utilities for the primitive layer.
//
// Lightweight wrapper around `clsx` with a stable name (`cn`) so a
// future migration to `clsx + tailwind-merge` is a one-line swap. We
// deliberately don't pull in `tailwind-merge` yet — primitives only
// emit classes from a small enumerated set per variant, so collision
// fights aren't a problem. Add `twMerge` if/when consumers start
// passing freeform `className` overrides.
import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

/**
 * Resolve a forwardRef component's display name for Storybook + React
 * DevTools. Without this Storybook shows "ForwardRef" for every primitive,
 * which is useless when there are 20+ of them.
 */
export const tagDisplayName = <T extends { displayName?: string }>(
  Component: T,
  name: string,
): T => {
  Component.displayName = name;
  return Component;
};
