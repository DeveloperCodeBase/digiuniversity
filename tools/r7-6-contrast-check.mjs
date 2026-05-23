#!/usr/bin/env node
/*
 * Phase A R7.6 — WCAG contrast checker for the light-theme text tokens.
 *
 * Computes the WCAG 2.x relative-luminance contrast ratio between each
 * foreground token (--fg, --fg-mute, --fg-dim) and the background
 * (--bg: #ffffff). Prints OLD vs NEW values + PASS/FAIL against:
 *   - 4.5:1 (AA, normal text — SC 1.4.3)
 *   - 3:1   (AA, large text + non-essential UI — SC 1.4.11)
 *
 * Usage:
 *   node tools/r7-6-contrast-check.mjs
 *
 * Pure ECMAScript, zero dependencies. Runs against the values hard-coded
 * below — same values as apps/web/styles.css so a future drift between
 * the two is human-detectable.
 */

const BG = "#ffffff";

const FG_TOKENS = {
  "--fg":       { old: "#0d0d0c", new: "#0b2447", role: "primary text" },
  "--fg-mute":  { old: "#5b6b87", new: "#4a5a76", role: "secondary text (body sub, meta)" },
  "--fg-dim":   { old: "#93a0b8", new: "#768094", role: "tertiary text (placeholder, disabled)" },
};

/**
 * sRGB hex → relative luminance per WCAG 2.x.
 * https://www.w3.org/TR/WCAG20-TECHS/G18.html
 */
function hexToL(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`bad hex: ${hex}`);
  const v = m[1];
  const channels = [v.slice(0, 2), v.slice(2, 4), v.slice(4, 6)].map((h) => parseInt(h, 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG contrast ratio of two hex colors. */
function contrast(a, b) {
  const La = hexToL(a);
  const Lb = hexToL(b);
  const [lighter, darker] = La > Lb ? [La, Lb] : [Lb, La];
  return (lighter + 0.05) / (darker + 0.05);
}

function verdict(ratio) {
  if (ratio >= 7) return "AAA (normal text)";
  if (ratio >= 4.5) return "AA (normal text)";
  if (ratio >= 3) return "AA (large text / non-essential UI only)";
  return "🔴 FAIL (below 3:1)";
}

function fmt(n) {
  return n.toFixed(2);
}

console.log(`R7.6 contrast check — foreground tokens vs --bg: ${BG}\n`);
console.log("token        role                                       OLD             NEW             status");
console.log("-----        ----                                       ---             ---             ------");
let anyFail = false;
for (const [name, t] of Object.entries(FG_TOKENS)) {
  const oldRatio = contrast(t.old, BG);
  const newRatio = contrast(t.new, BG);
  const oldVerdict = verdict(oldRatio);
  const newVerdict = verdict(newRatio);
  const moved = newRatio > oldRatio ? "↑" : newRatio < oldRatio ? "↓" : "=";
  console.log(
    name.padEnd(12) +
    " " + t.role.padEnd(42) +
    " " + (t.old + " (" + fmt(oldRatio) + ":1)").padEnd(15) +
    " " + (t.new + " (" + fmt(newRatio) + ":1)").padEnd(15) +
    " " + moved + " " + newVerdict,
  );
  if (newRatio < 4.5) anyFail = true;
}
console.log();
console.log(
  anyFail
    ? "⚠  At least one NEW value sits below 4.5:1 (AA for normal text). Acceptable ONLY if usage is large-text / non-essential UI per WCAG SC 1.4.11. Review usage scope post-axe-scan."
    : "✅ Every NEW value meets WCAG AA 4.5:1 for normal text.",
);
console.log();
console.log("Reference thresholds:");
console.log("  4.5:1  WCAG 2.x SC 1.4.3 AA — normal text");
console.log("  3:1    WCAG 2.x SC 1.4.11 AA — large text + non-essential UI");
console.log("  7:1    WCAG 2.x SC 1.4.6 AAA — normal text (aspirational)");

// Exit non-zero if any new value is below AA-large (the absolute floor).
// 4.5:1 violations are flagged in the message but don't fail the script.
const anyBelowAALarge = Object.values(FG_TOKENS).some((t) => contrast(t.new, BG) < 3);
process.exit(anyBelowAALarge ? 1 : 0);
