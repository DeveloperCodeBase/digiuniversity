// Phase-A R2.1 — typed. Dashboard stat card with optional sparkline.
import React from "react";
import { Sparkline } from "./Sparkline";

export interface StatCardProps {
  /** Label / caption above the value. */
  l: React.ReactNode;
  /** Headline value. */
  v: React.ReactNode;
  /** Optional inline unit suffix. */
  unit?: React.ReactNode;
  /** Trend caption ("↑ 12%"). Renders only when set. */
  trend?: React.ReactNode;
  /** If true, the trend pill renders with the `down` modifier. */
  trendDown?: boolean;
  /** Optional time-series array drawn as a small inline sparkline. */
  spark?: number[];
  /** Colour token name for the sparkline stroke (e.g. "var(--cyan)"). */
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ l, v, unit, trend, spark, color, trendDown }) => (
  <div className="stat">
    <div className="l">{l}</div>
    <div className="v">{v}{unit && <span className="unit">{unit}</span>}</div>
    {trend && <div className={"trend " + (trendDown ? "down" : "")}>{trend}</div>}
    {spark && <div className="spark"><Sparkline values={spark} color={color} height={40} /></div>}
  </div>
);

export default StatCard;
