import { Global, Module } from "@nestjs/common";

import { AbilityFactory } from "./ability.factory";
import { PoliciesGuard } from "./policies.guard";

/**
 * Phase-15 R6: AuthZ infra.
 *
 * `@Global()` so `AbilityFactory` injects anywhere — controllers
 * that want to compute abilities for the current user (for example
 * to ship them down to the SPA in the /v1/auth/me response) can
 * inject it directly without each module re-importing AuthzModule.
 *
 * PoliciesGuard is exported here too, but wired as `APP_GUARD` from
 * app.module.ts so it gates every controller automatically.
 */
@Global()
@Module({
  providers: [AbilityFactory, PoliciesGuard],
  exports: [AbilityFactory, PoliciesGuard],
})
export class AuthzModule {}
