import { Module } from "@nestjs/common";
import { CohortsController } from "./cohorts.controller";

@Module({ controllers: [CohortsController] })
export class CohortsModule {}
