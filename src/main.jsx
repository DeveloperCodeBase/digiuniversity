import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "../styles.css";

// Apply persisted theme before first paint to avoid flash
const savedTheme = (() => { try { return localStorage.getItem("digiu_theme") || "dark"; } catch { return "dark"; } })();
document.documentElement.setAttribute("data-theme", savedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
