// Phase-A R6 — Classroom shell (top-level page).
//
// Mounts inside AppShell's workspace area: CourseHeader on top, then a
// CSS-grid workspace with Stage + AIPanel side-by-side at ≥920px, or
// stacked vertically with the AIPanel as a bottom sheet on phones.
// A page-local FAB lets the visitor reopen the sheet after closing it.
//
// Stays mock-only per Phase-A; Phase D will wire LiveKit + ai-gateway.

import React from "react";
import { Icon } from "../../icons";
import type { Go } from "../../router";
import { CourseHeader } from "./CourseHeader";
import { Stage } from "./Stage";
import { AIPanel } from "./AIPanel";

const STAGE_OPEN_AI_BUTTON_ID = "r6-classroom-fab-ai";

export interface ClassroomShellProps {
  go: Go;
}

/** Match-media hook with SSR-safe initial guess. */
function useMatchMedia(query: string): boolean {
  const get = (): boolean =>
    typeof window !== "undefined" && window.matchMedia(query).matches;
  const [matches, setMatches] = React.useState<boolean>(get);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const onChange = (): void => setMatches(mq.matches);
    onChange();
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    // Safari < 14 fallback
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [query]);
  return matches;
}

export const ClassroomShell: React.FC<ClassroomShellProps> = ({ go }) => {
  const isWide = useMatchMedia("(min-width: 920px)");
  const [aiOpen, setAiOpen] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);

  // Live timer — ticks 1Hz while the page is mounted. Phase D will
  // replace this with `liveSession.startedAt` from the LiveKit room.
  React.useEffect(() => {
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const aiAsSheet = !isWide;

  const onLeave = (): void => {
    // Phase-A behaviour: send the user back to their dashboard. Phase D
    // will additionally tear down the LiveKit peer connection.
    go("dashboard");
  };

  const openSheet = (): void => {
    setAiOpen(true);
    // Restore focus to the FAB when the sheet later closes; the AppShell
    // pattern (R1.4) uses document.getElementById to bypass Radix's
    // controlled-mode focus warning.
    window.setTimeout(() => {
      const el = document.getElementById(STAGE_OPEN_AI_BUTTON_ID);
      el?.focus();
    }, 0);
  };

  return (
    <div className="r6-classroom-shell" dir="rtl">
      <CourseHeader
        elapsedSec={2700 + elapsed}
        participantCount={42}
        attendancePct={89}
        recording={true}
      />

      <main className="r6-workspace">
        <Stage aiOpen={aiOpen} setAiOpen={setAiOpen} onLeave={onLeave} />
        {!aiAsSheet ? (
          <AIPanel asSheet={false} open={true} onClose={() => setAiOpen(false)} />
        ) : null}
      </main>

      {aiAsSheet ? (
        <AIPanel asSheet={true} open={aiOpen} onClose={() => setAiOpen(false)} />
      ) : null}

      {/* Page-local FAB — only on narrow viewports where the AI panel is a sheet.
          AppShell's global AI FAB stays on top of this; the two coexist because
          the global one is the route-level shortcut while this one carries a
          per-session badge count. */}
      {aiAsSheet ? (
        <button
          id={STAGE_OPEN_AI_BUTTON_ID}
          type="button"
          className="r6-page-fab"
          onClick={openSheet}
          aria-label="باز کردن دستیار هوشمند کلاس"
        >
          <Icon name="sparkles" size={22} />
          <span className="r6-page-fab-badge">۳</span>
        </button>
      ) : null}
    </div>
  );
};

export default ClassroomShell;
