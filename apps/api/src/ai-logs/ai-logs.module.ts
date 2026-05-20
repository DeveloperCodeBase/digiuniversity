import { Module } from "@nestjs/common";
import { AiLogsController } from "./ai-logs.controller";

@Module({
  controllers: [AiLogsController],
})
export class AiLogsModule {}
