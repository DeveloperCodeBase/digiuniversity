// Phase-16 R1 — guard the Tailwind breakpoint scale.
//
// The default Tailwind scale starts at sm=640px, leaving iPhone SE-class
// phones (320–414px) without a dedicated breakpoint. Phase-16 set a
// mobile-first scale starting at xs=375. If anyone reverts or "tidies"
// the screens key, this test fails.
import { describe, it, expect } from "vitest";
import tailwindConfig from "../tailwind.config.js";

describe("Tailwind config — Phase-16 breakpoints", () => {
  const screens = tailwindConfig.theme?.screens;

  it("exposes a screens key with xs through 2xl", () => {
    expect(screens).toBeDefined();
    expect(Object.keys(screens)).toEqual([
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "2xl",
    ]);
  });

  it("starts mobile-first at xs=320px (iPhone SE 1st gen coverage)", () => {
    // Gate-1 correction: was 375 originally; owner pointed out iPhone SE
    // (320 px) is still common in Iran and the 320×568 capture confirmed
    // a 56-px overflow needing a dedicated breakpoint.
    expect(screens.xs).toBe("320px");
  });

  it("maps sm/md/lg/xl/2xl to the documented px values", () => {
    expect(screens.sm).toBe("480px");
    expect(screens.md).toBe("768px");
    expect(screens.lg).toBe("1024px");
    expect(screens.xl).toBe("1280px");
    expect(screens["2xl"]).toBe("1536px");
  });

  it("keeps the OKLCh colour tokens wired to CSS variables", () => {
    const colours = tailwindConfig.theme?.extend?.colors;
    expect(colours.bg).toBe("var(--bg)");
    expect(colours.accent).toBe("var(--accent)");
    expect(colours.surface).toBe("var(--surface)");
  });

  it("loads tailwindcss-rtl and @tailwindcss/container-queries plugins", () => {
    // Plugins are `require()`'d so they appear as truthy function/objects.
    expect(tailwindConfig.plugins.length).toBeGreaterThanOrEqual(2);
    expect(tailwindConfig.plugins.every(Boolean)).toBe(true);
  });
});
