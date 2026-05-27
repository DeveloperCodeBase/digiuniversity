// apps/api/src/identity/applications/student-applications.module.ts
// Phase B R3.b Commit B (D71) — StudentApplication module wiring.
// Service exported so Commit D's side-effect orchestrator can reuse it.

import { Module } from "@nestjs/common";

import { StudentApplicationsController } from "./student-applications.controller";
import { StudentApplicationsService } from "./student-applications.service";

@Module({
  controllers: [StudentApplicationsController],
  providers: [StudentApplicationsService],
  exports: [StudentApplicationsService],
})
export class StudentApplicationsModule {}
