// scripts/landing-scope-css.mjs
//
// One-shot conversion: takes the template's styles.css and produces
// apps/web/src/pages/home-v2.css with every top-level selector
// prefixed by ".home-shell-v2 " so the template aesthetic only
// applies inside the <div className="home-shell-v2"> wrapper.
//
// Rules:
//   - :root tokens become .home-shell-v2 (so CSS custom properties
//     scope to the wrapper)
//   - * (universal) becomes .home-shell-v2 *
//   - html / body / #root → .home-shell-v2 (these get the body-level
//     styles applied to the wrapper itself)
//   - Selectors with commas → each one prefixed
//   - @keyframes pass through unchanged (keyframe NAMES are global,
//     but they only animate when assigned via the prefixed rules)
//   - @media rules pass through; their child rules get prefixed
//   - body::before grain texture → .home-shell-v2::before
//
// Run: node scripts/landing-scope-css.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve("docs/my-upload/landing-page/styles.css");
const OUT = resolve("apps/web/src/pages/home-v2.css");
const SCOPE = ".home-shell-v2";

const raw = readFileSync(SRC, "utf8");

/**
 * Prefix a single selector string (no commas) with the scope.
 * Special cases:
 *   :root       → .home-shell-v2
 *   html, body  → .home-shell-v2
 *   #root       → .home-shell-v2
 *   body::before→ .home-shell-v2::before
 *   *           → .home-shell-v2 *
 *   a / button  → .home-shell-v2 a (or .home-shell-v2 button)
 *   else        → .home-shell-v2 <selector>
 */
function prefixOne(sel) {
  const s = sel.trim();
  if (!s) return s;

  // Skip rules that don't make sense to scope (e.g., @-rules already handled above).
  if (s.startsWith("@")) return s;

  // :root / html / body / #root → scope target itself.
  if (s === ":root" || s === "html" || s === "body" || s === "#root" || s === "html, body") return SCOPE;
  if (s === "body::before") return SCOPE + "::before";
  if (s === "html::before") return SCOPE + "::before";
  if (s === "* " || s === "*") return SCOPE + " *";

  // Default: prefix.
  return SCOPE + " " + s;
}

function prefixSelectorList(selList) {
  return selList
    .split(",")
    .map((part) => prefixOne(part))
    .join(",\n");
}

