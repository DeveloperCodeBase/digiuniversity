// Phase-16 R4' — reusable theme toggle primitive.
//
// The Nav component already has its own inline toggle (icon button shape),
// but settings panels, the BottomNav "more" sheet, and the command palette
// detail need a richer surface (icon + label + state). This wrapper
// supplies that surface while still calling the same `useTheme()` hook so
// the toggle stays in sync across every mount point.
//
// Variants:
//   icon-only — small square button (matches `.nav-icon-btn`). Used in
//     toolbars / dense headers.
//   labeled   — icon + Persian label. Used in settings rows + BottomNav
//     "more" sheet.
//   switch    — visual switch with sun on the right, moon on the left,
//     thumb slides between them. Used in primary preferences UI.
//
// Accessibility: every variant exposes `role="switch"` (semantically more
// honest than a generic button) with `aria-checked` reflecting the dark
// state. Keyboard activation is the default (Space/Enter both toggle).
import React from "react";
import { Icon } from "../icons";
import { useTheme } from "../ui-shell";
import type { Theme } from "../ui-shell";

export interface ThemeToggleProps {
  /** Visual variant. Defaults to `icon`. */
  variant?: "icon" | "labeled" | "switch";
  /** Extra className appended to the rendered element. */
  className?: string;
  /** Override the icon size. Defaults match the variant. */
  iconSize?: number;
  /** Optional callback fired after the toggle, in addition to the global state update. */
  onToggle?: (next: Theme) => void;
  /** data-testid override; defaults to "theme-toggle". */
  testId?: string;
}

const labelFor = (t: Theme): string =>
  t === "dark" ? "تغییر به تم روشن" : "تغییر به تم تیره";
const titleFor = (t: Theme): string => (t === "dark" ? "روشن" : "تیره");

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "icon",
  className,
  iconSize,
  onToggle,
  testId = "theme-toggle",
}) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const onClick = React.useCallback(() => {
    const next: Theme = isDark ? "light" : "dark";
    setTheme(next);
    onToggle?.(next);
  }, [isDark, setTheme, onToggle]);

  // Icon shows DESTINATION state — clicking shows "sun" when dark
  // (because we'd switch to light) and vice-versa.
  const iconName = isDark ? "sun" : "moon";
  const aria = labelFor(theme);
  const title = titleFor(theme);

  if (variant === "switch") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={aria}
        title={title}
        data-testid={testId}
        onClick={onClick}
        className={
          "theme-toggle-switch" +
          (isDark ? " is-dark" : " is-light") +
          (className ? " " + className : "")
        }
      >
        <span className="theme-toggle-switch-track" aria-hidden="true">
          <Icon name="moon" size={iconSize ?? 14} />
          <Icon name="sun" size={iconSize ?? 14} />
        </span>
        <span className="theme-toggle-switch-thumb" aria-hidden="true">
          <Icon name={iconName} size={iconSize ?? 14} />
        </span>
      </button>
    );
  }

  if (variant === "labeled") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={aria}
        title={title}
        data-testid={testId}
        onClick={onClick}
        className={"theme-toggle-labeled" + (className ? " " + className : "")}
      >
        <Icon name={iconName} size={iconSize ?? 16} />
        <span>{isDark ? "تم روشن" : "تم تیره"}</span>
      </button>
    );
  }

  // Default: icon-only — matches the existing .nav-icon-btn footprint.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={aria}
      title={title}
      data-testid={testId}
      onClick={onClick}
      className={
        "nav-icon-btn theme-toggle" + (className ? " " + className : "")
      }
    >
      <Icon name={iconName} size={iconSize ?? 18} />
    </button>
  );
};

export default ThemeToggle;
