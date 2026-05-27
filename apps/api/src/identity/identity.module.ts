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

import { ProfilesModule } from "./profiles/profiles.module";

@Module({
  imports: [ProfilesModule],
  exports: [ProfilesModule],
})
export class IdentityModule {}
