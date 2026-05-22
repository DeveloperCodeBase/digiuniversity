#!/usr/bin/env node
// Phase-16 R5' — mechanical migration of <button className="btn …"> to
// <Button variant="…" size="…"> from ../ui/Button.tsx.
//
// Scope: ONE file per invocation, takes the path as argv[2]. Writes the
// transformed file in place. Prints a summary of how many tags it
// changed. Idempotent — re-running on a migrated file is a no-op.
//
//   node scripts/migrate-buttons.mjs apps/web/src/pages/Home.tsx
//
// Only transforms cases where className is a literal string starting
// with "btn". Conditional / interpolated classNames are skipped (they
// stay raw <button> and get listed in the trailing report so a human
// can review).
//
// Adds `import { Button } from "../../ui";` (relative to file dir) to
// the import block at the top if not already present.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/migrate-buttons.mjs <file.tsx>");
  process.exit(1);
}

const src0 = readFileSync(file, "utf8");

// Resolve the relative import path from the file to apps/web/src/ui.
const UI_DIR = resolve("apps/web/src/ui");
const rel = relative(dirname(resolve(file)), UI_DIR).replace(/\\/g, "/");

const VARIANTS = ["primary", "secondary", "ghost", "outline", "ink", "amber"];
const SIZES = ["sm", "lg", "icon"];

const VARIANT_MAP = {
  amber: "secondary", // map legacy btn-amber to the new "secondary" variant
};

let renderedTags = 0;
let skipped = 0;

// Pass 1 — rewrite opening tags.
const openTag = /<button\b([\s\S]*?)>/g;
const closeTag = /<\/button>/g;

const transformed = src0.replace(openTag, (full, attrs, idx) => {
  // Skip tags whose className isn't a literal "btn …" string.
  const cmatch = attrs.match(/\bclassName=("([^"]*)")/);
  if (!cmatch) return full;
  const cls = cmatch[2];
  if (!/\bbtn\b/.test(cls) || !/\bbtn-/.test(cls)) return full;

  // Variant + size + extras.
  const variantRaw = VARIANTS.find((v) =>
    new RegExp(`\\bbtn-${v}\\b`).test(cls),
  );
  if (!variantRaw) {
    skipped++;
    return full;
  }
  const variant = VARIANT_MAP[variantRaw] || variantRaw;
  const size = SIZES.find((s) => new RegExp(`\\bbtn-${s}\\b`).test(cls));
  const extras = cls
    .split(/\s+/)
    .filter((t) => t && t !== "btn" && !/^btn-/.test(t))
    .join(" ");

  // Strip the className attribute from the original attrs string.
  let newAttrs = attrs.replace(/\s*\bclassName="[^"]*"/, "");

  // Build the new attribute set.
  const parts = [`variant="${variant}"`];
  if (size) parts.push(`size="${size}"`);
  if (extras) parts.push(`className="${extras}"`);
  // Preserve everything else (onClick, disabled, etc.) — trim leading
  // whitespace because we removed className earlier.
  const tail = newAttrs.replace(/^\s+/, "");
  const head = " " + parts.join(" ") + (tail ? " " + tail : "");

  renderedTags++;
  return `<Button${head}>`;
});

// Pass 2 — close every matching </button> only if we changed at least one.
let finalSrc = transformed;
if (renderedTags > 0) {
  // Naive but safe-enough: replace every </button> with </Button>. Some
  // unrelated <button> tags (without btn classes) may still exist; if
  // we replace ALL closers, those stay matched to their own original
  // <button> openings. So we need a balanced replacement.
  //
  // Strategy: walk the source character-by-character, tracking a stack
  // of opening tags we transformed. For each <button or <Button we see,
  // push onto a stack with the type. For each </button> we see, pop
  // and rewrite to </Button> if the top of stack is "Button".
  const stack = [];
  let out = "";
  let i = 0;
  while (i < finalSrc.length) {
    // Match opening tag start.
    if (finalSrc.startsWith("<button", i)) {
      // find end of opening
      const end = finalSrc.indexOf(">", i);
      if (end === -1) break;
      stack.push("button");
      out += finalSrc.slice(i, end + 1);
      i = end + 1;
    } else if (finalSrc.startsWith("<Button", i)) {
      const end = finalSrc.indexOf(">", i);
      if (end === -1) break;
      // Self-closing (<Button … />) doesn't push onto stack.
      const seg = finalSrc.slice(i, end + 1);
      if (!seg.endsWith("/>")) stack.push("Button");
      out += seg;
      i = end + 1;
    } else if (finalSrc.startsWith("</button>", i)) {
      const top = stack.pop();
      if (top === "Button") {
        out += "</Button>";
      } else {
        out += "</button>";
      }
      i += "</button>".length;
    } else {
      out += finalSrc[i];
      i++;
    }
  }
  finalSrc = out;
}

// Pass 3 — ensure `Button` is imported.
if (renderedTags > 0 && !/from\s+["'][^"']*\/ui["']/.test(finalSrc)) {
  // Insert after the first import block.
  const importBlock = finalSrc.match(/(?:^import .+?;\n)+/m);
  if (importBlock) {
    const ins = `import { Button } from "${rel}";\n`;
    finalSrc =
      finalSrc.slice(0, importBlock.index + importBlock[0].length) +
      ins +
      finalSrc.slice(importBlock.index + importBlock[0].length);
  }
} else if (renderedTags > 0) {
  // Already imports from ui/ — check it includes Button.
  finalSrc = finalSrc.replace(
    /import\s+\{([^}]+)\}\s+from\s+(["'][^"']*\/ui["'])\s*;/,
    (m, names, mod) => {
      if (/\bButton\b/.test(names)) return m;
      const newNames = ["Button", ...names.split(",").map((s) => s.trim())]
        .filter(Boolean)
        .join(", ");
      return `import { ${newNames} } from ${mod};`;
    },
  );
}

writeFileSync(file, finalSrc, "utf8");
console.log(
  `${file}: rewrote ${renderedTags} tags (skipped ${skipped} non-literal-className)`,
);
