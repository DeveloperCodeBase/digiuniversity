// apps/api/src/identity/profiles/profiles.module.ts
// Phase B R3.a Commit B (D68 + D69) — Profile module wiring.
//
// SelfOrAdminGuard is provided so @UseGuards(SelfOrAdminGuard) on the
// controller resolves cleanly via Nest DI. Reflector is auto-injected.

import { Module } from "@nestjs/common";

import { SelfOrAdminGuard } from "../../auth/guards/self-or-admin.guard";
import { ProfilesController } from "./profiles.controller";

@Module({
  controllers: [ProfilesController],
  providers: [SelfOrAdminGuard],
  exports: [SelfOrAdminGuard],
})
export class ProfilesModule {}
