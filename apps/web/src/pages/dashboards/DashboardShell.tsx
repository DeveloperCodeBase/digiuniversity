// Phase-A R3 — Shared shell for the role-specific dashboards.
// Renders the consistent greeting strip + role-eyebrow + KPI grid slot
// + content slot. Each role dashboard composes this with its own KPIs
// and content.
import React from "react";
import { Icon } from "../../icons";
import { Button } from "../../ui";
import { useAuth } from "../../auth/AuthContext";
import { useRole } from "../../role";
import { MockBadge } from "./MockBadge";
import type { Go } from "../../router";

export interface DashboardKpi {
  label: React.ReactNode;
  /** The headline value (string / number / Persian numeral). */
  value: React.ReactNode;
  /** Optional trend pill text ("+۱۲٪"); colour-coded green/red via `trendDown`. */
  trend?: React.ReactNode;
  trendDown?: boolean;
  /** Optional icon name from the shared icon set. */
  icon?: string;
  /** Set to `false` when the value is wired to real api. Defaults to true. */
  mock?: boolean;
}

export interface DashboardShellProps {
  /** Persian heading rendered prominently. e.g., "میز ابرمدیر" */
  title: React.ReactNode;
  /** Short subtitle underneath the heading. */
  subtitle?: React.ReactNode;
  /** Optional CTA button. Renders only when both label + onClick are set. */
  ctaLabel?: React.ReactNode;
  onCta?: () => void;
  /** Top-row KPI cards. ≤6 recommended. */
  kpis?: DashboardKpi[];
  /** Main content (queues, tables, charts) rendered below the KPI strip. */
  children?: React.ReactNode;
  /** `go` from router for nav buttons inside KPIs / CTAs. */
  go?: Go;
}

const Kpi: React.FC<DashboardKpi> = ({ label, value, trend, trendDown, icon, mock = true }) => (
  <div
    className="stat"
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: 18,
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-lg, 14px)",
    }}
  >
    <div className="flex items-center justify-between gap-2">
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.1em" }}>
        {label}
      </div>
      {icon && (
        <span style={{ color: "var(--fg-dim)" }}>
          <Icon name={icon} size={14} />
        </span>
      )}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: "var(--fg)" }}>
      {value}
    </div>
    <div className="flex items-center gap-2 mt-1" style={{ flexWrap: "wrap" }}>
      {trend && (
        <span
          className="pill"
          style={{
            fontSize: 10,
            color: trendDown ? "var(--rose)" : "var(--sage)",
            background: trendDown
              ? "color-mix(in oklch, var(--rose) 14%, transparent)"
              : "color-mix(in oklch, var(--sage) 14%, transparent)",
            border: "1px solid " + (trendDown ? "var(--rose)" : "var(--sage)"),
          }}
        >
          {trend}
        </span>
      )}
      {mock && <MockBadge size="sm" />}
    </div>
  </div>
);

export const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  subtitle,
  ctaLabel,
  onCta,
  kpis,
  children,
  go,
}) => {
  const { role } = useRole();
  const auth = useAuth();
  const firstName =
    auth.user?.fullName?.split(" ")[0] ||
    auth.user?.email?.split("@")[0] ||
    null;
  const greeting = firstName ? `سلام ${firstName}` : "خوش آمدید";

  return (
    <main data-screen-label={`R3 ${role?.label || "میز کار"}`}>
      <div className="dash-main">
        <div className="dash-greet">
          <div>
            <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              پنل {role?.label || "—"}
              <MockBadge size="sm" />
            </span>
            <h1 className="mt-2.5">{greeting} — {title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <div className="flex gap-2.5 items-center">
            {go && (
              <Button
                variant="outline"
                className="icon-btn"
                onClick={() => go("inbox")}
                aria-label="صندوق اعلان‌ها"
                title="اعلان‌ها"
              >
                <Icon name="bell" size={14} />
              </Button>
            )}
            {ctaLabel && onCta && (
              <Button variant="primary" onClick={onCta}>
                {ctaLabel}
                <Icon name="arrow" size={14} />
              </Button>
            )}
          </div>
        </div>

        {kpis && kpis.length > 0 && (
          <div
            className="stat-row"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, 1fr)`,
              gap: 16,
            }}
          >
            {kpis.map((k, i) => (
              <Kpi key={i} {...k} />
            ))}
          </div>
        )}

        {children}
      </div>
    </main>
  );
};

export default DashboardShell;
