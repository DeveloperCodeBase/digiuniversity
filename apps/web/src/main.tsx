// =====================================================
// Entry — bootstraps the React tree and applies persisted theme
// before first paint so the initial frame doesn't flash light/dark.
//
// Phase-14.5 C3: dropped @ts-nocheck.
// =====================================================
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Phase-A R7.2.a/b — self-host fonts via @fontsource. Replaces the
// Google Fonts <link> in index.html (which transferred ~199 KiB
// from a third-party origin and was a §1 Lighthouse Perf hit).
//
// Q1 Option B1 per owner ack 2026-05-24: keep all 3 design fonts
// (Vazirmatn + Bricolage Grotesque + JetBrains Mono) but trim
// to the weights actually used in styles.css.
//
// Audit (from `grep font-weight` on styles.css + design intent):
//   - Vazirmatn (--f-sans): primary Persian font. Used at 500/600/700/800.
//     Drop 300/400/900 (negligible CSS hits or covered by browser defaults).
//   - Bricolage Grotesque (--f-display): heading display font. Used at
//     500/600/700 for the .h-1/.h-2/.h-display rules. Drop 400/800.
//   - JetBrains Mono (--f-mono): eyebrow + numeric strings. Used at
//     400/500/600. Drop 700.
//
// Each import pulls the woff2 + a tiny @font-face CSS that registers
// the family name. The font-face uses font-display: swap by default
// (same behavior as the Google Fonts version). Bundle impact: smaller
// than the 199 KiB Google Fonts transfer because we ship trimmed weights
// instead of all-7-Vazirmatn + variable-Bricolage + all-4-JetBrains.
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import "@fontsource/bricolage-grotesque/500.css";
import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";

import "../styles.css";
// Phase-A R6: classroom redesign CSS, scoped under .r6-classroom-shell so
// it never bleeds into other pages.
import "../styles-r6-classroom.css";

// Apply persisted theme before first paint to avoid flash.
//
// Phase-A R6.5: default changed from "dark" to "light" so the new
// white + navy-blue palette is what users see on first paint. The
// dark theme stays available — toggling via the theme menu writes
// "dark" to localStorage and this code picks it up next load.
const savedTheme = ((): string => {
  try {
    return localStorage.getItem("digiu_theme") || "light";
  } catch {
    return "light";
  }
})();
document.documentElement.setAttribute("data-theme", savedTheme);

const rootEl = document.getElementById("root");
if (!rootEl) {
  // index.html ships with <div id="root"></div>. If this throws, the
  // template was edited or something hijacked the element id — both
  // are fatal and worth a clear error in the console.
  throw new Error("[main] #root element not found in index.html");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
