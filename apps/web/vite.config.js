import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Phase-14.8: never let HTTP cache the SW file itself or its
      // imports. Some users were stuck on a pre-Phase-14.6 SW that
      // didn't have skipWaiting; with updateViaCache: "none", the
      // browser always asks the network for sw.js (bypassing its own
      // HTTP cache), so a new SW reaches the user on the next visit.
      // Pairs with the inline controllerchange listener in index.html
      // to reload the page once the new SW claims.
      updateViaCache: "none",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "دیجی‌یونیورسیتی",
        short_name: "DigiU",
        description: "دانشگاه آنلاین هوشمند مبتنی بر AI",
        theme_color: "#0a0d1a",
        background_color: "#0a0d1a",
        display: "standalone",
        orientation: "portrait",
        dir: "rtl",
        lang: "fa",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        // Phase-14.6 — take effect IMMEDIATELY after a new deploy.
        // Without skipWaiting + clientsClaim, the new SW installs in
        // the background but only activates when every tab of the
        // site is closed and reopened. Users on long-lived LMS tabs
        // (the entire point of this product) would see the OLD SPA
        // for hours after a deploy. Real complaint from the owner
        // after the Phase-14 ship: "I don't see any changes". This
        // forces the new SW to claim control of every open tab on
        // activation; the cleanupOutdatedCaches sweep also evicts
        // any stale precache entries from prior builds.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Phase-A R7.2.d — google-fonts runtimeCaching rule removed.
          // Fonts are self-hosted via @fontsource/* (see main.tsx) so
          // they're now same-origin woff2 emitted by Vite and picked
          // up by the workbox precache via `globPatterns: ["**/*.woff2"]`.
          // No third-party origin to intercept anymore.
          //
          // Never cache /api or /ai — those are dynamic and would
          // serve stale auth state from the SW cache. Phase-14.6
          // hardening; previously the SW's network-first default
          // could intercept any request after the page registered.
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/ai/"),
            handler: "NetworkOnly",
          },
        ],
        navigateFallbackDenylist: [
          // Don't let the SW intercept /api/* navigations (it shouldn't
          // since those aren't `navigate` events, but defense in depth).
          /^\/api\//,
          /^\/ai\//,
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 8000,
    host: true,
  },
  build: {
    target: "es2020",
    // Phase-A R7.1+R7.2 memo Q3 (owner choice): sourcemap stays ON.
    // Lighthouse impact is zero (sourcemaps are lazy-loaded by devtools
    // only, Best Practices audit weight=0). Debug ability for Phase B
    // integration is worth keeping. No secrets ship in the client
    // bundle, so the production surface risk is effectively zero.
    sourcemap: true,
    // Phase-A R7.1.a — manual chunks. Splits long-cached vendor code
    // out of the per-deploy main bundle. With React.lazy applied to
    // workspace routes (R7.1.b), the main chunk drops from ~241 KiB
    // (was 69.8% unused on /) to ~80-100 KiB, and the vendor chunks
    // stay in browser cache across deploys (content hash is stable
    // until a vendor upgrade).
    //
    // Chunks deliberately kept to 2 buckets (react + radix), not per-
    // package, to avoid HTTP/2 round-trip overhead from many tiny
    // requests. ui-shared bucket dropped (framer-motion isn't a dep
    // in this repo — confirmed via package.json audit).
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "radix-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    // Phase-14 R2: accept .ts/.tsx test files alongside .js/.jsx.
    include: ["tests/**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules", "dist", "storybook-static"],
  },
});