// Tokenize the CSS into top-level chunks. We walk char-by-char counting
// brace depth, and split into chunks each terminated by a top-level "}".
// Each chunk is either an @-rule (passed through, with @media nested
// prefixing) or a normal rule (selector { body }).
function walk(input) {
  const out = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    // Skip whitespace + comments, but preserve them in output.
    if (input[i] === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      const cmt = input.slice(i, end === -1 ? n : end + 2);
      out.push(cmt);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (/\s/.test(input[i])) {
      out.push(input[i]);
      i++;
      continue;
    }

    // @-rule
    if (input[i] === "@") {
      // Find the end of the @-rule signature (up to "{" or ";").
      let j = i;
      let depth = 0;
      while (j < n) {
        if (input[j] === ";" && depth === 0) {
          // @import, @charset etc. — single-statement.
          out.push(input.slice(i, j + 1));
          i = j + 1;
          break;
        }
        if (input[j] === "{") {
          // Found the body.
          const sig = input.slice(i, j);
          // Match brace pair.
          let bd = 1;
          let k = j + 1;
          while (k < n && bd > 0) {
            if (input[k] === "{") bd++;
            else if (input[k] === "}") bd--;
            if (bd > 0) k++;
          }
          const body = input.slice(j + 1, k);
          // Decide whether to recurse:
          //   @keyframes → pass through unchanged
          //   @media / @supports → recurse on body
          if (/^@(keyframes|font-face|charset)/i.test(sig.trim())) {
            out.push(sig + "{" + body + "}");
          } else if (/^@(media|supports|layer|container)/i.test(sig.trim())) {
            out.push(sig + "{");
            out.push(walk(body));
            out.push("}");
          } else {
            out.push(sig + "{" + body + "}");
          }
          i = k + 1;
          break;
        }
        j++;
      }
      if (j >= n) break;
      continue;
    }

    // Normal rule: capture selector up to "{", then body up to matching "}".
    let j = i;
    while (j < n && input[j] !== "{" && input[j] !== "}") {
      if (input[j] === "/" && input[j + 1] === "*") {
        const end = input.indexOf("*/", j + 2);
        j = end === -1 ? n : end + 2;
      } else {
        j++;
      }
    }
    if (j >= n) {
      out.push(input.slice(i));
      break;
    }
    if (input[j] === "}") {
      // Stray brace. Emit and continue.
      out.push(input.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    const sel = input.slice(i, j);
    let bd = 1;
    let k = j + 1;
    while (k < n && bd > 0) {
      if (input[k] === "{") bd++;
      else if (input[k] === "}") bd--;
      if (bd > 0) k++;
    }
    const body = input.slice(j + 1, k);

    out.push(prefixSelectorList(sel) + " {" + body + "}");
    i = k + 1;
  }

  return out.join("");
}

const header = `/* ================================================================
   Phase-A R-Landing — home-v2.css (SCOPED via .home-shell-v2)
   ================================================================
   AUTO-GENERATED by scripts/landing-scope-css.mjs from
   docs/my-upload/landing-page/styles.css.

   This file applies the template's "University Press — Minimal
   Academic" aesthetic ONLY inside <div className="home-shell-v2">,
   which is rendered exclusively by apps/web/src/pages/Home.tsx.

   The global token system (R6.5 white+navy palette) is UNCHANGED
   for every other route. Workspace + auth-flow + classroom + role
   dashboards continue to use the production styles.css tokens.

   Edit policy: DO NOT EDIT THIS FILE BY HAND. To regenerate, edit
   docs/my-upload/landing-page/styles.css and run:
     node scripts/landing-scope-css.mjs
   ================================================================ */

/* ----------------------------------------------------------------
   HOTFIX (2026-05-25 — emergency layout fix)
   The visual port showed a horizontal scroll bug: body had its
   default 8px margin (production html,body { margin:0 } wasn't
   winning the cascade for some reason), and the .hero-bg auroras
   with negative insets ( -10% horizontally ) escaped the .hero's
   overflow:hidden clip and pushed the document scrollWidth past
   the viewport. Use :has() to detect Home-page only — on every
   other route this rule has no .home-shell-v2 to match so doesn't
   apply. overflow-x:clip clips without creating a scroll
   container (better than hidden for stacking contexts).
   ---------------------------------------------------------------- */
html:has(.home-shell-v2),
body:has(.home-shell-v2) {
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: clip !important;
}
.home-shell-v2 {
  overflow-x: clip !important;
  max-width: 100vw;
}
.home-shell-v2 .hero {
  overflow: clip !important;
}

/* skip-link inside the home wrapper — must be visually hidden until
   keyboard-focused, then appear at top. Production .skip-link rule
   isn't winning the cascade inside the home scope for some reason. */
.home-shell-v2 .skip-link {
  position: absolute !important;
  top: -40px !important;
  inset-inline-start: 16px !important;
  z-index: 9999;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  text-decoration: none;
}
.home-shell-v2 .skip-link:focus-visible {
  top: 12px !important;
  outline: 2px solid #fff;
  outline-offset: 2px;
}

`;

const generated = walk(raw);
writeFileSync(OUT, header + generated);

const srcBytes = Buffer.byteLength(raw, "utf8");
const outBytes = Buffer.byteLength(generated, "utf8");
console.log(`Wrote ${OUT}`);
console.log(`  source: ${srcBytes} bytes`);
console.log(`  output: ${outBytes} bytes (+${outBytes - srcBytes} from prefixing)`);
