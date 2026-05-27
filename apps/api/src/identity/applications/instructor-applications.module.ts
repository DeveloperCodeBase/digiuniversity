// apps/api/src/identity/applications/instructor-applications.module.ts
// Phase B R3.b Commit B (D71) — InstructorApplication module wiring.

import { Module } from "@nestjs/common";

import { ApplicationEnrollmentService } from "./application-enrollment.service";
import { InstructorApplicationsController } from "./instructor-applications.controller";
import { InstructorApplicationsService } from "./instructor-applications.service";

@Module({
  controllers: [InstructorApplicationsController],
  providers: [InstructorApplicationsService, ApplicationEnrollmentService],
  exports: [InstructorApplicationsService, ApplicationEnrollmentService],
})
export class InstructorApplicationsModule {}
