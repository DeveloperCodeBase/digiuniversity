// Phase-16 Gate-1 Fix 2 — visible holding state for the brief
// "I'm about to redirect" interval that follows auth state resolution.
//
// Before this:
//   - logged-in user lands on "/" → Home.tsx's useEffect fires → navigate
//     to /dashboard. Between mount and useEffect, `return null` flashed a
//     blank background — bad UX, owner reported it as "flash".
//   - unauthenticated user lands on a workspace route → Layout's useEffect
//     fires → navigate to /login. Same one-frame blank flash.
//
// After this:
//   - both call sites render <AuthLoadingSkeleton/> instead of null,
//     producing a stable holding state until the redirect completes.
//
// Design:
//   - Persian-first; matches the existing nav chrome dimensions so the
//     skeleton swap doesn't cause layout shift when the real Nav mounts.
//   - Pure OKLCh tokens. No hardcoded colours. Reduced-motion safe — the
//     pulse animation is paused under prefers-reduced-motion (via the
//     global guard in styles.css).
//   - Accessible: aria-live polite + aria-busy true so screen-reader
//     users hear "loading" instead of silent UI.
import React from "react";

interface AuthLoadingSkeletonProps {
  /** Optional override for the visible label. Defaults to "در حال بارگذاری...". */
  label?: string;
}

/**
 * Centred spinner inside a navbar-height skeleton shell. Use during the
 * one-frame interval between auth-state resolution and the useEffect
 * that performs the redirect.
 */
export const AuthLoadingSkeleton: React.FC<AuthLoadingSkeletonProps> = ({
  label = "در حال بارگذاری...",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="auth-loading-skeleton"
      className="auth-loading-skeleton"
    >
      {/* Navbar placeholder — matches .nav height so the swap is silent. */}
      <div className="auth-loading-nav" aria-hidden="true">
        <div className="auth-loading-nav-brand" />
        <div className="auth-loading-nav-links">
          <div className="auth-loading-nav-link" />
          <div className="auth-loading-nav-link" />
          <div className="auth-loading-nav-link" />
        </div>
        <div className="auth-loading-nav-action" />
      </div>

      {/* Centred spinner + label */}
      <div className="auth-loading-stage">
        <svg
          className="auth-loading-spinner"
          width="44"
          height="44"
          viewBox="0 0 44 44"
          aria-hidden="true"
        >
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--line-2)"
            strokeWidth="3"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="28 88"
            transform="rotate(-90 22 22)"
          />
        </svg>
        <div className="auth-loading-label">{label}</div>
      </div>
    </div>
  );
};

export default AuthLoadingSkeleton;
