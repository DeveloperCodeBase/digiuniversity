// Phase-A R2.1 — typed. Circular mastery percentage indicator.
import React from "react";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (n: number | string): string =>
  String(n).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

export interface MasteryRingProps {
  /** 0–100. */
  percent: number;
  /** Primary label beside the ring. */
  label?: React.ReactNode;
  /** Optional smaller secondary line. */
  sub?: React.ReactNode;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({ percent, label = "تسلط فعلی", sub }) => {
  const r = 36;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div className="flex items-center gap-4">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--violet)" strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 45 45)" />
        <text x="45" y="50" textAnchor="middle" fill="var(--fg)" fontFamily="var(--f-mono)" fontWeight="700" fontSize="18">
          {toFa(percent)}٪
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {sub && <div className="mt-1 font-mono text-[11px] text-fg-mute">{sub}</div>}
      </div>
    </div>
  );
};

export default MasteryRing;
