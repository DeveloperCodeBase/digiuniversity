// apps/api/src/identity/students/students.module.ts
// Phase B R3.a Commit C (D68) — Student module wiring.
//
// SelfOrAdminGuard is provided locally so @UseGuards on the controller
// resolves cleanly even though it's also provided in ProfilesModule.
// Nest's DI per-module scope means each module that uses the guard
// needs its own provider entry (or the guard could be moved to a
// shared module — deferred until R3.b adds more consumers).

import { Module } from "@nestjs/common";

import { SelfOrAdminGuard } from "../../auth/guards/self-or-admin.guard";
import { StudentsController } from "./students.controller";

@Module({
  controllers: [StudentsController],
  providers: [SelfOrAdminGuard],
})
export class StudentsModule {}
