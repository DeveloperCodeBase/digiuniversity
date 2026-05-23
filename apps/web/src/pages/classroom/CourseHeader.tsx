// Phase-A R6 — Classroom course header.
//
// Banner above the workspace grid: course code crumb (CS-410 · ترم بهار
// ۱۴۰۵ · جلسه ۸ از ۲۲), session title, instructor + day-time + credits
// metadata, live REC pill, participant count, host indicator, JBM
// timer pill.
//
// Mock-only per Phase-A: <MockBadge /> sits in the crumb so the user
// sees this surface isn't wired to the api yet.

import React from "react";
import { Icon } from "../../icons";
import { MockBadge } from "../dashboards/MockBadge";

export interface CourseHeaderProps {
  /** Seconds since the class started; we format to HH:MM:SS. */
  elapsedSec: number;
  /** Number of participants currently connected. */
  participantCount: number;
  /** "حاضر" percentage (engagement) — mock. */
  attendancePct: number;
  /** Whether the session is being recorded. */
  recording: boolean;
}

/** Format a second count as `HH:MM:SS` (zero-padded). */
function fmtTimer(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
  elapsedSec,
  participantCount,
  attendancePct,
  recording,
}) => {
  return (
    <header className="r6-course-head" aria-label="مشخصات کلاس">
      <div className="r6-meta">
        <div className="r6-crumb">
          <span>CS-410</span>
          <span aria-hidden="true">·</span>
          <span>ترم بهار ۱۴۰۵</span>
          <span aria-hidden="true">·</span>
          <span>جلسه ۸ از ۲۲</span>
          <MockBadge size="sm" />
        </div>
        <h1>
          مبانی یادگیری ماشین
          <span className="r6-ses"> — </span>
          گرادیان نزولی تصادفی
          <span className="r6-ses-title">جلسه‌ی ۸ · گرادیان نزولی تصادفی و Mini-batch</span>
        </h1>
        <div className="r6-sub-meta">
          <span className="r6-person">دکتر آرش عظیمی</span>
          <span className="r6-dot" aria-hidden="true" />
          <span>دوشنبه ۱۴:۰۰–۱۵:۳۰</span>
          <span className="r6-dot" aria-hidden="true" />
          <span>۳ واحد نظری</span>
        </div>
      </div>

      <div className="r6-stat-cluster">
        {recording ? (
          <span className="r6-live-pill" role="status">
            <span className="r6-live-dot" aria-hidden="true" />
            ضبط فعال
          </span>
        ) : null}
        <span className="r6-stat-pill" title="مشارکت‌کننده">
          <Icon name="users" className="ic" />
          <span className="num">{participantCount}</span>
          حاضر
        </span>
        <span className="r6-stat-pill" title="درصد توجه">
          <Icon name="eye" className="ic" />
          <span className="num">{attendancePct}٪</span>
        </span>
        <span className="r6-timer-pill" aria-label="زمان سپری‌شده">
          {fmtTimer(elapsedSec)}
        </span>
      </div>
    </header>
  );
};

export default CourseHeader;
