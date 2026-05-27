// apps/api/src/university/cohorts/cohorts.module.ts
// Phase B R2 Commit C — Cohort legacy module with dual-write
// interceptor. CourseOfferingsModule imported so LegacySyncService
// can inject CourseOfferingsService.

import { Module, forwardRef } from "@nestjs/common";

import { CourseOfferingsModule } from "../course-offerings/course-offerings.module";
import { CohortsController } from "./cohorts.controller";
import { LegacySyncService } from "./legacy-sync.service";

@Module({
  imports: [forwardRef(() => CourseOfferingsModule)],
  controllers: [CohortsController],
  providers: [LegacySyncService],
  exports: [LegacySyncService],
})
export class CohortsModule {}
