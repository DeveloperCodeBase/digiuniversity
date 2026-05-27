// apps/api/src/identity/instructors/instructors.module.ts
// Phase B R3.a Commit D (D68) — Instructor module wiring.

import { Module } from "@nestjs/common";

import { SelfOrAdminGuard } from "../../auth/guards/self-or-admin.guard";
import { InstructorsController } from "./instructors.controller";

@Module({
  controllers: [InstructorsController],
  providers: [SelfOrAdminGuard],
})
export class InstructorsModule {}
