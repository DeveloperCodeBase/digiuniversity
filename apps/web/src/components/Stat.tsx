// Phase-A R2.1 — typed. Hero-stat tile used in marketing surfaces.
import React from "react";

export interface StatProps {
  /** The headline number / phrase. */
  v: React.ReactNode;
  /** Optional small unit suffix rendered inline. */
  unit?: React.ReactNode;
  /** Caption underneath. */
  l: React.ReactNode;
}

export const Stat: React.FC<StatProps> = ({ v, unit, l }) => (
  <div className="hero-stat">
    <div className="v">{v}{unit && <span className="unit">{unit}</span>}</div>
    <div className="l">{l}</div>
  </div>
);

export default Stat;
