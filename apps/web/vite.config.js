import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
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
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
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
    sourcemap: true,
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
