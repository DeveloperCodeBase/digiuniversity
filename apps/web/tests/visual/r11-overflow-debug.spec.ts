// Phase-16 R11 — diagnostic spec to find the element(s) responsible
// for body.scrollWidth > viewport.width at 320 px. Logs offenders.
import { test } from "@playwright/test";

test("find 320 overflow offenders", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 568 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const offenders = await page.evaluate(() => {
    const vw = window.innerWidth;
    const out: Array<{ tag: string; classes: string; right: number; width: number; text: string }> = [];
    const walk = (el: Element) => {
      const rect = el.getBoundingClientRect();
      // Element extends past the right edge of the viewport (LTR) or
      // before the left (RTL) — in RTL the body.scrollLeft is negative
      // and the offending element's left < 0.
      if (rect.right > vw + 1 || rect.left < -1) {
        out.push({
          tag: el.tagName,
          classes: (el as HTMLElement).className.toString().slice(0, 100),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          text: (el as HTMLElement).innerText?.slice(0, 60) ?? "",
        });
      }
      for (const child of Array.from(el.children)) walk(child);
    };
    walk(document.body);
    // Return the top 20 widest offenders.
    return out
      .filter((o) => o.width > 0)
      .sort((a, b) => b.width - a.width)
      .slice(0, 20);
  });

  // eslint-disable-next-line no-console
  console.log("R11 overflow offenders @320px:");
  for (const o of offenders) {
    // eslint-disable-next-line no-console
    console.log(`  ${o.tag} .${o.classes} w=${o.width} right=${o.right}: "${o.text}"`);
  }

  await ctx.close();
});
