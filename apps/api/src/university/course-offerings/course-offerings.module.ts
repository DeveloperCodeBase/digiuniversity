// apps/api/src/university/course-offerings/course-offerings.module.ts
// Phase B R2 Commit B — CourseOffering module wiring.
// Service is exported so Commit C's LegacySyncService (Cohort
// dual-write interceptor) can depend-inject it.

import { Module } from "@nestjs/common";

import { CourseOfferingsController } from "./course-offerings.controller";
import { CourseOfferingsService } from "./course-offerings.service";

@Module({
  controllers: [CourseOfferingsController],
  providers: [CourseOfferingsService],
  exports: [CourseOfferingsService],
})
export class CourseOfferingsModule {}
