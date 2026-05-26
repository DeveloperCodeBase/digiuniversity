// scripts/optimize-landing-images.mjs
//
// R7.1.5.b — one-off image optimization for the R-Landing-v2 assets.
// Sharp is invoked at AUTHOR TIME (this script run on dev's machine),
// outputs committed to git. No build-time dependency added; the
// Dockerfile's `npm ci` is unaffected.
//
// Strategy:
//   - Portrait photos (faculty/* + students/*): resize to 600w + convert
//     PNG → JPG quality 80. Photos don't need transparency; JPG is
//     ~10× smaller than PNG for the same visual quality.
//   - Brand logos (jahad-*.png, airac-*.png, light-logo.png, dark-logo.png):
//     keep PNG (transparency required), compress with sharp's palette
//     mode + max compressionLevel.
//
// Outputs written next to originals. Script tracks before/after bytes
// and prints a summary table for the commit message.
//
// Run: node /tmp/sharp-optimize/node_modules/.bin/.. /* via /tmp install */
//   (sharp is in /tmp/sharp-optimize per author setup; not in the
//    repo's package.json — see commit message for rationale.)

import { readdirSync, statSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import sharp from "file:///C:/Users/98912/AppData/Local/Temp/sharp-optimize/node_modules/sharp/lib/index.js";

const ROOT = "apps/web/public/landing-v2";
const PORTRAIT_DIRS = [join(ROOT, "faculty"), join(ROOT, "students")];
const PORTRAIT_TARGET_WIDTH = 600;
const PORTRAIT_JPG_QUALITY = 82;
const LOGO_PALETTE = true;

const results = [];

async function optimizePortrait(filePath) {
  const before = statSync(filePath).size;
  const isAlreadyJpg = /\.jpe?g$/i.test(filePath);

  const outPath = isAlreadyJpg
    ? filePath
    : filePath.replace(/\.png$/i, ".jpg");

  try {
    await sharp(filePath)
      .resize({ width: PORTRAIT_TARGET_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: PORTRAIT_JPG_QUALITY, mozjpeg: true })
      .toFile(outPath + ".tmp");
  } catch (err) {
    console.error("FAIL", filePath, err.message);
    return;
  }

  const after = statSync(outPath + ".tmp").size;

  // Replace original (and delete .png if we converted to .jpg)
  renameSync(outPath + ".tmp", outPath);
  if (!isAlreadyJpg && outPath !== filePath) {
    try { unlinkSync(filePath); } catch {}
  }

  results.push({
    file: basename(filePath),
    out: basename(outPath),
    before: Math.round(before / 1024),
    after: Math.round(after / 1024),
    ratio: Math.round((after / before) * 100),
  });
}

async function optimizeLogo(filePath) {
  const before = statSync(filePath).size;
  try {
    await sharp(filePath)
      .png({ palette: LOGO_PALETTE, compressionLevel: 9, quality: 80 })
      .toFile(filePath + ".tmp");
  } catch (err) {
    console.error("FAIL logo", filePath, err.message);
    return;
  }

  const after = statSync(filePath + ".tmp").size;

  if (after < before * 0.95) {
    // 5%+ saving → keep
    renameSync(filePath + ".tmp", filePath);
  } else {
    unlinkSync(filePath + ".tmp");
  }

  results.push({
    file: basename(filePath),
    out: basename(filePath),
    before: Math.round(before / 1024),
    after: Math.round(after / 1024),
    ratio: Math.round((after / before) * 100),
  });
}

async function main() {
  // Portraits
  for (const dir of PORTRAIT_DIRS) {
    let entries;
    try { entries = readdirSync(dir); } catch { continue; }
    for (const name of entries) {
      const full = join(dir, name);
      if (!statSync(full).isFile()) continue;
      if (!/\.(png|jpe?g)$/i.test(name)) continue;
      await optimizePortrait(full);
    }
  }

  // Logos (top-level PNGs)
  let entries;
  try { entries = readdirSync(ROOT); } catch { entries = []; }
  for (const name of entries) {
    const full = join(ROOT, name);
    if (!statSync(full).isFile()) continue;
    if (!/\.png$/i.test(name)) continue;
    await optimizeLogo(full);
  }

  console.log("\nR7.1.5.b image optimization results:");
  console.log("File                     Before    After   Ratio");
  console.log("─".repeat(56));
  let totalBefore = 0, totalAfter = 0;
  for (const r of results.sort((a, b) => b.before - a.before)) {
    console.log(
      r.out.padEnd(24) +
        (r.before + " KB").padStart(8) +
        " → " +
        (r.after + " KB").padStart(6) +
        "  " +
        (r.ratio + "%").padStart(6)
    );
    totalBefore += r.before;
    totalAfter += r.after;
  }
  console.log("─".repeat(56));
  console.log(
    "TOTAL".padEnd(24) +
      (totalBefore + " KB").padStart(8) +
      " → " +
      (totalAfter + " KB").padStart(6) +
      "  " +
      (Math.round((totalAfter / totalBefore) * 100) + "%").padStart(6)
  );
  console.log(`\nNet saving: ${totalBefore - totalAfter} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
