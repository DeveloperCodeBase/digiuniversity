import { Module } from "@nestjs/common";

import { AiBridgeModule } from "../ai-bridge/ai-bridge.module";
import { ClassSessionsController } from "./class-sessions.controller";
import { ClassSessionsService } from "./class-sessions.service";
import { LIVE_CLASS_PROVIDER, MockLiveClassProvider } from "./live-class.provider";
import { RecordingsController } from "./recordings.controller";

@Module({
  imports: [AiBridgeModule],
  controllers: [ClassSessionsController, RecordingsController],
  providers: [
    ClassSessionsService,
    // The provider behind `LIVE_CLASS_PROVIDER` is the single seam any
    // future LiveKit / BigBlueButton integration plugs into. Flip the
    // `useClass` and no controller changes.
    { provide: LIVE_CLASS_PROVIDER, useClass: MockLiveClassProvider },
  ],
  exports: [ClassSessionsService],
})
export class LiveClassModule {}
