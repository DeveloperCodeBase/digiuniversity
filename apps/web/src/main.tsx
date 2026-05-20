// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../styles.css";

// Apply persisted theme before first paint to avoid flash
const savedTheme = (() => { try { return localStorage.getItem("digiu_theme") || "dark"; } catch { return "dark"; } })();
document.documentElement.setAttribute("data-theme", savedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
