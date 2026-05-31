/**
 * Integration-test config — tests boot the real Nest application and
 * hit it over HTTP via supertest. They share a single Prisma client
 * pointed at the running Postgres (DATABASE_URL); each suite is
 * scoped to its own tenant slug so data never collides.
 *
 * See docs/TESTING.md for the strategy in full.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
  rootDir: ".",
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  testTimeout: 30_000,
  verbose: true,
  // R-CI capstone D88: tests share the (currently prod) DB, so leftover
  // `test-*` tenants from prior runs collide on fixed slugs. Sweep them
  // before AND after the run so DB-state never fails a re-run. Resilient:
  // the cleaner never throws. Disposable test DB = R-CI-Api.
  globalSetup: "<rootDir>/test/global-db-clean.cjs",
  globalTeardown: "<rootDir>/test/global-db-clean.cjs",
};
