import { Module } from "@nestjs/common";
import { FacultiesController } from "./faculties.controller";

@Module({ controllers: [FacultiesController] })
export class FacultiesModule {}
