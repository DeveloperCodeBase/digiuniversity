// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Shared state components — EmptyState, LoadingSkeleton, ErrorState.
// Every async surface in the SPA should use these instead of inline
// strings so loading/empty/error look the same everywhere and pass
// the Phase-12 acceptance checklist.
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Button } from "../ui";

export const EmptyState = ({
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

export const LoadingSkeleton = ({ kind = "card", count = 3, className = "" }) => {
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

export const ErrorState = ({
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

export const PageHeader = ({
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
        <button type="button" className="page-header-back" onClick={onBack} aria-label={back}>
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
