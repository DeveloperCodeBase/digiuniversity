// Phase-A R7.12 — Mini-variant persistent sidebar (≥1024px workspace).
//
// Wraps RoleSideNav with a chevron toggle button at the rail's top.
// Always in DOM (not lazy-mounted like Sheet); width animates between
// 72px (mini) and 280px (expanded) via the parent grid's CSS variable
// `--r7-rail-width`. Same elevation as content (z-index: auto, no
// shadow) per D23's elevation contract.
//
// RTL chevron direction:
//   mini      → expand-toward-content → in RTL, content is on the LEFT,
//                so the icon points LEFT (chev-left).
//   expanded  → collapse-toward-start → in RTL, start is on the RIGHT,
//                so the icon points RIGHT (chev-right).
//
// The toggle uses the disclosure-widget ARIA pattern (aria-expanded;
// aria-haspopup is omitted because the rail is a region, not a dialog).

import React from "react";
import { Icon } from "../icons";
import { RoleSideNav } from "../sidenav";
import type { Go } from "../router";

export interface MiniRailProps {
  /** Current rail mode. Persisted in localStorage via AppShell. */
  mode: "mini" | "expanded";
  /** Caller toggles between modes; AppShell wires this to its state setter. */
  onToggle: () => void;
  /** Pass-through to RoleSideNav for navigation. */
  go: Go;
  /** Pass-through to RoleSideNav for active-item styling. */
  active: string;
}

export const MiniRail: React.FC<MiniRailProps> = ({ mode, onToggle, go, active }) => {
  const isMini = mode === "mini";
  return (
    <div
      className="r7-mini-rail"
      data-mode={mode}
      // role=region is implicit via the inner <aside>; this <div> is
      // just the rail container + chevron host.
    >
      <div className="r7-rail-toggle-row">
        <button
          type="button"
          className="r7-rail-toggle"
          onClick={onToggle}
          aria-label={isMini ? "گسترش منوی کناری" : "جمع کردن منوی کناری"}
          aria-expanded={!isMini}
          title={isMini ? "گسترش" : "جمع کردن"}
        >
          <Icon name={isMini ? "chev-left" : "chev-right"} size={16} />
        </button>
      </div>
      <RoleSideNav active={active} go={go} mode={mode} />
    </div>
  );
};

export default MiniRail;
