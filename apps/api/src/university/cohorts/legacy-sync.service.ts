// apps/api/src/university/cohorts/legacy-sync.service.ts
//
// Phase B R2 Commit C — Cohort ↔ CourseOffering dual-write interceptor.
//
// Per MIGRATION_POLICY §1 + §5, the rename window has the legacy and
// the new model BOTH live. This service is invoked from CohortsController
// mutations (create / update / softDelete) to keep CourseOffering in
// sync, and writes a MigrationSyncLog row each time.
//
// Per MIGRATION_POLICY §10 (rollback caveat), the sync is application-
// level (no Prisma FK constraint between Cohort.upgradedToOfferingId
// and CourseOffering.id) so a revert leaves the DB in a recoverable
// state without dropping data.
//
// The reverse direction (CourseOffering writes mirroring back to
// Cohort) is intentionally NOT implemented in R2 — new offerings are
// the source of truth going forward and we don't want legacy-only
// readers to start seeing rows that have no Cohort lineage. Cohort
// writes are the only sync source; CourseOffering reads are direct.

import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { CourseOfferingsService } from "../course-offerings/course-offerings.service";

interface CohortLike {
  id: string;
  tenantId: string;
  programId: string;
  slug: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  upgradedToOfferingId: string | null;
}

@Injectable()
export class LegacySyncService {
  private readonly log = new Logger("LegacySync");

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CourseOfferingsService))
    private readonly offerings: CourseOfferingsService,
  ) {}

  /**
   * Called from CohortsController.create after the cohort row lands.
   * Creates a matching CourseOffering (status SCHEDULED, mode SYNC)
   * and links it via legacyCohortId + Cohort.upgradedToOfferingId.
   * Writes a MigrationSyncLog row for audit + drop-gate metering.
   */
  async onCohortCreated(cohort: CohortLike, userId: string): Promise<void> {
    try {
      const offering = await this.offerings.create(cohort.tenantId, userId, {
        programId: cohort.programId,
        slug: `${cohort.slug}-offering`,
        nameFa: cohort.name,
        legacyCohortId: cohort.id,
        startDate: cohort.startDate ?? undefined,
        endDate: cohort.endDate ?? undefined,
      });
      await this.prisma.cohort.update({
        where: { id: cohort.id },
        data: { upgradedToOfferingId: offering.id },
      });
      await this.logSync(cohort.tenantId, "Cohort", "CourseOffering", cohort.id, offering.id, "create", userId);
    } catch (err) {
      // Sync failure must NOT block the cohort write that already
      // succeeded. Log + record a sync-error row; the cohort exists,
      // a follow-up reconciliation can mint the offering later.
      this.log.error(`onCohortCreated sync failed for cohort=${cohort.id}: ${(err as Error).message}`);
      await this.logSync(
        cohort.tenantId,
        "Cohort",
        "CourseOffering",
        cohort.id,
        null,
        "create-failed",
        userId,
        (err as Error).message,
      );
    }
  }

  /**
   * Mirrors a cohort update to its linked offering. No-ops if the
   * cohort has no upgradedToOfferingId yet (legacy-only rows pre
   * the dual-write era).
   */
  async onCohortUpdated(cohort: CohortLike, userId: string): Promise<void> {
    if (!cohort.upgradedToOfferingId) return;
    try {
      await this.offerings.update(cohort.tenantId, userId, cohort.upgradedToOfferingId, {
        nameFa: cohort.name,
        startDate: cohort.startDate ?? undefined,
        endDate: cohort.endDate ?? undefined,
      });
      await this.logSync(
        cohort.tenantId,
        "Cohort",
        "CourseOffering",
        cohort.id,
        cohort.upgradedToOfferingId,
        "update",
        userId,
      );
    } catch (err) {
      this.log.error(`onCohortUpdated sync failed cohort=${cohort.id}: ${(err as Error).message}`);
      await this.logSync(
        cohort.tenantId,
        "Cohort",
        "CourseOffering",
        cohort.id,
        cohort.upgradedToOfferingId,
        "update-failed",
        userId,
        (err as Error).message,
      );
    }
  }

  /**
   * Mirrors a cohort soft-delete. No-ops if no linked offering.
   * The offering is soft-deleted in turn (cascade behavior matches
   * Cohort intent: dropping a cohort drops its offering).
   */
  async onCohortDeleted(cohort: CohortLike, userId: string): Promise<void> {
    if (!cohort.upgradedToOfferingId) return;
    try {
      await this.offerings.softDelete(cohort.tenantId, userId, cohort.upgradedToOfferingId);
      await this.logSync(
        cohort.tenantId,
        "Cohort",
        "CourseOffering",
        cohort.id,
        cohort.upgradedToOfferingId,
        "delete",
        userId,
      );
    } catch (err) {
      this.log.error(`onCohortDeleted sync failed cohort=${cohort.id}: ${(err as Error).message}`);
      await this.logSync(
        cohort.tenantId,
        "Cohort",
        "CourseOffering",
        cohort.id,
        cohort.upgradedToOfferingId,
        "delete-failed",
        userId,
        (err as Error).message,
      );
    }
  }

  private async logSync(
    tenantId: string,
    source: string,
    target: string,
    rowId: string,
    targetId: string | null,
    action: string,
    syncedBy: string,
    notes?: string,
  ): Promise<void> {
    await this.prisma.migrationSyncLog.create({
      data: { tenantId, source, target, rowId, targetId, action, syncedBy, notes },
    });
  }
}
