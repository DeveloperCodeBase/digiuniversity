// Phase-16 R3 — ErrorState primitive.
//
// "Something broke, here's what + how to recover" — pair with the
// ErrorBoundary in apps/web/src/auth/ErrorBoundary.tsx as its UI, and
// reuse for API error fallbacks in pages. Always offers a retry path
// (passing in `retry` is required) so the user is never trapped.
//
// Visually distinct from EmptyState: warm border + gold icon affordance
// so users immediately recognise "this is an error, not just empty".
import * as React from "react";
import { cn, tagDisplayName } from "./utils";

export interface ErrorStateProps
  // Omit the native `title` attribute (string tooltip) so we can give
  // it a React-node type for the visible heading.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Required short title — owner-facing copy ("اتصال برقرار نیست"). */
  title: React.ReactNode;
  /** Optional body — Persian explanation. */
  body?: React.ReactNode;
  /** Required retry handler — every error state must offer a recovery. */
  retry: () => void;
  /** Retry button label — defaults to "تلاش مجدد". */
  retryLabel?: React.ReactNode;
  /** Optional technical detail (stack/code) hidden in a <details>. */
  detail?: React.ReactNode;
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  function ErrorState(
    {
      title,
      body,
      retry,
      retryLabel = "تلاش مجدد",
      detail,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          "flex flex-col items-center text-center gap-4 py-10 px-6",
          "border border-[color:var(--gold)]/30 rounded-[var(--r-lg)]",
          "bg-[color:var(--gold-soft)]/40",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full",
            "bg-[color:var(--gold-soft)] text-[color:var(--gold)]",
          )}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5 max-w-[480px]">
          <h3 className="font-semibold text-base text-[color:var(--fg)]">
            {title}
          </h3>
          {body ? (
            <p className="text-sm text-[color:var(--fg-mute)] leading-relaxed">
              {body}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={retry}
          className="btn btn-outline btn-sm"
        >
          {retryLabel}
        </button>
        {detail ? (
          <details className="text-xs text-[color:var(--fg-dim)] max-w-[480px] w-full text-start">
            <summary className="cursor-pointer select-none">
              جزئیات فنی
            </summary>
            <pre className="mt-2 p-3 bg-[color:var(--surface-3)] rounded-[var(--r)] overflow-auto font-mono">
              {detail}
            </pre>
          </details>
        ) : null}
      </div>
    );
  },
);
tagDisplayName(ErrorState, "ErrorState");
