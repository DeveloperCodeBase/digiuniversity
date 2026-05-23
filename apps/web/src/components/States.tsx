// Phase-A R2.2 — typed.
// =====================================================
// Shared state components — EmptyState, LoadingSkeleton, ErrorState.
// Every async surface in the SPA should use these instead of inline
// strings so loading/empty/error look the same everywhere and pass
// the Phase-12 acceptance checklist.
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Button } from "../ui";

export interface EmptyStateProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  /** Icon name from the shared icon set. */
  icon?: string;
  /** CTA label; renders the action button only when both `cta` AND `onCta` are set. */
  cta?: React.ReactNode;
  /** Icon name for the CTA's leading icon. */
  ctaIcon?: string;
  onCta?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "هنوز چیزی اینجا نیست",
  body,
  icon = "sparkle",
  cta,
  ctaIcon = "plus",
  onCta,
  className = "",
}) => (
  <div className={"empty-state " + className} role="status">
    <div className="empty-state-icon" aria-hidden="true">
      <Icon name={icon} size={28} />
    </div>
    <h3 className="empty-state-title">{title}</h3>
    {body && <p className="empty-state-body">{body}</p>}
    {cta && onCta && (
      <Button variant="primary" size="sm" type="button" onClick={onCta}>
        {ctaIcon && <Icon name={ctaIcon} size={14} />}
        {cta}
      </Button>
    )}
  </div>
);

export type LoadingSkeletonKind = "row" | "chart" | "text" | "card";

export interface LoadingSkeletonProps {
  kind?: LoadingSkeletonKind;
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ kind = "card", count = 3, className = "" }) => {
  if (kind === "row") {
    return (
      <div className={"skeleton-stack " + className} aria-busy="true" aria-live="polite">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    );
  }
  if (kind === "chart") {
    return (
      <div className={"skeleton skeleton-chart " + className} aria-busy="true" aria-live="polite" />
    );
  }
  if (kind === "text") {
    return (
      <div className={"skeleton-stack " + className} aria-busy="true" aria-live="polite">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ width: `${70 + (i * 7) % 30}%` }} />
        ))}
      </div>
    );
  }
  return (
    <div className={"skeleton-grid " + className} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
};

export interface ErrorStateProps {
  title?: React.ReactNode;
  message?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: React.ReactNode;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "خطایی رخ داد",
  message = "نتوانستیم این بخش را بارگیری کنیم. لطفاً دوباره تلاش کنید.",
  onRetry,
  retryLabel = "تلاش دوباره",
  className = "",
}) => (
  <div className={"error-state " + className} role="alert" aria-live="assertive">
    <div className="error-state-icon" aria-hidden="true">
      <Icon name="shield" size={26} />
    </div>
    <h3 className="error-state-title">{title}</h3>
    <p className="error-state-body">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" type="button" onClick={onRetry}>
        <Icon name="bolt" size={14} />
        {retryLabel}
      </Button>
    )}
  </div>
);

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Back-link label; renders the back row only when `back` AND `onBack` are set. */
  back?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  back,
  onBack,
  actions,
  badge,
  className = "",
}) => (
  <header className={"page-header " + className}>
    <div className="page-header-main">
      {back && (
        <button type="button" className="page-header-back" onClick={onBack} aria-label={typeof back === "string" ? back : undefined}>
          <Icon name="chev-right" size={16} />
          <span>{back}</span>
        </button>
      )}
      <div className="page-header-titles">
        <h1 className="heading-1 page-header-title">
          {title}
          {badge && <span className="page-header-badge">{badge}</span>}
        </h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </header>
);

export default EmptyState;
