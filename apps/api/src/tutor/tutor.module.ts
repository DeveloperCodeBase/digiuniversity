import { Module } from "@nestjs/common";

import { AiBridgeModule } from "../ai-bridge/ai-bridge.module";
import { DocumentsController } from "./documents.controller";
import { TutorController } from "./tutor.controller";
import { TutorService } from "./tutor.service";

@Module({
  imports: [AiBridgeModule],
  controllers: [TutorController, DocumentsController],
  providers: [TutorService],
  exports: [TutorService],
})
export class TutorModule {}
