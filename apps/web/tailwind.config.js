/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Phase-14 R2: scan .ts/.tsx alongside .js/.jsx so the renamed
    // components keep getting Tailwind utility class detection.
    "./src/**/*.{js,jsx,ts,tsx}",
    "./.storybook/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ["selector", "[data-theme='dark']"],
  theme: {
    // Phase-16 R1: mobile-first breakpoint scale. Replaces Tailwind's
    // default (sm=640) which left a dead zone for iPhone SE-class phones.
    // xs=375 covers iPhone SE/mini, sm=480 small phones, md=768 iPad,
    // lg=1024 tablet landscape/laptop, xl=1280 desktop, 2xl=1536 large.
    screens: {
      xs: "375px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-deep": "var(--bg-deep)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        fg: "var(--fg)",
        "fg-mute": "var(--fg-mute)",
        "fg-dim": "var(--fg-dim)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "accent-soft": "var(--accent-soft)",
        "accent-on": "var(--accent-on)",
        navy: "var(--navy)",
        sage: "var(--sage)",
        gold: "var(--gold)",
        cyan: "var(--cyan)",
        amber: "var(--amber)",
        violet: "var(--violet)",
        rose: "var(--rose)",
      },
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Bricolage Grotesque", "Vazirmatn", "system-ui", "serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "3px",
        md: "6px",
        lg: "10px",
        xl: "14px",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        paper: "var(--shadow-paper)",
        glow: "var(--glow-cyan)",
      },
    },
  },
  plugins: [
    require("tailwindcss-rtl"),
    // Phase-16 R1: container queries (`@container`, `@sm:`, `@md:`) so
    // cards adapt to their slot width, not just the viewport. Crucial
    // for StatCard et al. when they appear inside a Sheet/Dialog/Sidebar.
    require("@tailwindcss/container-queries"),
  ],
};
