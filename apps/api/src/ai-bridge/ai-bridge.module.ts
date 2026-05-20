import { Module } from "@nestjs/common";
import { AiBridgeService } from "./ai-bridge.service";

@Module({
  providers: [AiBridgeService],
  exports: [AiBridgeService],
})
export class AiBridgeModule {}
