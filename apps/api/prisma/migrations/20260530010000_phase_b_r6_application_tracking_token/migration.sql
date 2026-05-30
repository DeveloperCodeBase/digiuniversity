-- Phase B R6 (D80) — applicant self-service tracking token.
--
-- Per MIGRATION_POLICY §4 (additive, nullable column — safe by default:
-- no backfill, no downtime, no dual-write):
--   • StudentApplication.trackingToken + InstructorApplication.trackingToken
--     — nullable TEXT, UNIQUE. Minted app-level in submitPublic (Commit B)
--     via crypto.randomBytes(24).toString("base64url") (192-bit). There is
--     deliberately NO DB DEFAULT: no Prisma/Postgres default reaches the
--     >=128-bit hardening floor (uuid v4 / gen_random_uuid() = 122-bit;
--     cuid is not crypto-random). See D80 stop-trigger #6 resolution.
--   • Nullable so only public submissions carry a token; pre-existing rows
--     and admin-created rows stay NULL (tracked via /admin/applications,
--     not a token). Postgres treats NULL as DISTINCT in a UNIQUE index, so
--     many NULL rows coexist — the unique constraint binds only minted
--     tokens (guards against the astronomically-unlikely 192-bit collision;
--     the service also regenerates on P2002, defense in depth).
--
-- Index names follow Prisma's `<Model>_<field>_key` convention so future
-- `prisma migrate` runs recognize them as managed (no drop/recreate).

ALTER TABLE "StudentApplication" ADD COLUMN "trackingToken" TEXT;
ALTER TABLE "InstructorApplication" ADD COLUMN "trackingToken" TEXT;

CREATE UNIQUE INDEX "StudentApplication_trackingToken_key"
  ON "StudentApplication"("trackingToken");
CREATE UNIQUE INDEX "InstructorApplication_trackingToken_key"
  ON "InstructorApplication"("trackingToken");
