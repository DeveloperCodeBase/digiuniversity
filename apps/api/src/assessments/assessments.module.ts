import { Module } from "@nestjs/common";

import { AiBridgeModule } from "../ai-bridge/ai-bridge.module";
import {
  AssessmentsController,
  QuestionsController,
} from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";

@Module({
  imports: [AiBridgeModule],
  controllers: [AssessmentsController, QuestionsController, SubmissionsController],
  providers: [AssessmentsService, SubmissionsService],
  exports: [AssessmentsService, SubmissionsService],
})
export class AssessmentsModule {}
