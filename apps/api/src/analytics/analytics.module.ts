import { Global, Module } from "@nestjs/common";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { LearningEventsController } from "./learning-events.controller";
import { LearningEventsService } from "./learning-events.service";

/**
 * Global so any feature module can inject `LearningEventsService` to
 * emit at the seams without re-importing the module everywhere.
 */
@Global()
@Module({
  controllers: [LearningEventsController, AnalyticsController],
  providers: [LearningEventsService, AnalyticsService],
  exports: [LearningEventsService, AnalyticsService],
})
export class AnalyticsModule {}
