import { Module } from "@nestjs/common";
import { EnrollmentsController } from "./enrollments.controller";
import { EnrollmentsService } from "./enrollments.service";

// Phase B R4 (D73) — EnrollmentsService added for the admin surface +
// state machine. Exported so the R4 ApplicationEnrollmentService
// extension (Commit C) can reuse the manual-enroll/transition helpers
// if needed.
@Module({
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
