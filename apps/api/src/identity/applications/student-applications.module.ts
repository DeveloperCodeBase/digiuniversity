// apps/api/src/identity/applications/student-applications.module.ts
// Phase B R3.b Commit B (D71) — StudentApplication module wiring.
// Service exported so Commit D's side-effect orchestrator can reuse it.

import { Module } from "@nestjs/common";

import { ApplicationEnrollmentService } from "./application-enrollment.service";
import { StudentApplicationsController } from "./student-applications.controller";
import { StudentApplicationsService } from "./student-applications.service";

@Module({
  controllers: [StudentApplicationsController],
  // Commit D — both services provided here. Orchestrator is also used
  // by InstructorApplicationsModule, but Nest handles multiple-provider
  // registration cleanly when the class is provided in each importing
  // module's scope.
  providers: [StudentApplicationsService, ApplicationEnrollmentService],
  exports: [StudentApplicationsService, ApplicationEnrollmentService],
})
export class StudentApplicationsModule {}
