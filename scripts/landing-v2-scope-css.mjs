// scripts/landing-v2-scope-css.mjs
//
// One-shot conversion: takes the R-Landing-v2 template's styles.css and
// produces apps/web/src/pages/home-v2.css with every top-level selector
// prefixed by ".home-shell-v2 " so the design's aesthetic only applies
// inside the <div className="home-shell-v2"> wrapper that Home.tsx renders.
//
// LESSON FROM R-LANDING-V1 (D41 postmortem):
//   The v1 generator emitted a `html:has(.home-shell-v2) { ... }` hotfix
//   block at top of the file. Combined with the Workbox precache, that
//   rule got stuck in users' browsers and contributed to the cascade
//   chaos when the SW served stale precached HTML. v2 DOES NOT emit
//   any `:has()` rules and DOES NOT add a top-of-file HOTFIX block.
//   The design already uses `* { box-sizing: border-box }` and `html,
//   body { margin: 0 }` which we scope normally — no hotfix needed.
//
// Rules:
//   - :root tokens become .home-shell-v2 (CSS custom properties scope
//     to the wrapper)
//   - * (universal) becomes .home-shell-v2 *
//   - html, body, #root → .home-shell-v2 (body-level styles applied to
//     the wrapper itself)
//   - body::before → .home-shell-v2::before
//   - Selectors with commas → each one prefixed separately
//   - @keyframes pass through unchanged (keyframe names are global,
//     but they only fire when assigned via prefixed rules)
//   - @media rules pass through; their child rules get prefixed
//   - @import (Google Fonts) is DROPPED — fonts come from @fontsource
//     in main.tsx
//   - @font-face is DROPPED — fonts come from @fontsource
//
// Run: node scripts/landing-v2-scope-css.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve("docs/my-upload/landing-v2/styles.css");
const OUT = resolve("apps/web/src/pages/home-v2.css");
const SCOPE = ".home-shell-v2";

const raw = readFileSync(SRC, "utf8");

/**
 * Prefix a single selector string (no commas) with the scope.
 * Special cases:
 *   :root           → .home-shell-v2
 *   html / body     → .home-shell-v2
 *   #root           → .home-shell-v2
 *   html, body      → .home-shell-v2
 *   body::before    → .home-shell-v2::before
 *   *               → .home-shell-v2 *
 *   else            → .home-shell-v2 <selector>
 */
function prefixOne(sel) {
  const s = sel.trim();
  if (!s) return s;

  if (s.startsWith("@")) return s;

  if (
    s === ":root" ||
    s === "html" ||
    s === "body" ||
    s === "#root" ||
    s === "html, body"
  ) {
    return SCOPE;
  }
  if (s === "body::before") return SCOPE + "::before";
  if (s === "html::before") return SCOPE + "::before";
  if (s === "* " || s === "*") return SCOPE + " *";

  return SCOPE + " " + s;
}

function prefixSelectorList(selList) {
  return selList
    .split(",")
    .map((part) => prefixOne(part))
    .join(",\n");
}

// Walk CSS tokens, splitting into top-level chunks each terminated by
// a top-level "}". Each chunk is either an @-rule (passed through with
// @media nested prefixing) or a normal rule (selector { body }).
function walk(input) {
  const out = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
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
      let j = i;
      while (j < n) {
        // Track paren depth so semicolons inside url(...) don't end
        // the statement prematurely. Critical for @import url(
        // https://...?family=X:wght@300;400;500;...) which has
        // semicolons inside the URL query string.
        if (
          input[j] === ";" &&
          countBraces(input, i, j) === 0 &&
          countParens(input, i, j) === 0
        ) {
          // @import, @charset etc — single-statement.
          const sig = input.slice(i, j + 1).trim();
          // DROP @import url(...fonts.googleapis...) — fonts come from
          // @fontsource per R7.2. Keep other @imports.
          if (/^@import\b.*fonts\.googleapis/i.test(sig)) {
            // Skip — don't emit.
          } else {
            out.push(input.slice(i, j + 1));
          }
          i = j + 1;
          break;
        }
        if (input[j] === "{") {
          const sig = input.slice(i, j);
          let bd = 1;
          let k = j + 1;
          while (k < n && bd > 0) {
            if (input[k] === "{") bd++;
            else if (input[k] === "}") bd--;
            if (bd > 0) k++;
          }
          const body = input.slice(j + 1, k);
          const sigTrim = sig.trim();
          if (/^@(keyframes|font-face|charset)/i.test(sigTrim)) {
            // Drop @font-face (we use @fontsource); keep @keyframes/@charset.
            if (/^@font-face/i.test(sigTrim)) {
              // Skip — don't emit.
            } else {
              out.push(sig + "{" + body + "}");
            }
          } else if (/^@(media|supports|layer|container)/i.test(sigTrim)) {
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

// Helper: count brace depth between two positions in input.
function countBraces(input, start, end) {
  let d = 0;
  for (let p = start; p < end; p++) {
    if (input[p] === "{") d++;
    else if (input[p] === "}") d--;
  }
  return d;
}

// Helper: count paren depth between two positions. Used so semicolons
// inside @import url(...) — like the ones inside a Google Fonts query
// string family=X:wght@300;400;500 — don't end the @-rule prematurely.
function countParens(input, start, end) {
  let d = 0;
  for (let p = start; p < end; p++) {
    if (input[p] === "(") d++;
    else if (input[p] === ")") d--;
  }
  return d;
}

const header = `/* ================================================================
   R-Landing-v2 — apps/web/src/pages/home-v2.css (SCOPED .home-shell-v2)
   ================================================================
   AUTO-GENERATED by scripts/landing-v2-scope-css.mjs from
   docs/my-upload/landing-v2/styles.css.

   Applies the design's "Iran Smart Online University — White + Navy"
   aesthetic ONLY inside <div className="home-shell-v2"> rendered
   exclusively by apps/web/src/pages/Home.tsx.

   D47 (owner ack Q1.a Q2.b Q3.c 2026-05-26):
     - Q1.a: AGENT ARCHITECTURE kept structurally, design palette applied
     - Q2.b: topbar wrapped INSIDE .home-shell-v2 scope, sticky-top inside
             wrapper. Renders only on /, zero leak to /login or /dashboard
     - Q3.c: Hero co-brand = Jahad + AIRAC (design); Footer = JDO + dvcb
             (R1.3-Brand, untouched by this CSS)

   NOTHING from R-Landing-v1:
     - NO html:has(.home-shell-v2) hotfix (the v1 amplifier per D41)
     - NO body:has(.home-shell-v2) hotfix
     - NO !important global overrides
     - design's own * { box-sizing } + html,body { margin:0 } are
       scoped normally below; nothing else is needed

   Edit policy: DO NOT EDIT THIS FILE BY HAND. To regenerate, edit
   docs/my-upload/landing-v2/styles.css and run:
     node scripts/landing-v2-scope-css.mjs
   ================================================================ */

`;

const generated = walk(raw);
writeFileSync(OUT, header + generated);

const srcBytes = Buffer.byteLength(raw, "utf8");
const outBytes = Buffer.byteLength(generated, "utf8");
console.log(`Wrote ${OUT}`);
console.log(`  source: ${srcBytes} bytes`);
console.log(`  output: ${outBytes} bytes (+${outBytes - srcBytes} from prefixing)`);
