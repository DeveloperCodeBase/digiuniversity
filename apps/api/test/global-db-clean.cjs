// =====================================================================
// Jest globalSetup + globalTeardown (wired in jest.config.cjs to the same
// module, so it runs once before AND once after the whole suite).
//
// Why: the integration tests currently share the production Postgres
// (docker-compose api-test DATABASE_URL == the prod `api` service's). They
// create throwaway tenants slugged `test-<uuid8>` but never tear them down,
// so leftover rows from earlier runs accumulate and collide on the fixed
// slugs some specs use (CourseOffering "filt-a", School "ALP", ...). That
// surfaced as `Unique constraint failed on (tenantId, slug)` -> 400 in the
// R-CI capstone jest run (D88).
//
// This sweeps every `test-*` tenant; Tenant's relations are onDelete:
// Cascade, so children (users, roles, schools, programs, offerings,
// applications, ...) go with it. Scoped to the `test-` prefix so real
// tenants (demo, etc.) are never touched.
//
// Resilient by design: a cleanup failure must NOT abort the run (jest aborts
// if globalSetup throws), so everything is wrapped — worst case it's a no-op
// and the DB-state flakiness simply persists (jest is advisory until
// R-CI-Api). The proper fix — a disposable/ephemeral test DB instead of prod
// — is R-CI-Api scope.
// =====================================================================
const { PrismaClient } = require("@prisma/client");

module.exports = async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.tenant.deleteMany({
      where: { slug: { startsWith: "test-" } },
    });
    if (res.count > 0) {
      // eslint-disable-next-line no-console
      console.log(`[db-clean] removed ${res.count} leftover test tenant(s)`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[db-clean] skipped (non-fatal): ${err && err.message ? err.message : err}`,
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
};
