// apps/api/src/identity/identity.module.ts
//
// Phase B R3.a (D68) — Identity track aggregator module.
//
// Combines Profile / Student / Instructor sub-modules so AppModule
// imports a single IdentityModule rather than three siblings. As R3.b
// lands (StudentApplication / InstructorApplication state machines),
// those modules will plug in here too.
//
// Commit B: Profile module only.
// Commit C: + Student module.
// Commit D: + Instructor module.

import { Module } from "@nestjs/common";

import { InstructorApplicationsModule } from "./applications/instructor-applications.module";
import { StudentApplicationsModule } from "./applications/student-applications.module";
import { InstructorsModule } from "./instructors/instructors.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { StudentsModule } from "./students/students.module";

@Module({
  imports: [
    ProfilesModule,
    StudentsModule,
    InstructorsModule,
    // Phase B R3.b Commit B (D71) — Applications (state machine + future
    // verification gate + future ENROLLED side effect). NotificationLog
    // module lands separately (Commit C with the verification PATCH, or
    // Commit E for the spam-flag write path).
    StudentApplicationsModule,
    InstructorApplicationsModule,
  ],
  exports: [
    ProfilesModule,
    StudentsModule,
    InstructorsModule,
    StudentApplicationsModule,
    InstructorApplicationsModule,
  ],
})
export class IdentityModule {}
