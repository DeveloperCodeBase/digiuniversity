// =====================================================
// Entry — bootstraps the React tree and applies persisted theme
// before first paint so the initial frame doesn't flash light/dark.
//
// Phase-14.5 C3: dropped @ts-nocheck.
// =====================================================
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../styles.css";
// Phase-A R6: classroom redesign CSS, scoped under .r6-classroom-shell so
// it never bleeds into other pages.
import "../styles-r6-classroom.css";

// Apply persisted theme before first paint to avoid flash.
const savedTheme = ((): string => {
  try {
    return localStorage.getItem("digiu_theme") || "dark";
  } catch {
    return "dark";
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
