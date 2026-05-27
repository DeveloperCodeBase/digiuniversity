import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // ============================================================
      // R-Landing-v2 Commit A (D47 + D45) — SW DISPOSED for demo window.
      // R-Landing-v1 broke under SW + Workbox precache amplification
      // (D41 postmortem). R7.0 memo (D42) will replace this with a
      // proper network-first cache strategy post-presentation. Until
      // then: PWA disabled, no SW generated, no precache.
      // Re-enable: remove this `disable` line + ship R7.0 changes.
      // ============================================================
      disable: true,
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
    // Phase-A R7.1.1.b — explicit cssCodeSplit. This IS the Vite
    // default but pinning here protects against a future config tweak
    // accidentally disabling it. Each route's CSS lives with its lazy
    // chunk; lazy-route CSS is fetched only on first nav, not on /.
    cssCodeSplit: true,
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
        manualChunks: (id) => {
          // Phase B R1 Commit I (D61 Constraint #2) — bundle the 4 admin
          // academic pages + their shared primitives into a single
          // `admin-academic-*.js` chunk. Keeps the main index chunk
          // free of admin code (regular students/instructors never
          // touch /admin/* so they shouldn't pay download cost).
          if (id.includes("/pages/admin/")) return "admin-academic";
          // Vendor buckets (pre-Phase-B): react + radix.
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-router-dom/")
          ) {
            return "react-vendor";
          }
          if (id.includes("/node_modules/@radix-ui/")) return "radix-vendor";
          return undefined;
        },
        // Prior object-form (pre-Phase-B-R1) is replaced by the function
        // above. Function form is required because object form can't
        // express "all files under /pages/admin/" without enumerating
        // each module path.
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
