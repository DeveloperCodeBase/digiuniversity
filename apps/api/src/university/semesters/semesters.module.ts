// Phase B B.1a — Semester module.
//
// Wires the SemestersController. Same minimal-module pattern as
// Faculties/Universities. PrismaService injected directly into the
// controller (no separate service class for this size).
import { Module } from "@nestjs/common";
import { SemestersController } from "./semesters.controller";

@Module({ controllers: [SemestersController] })
export class SemestersModule {}
