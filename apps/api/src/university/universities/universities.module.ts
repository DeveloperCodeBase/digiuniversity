// Phase B B.1a — University module.
//
// Wires the UniversitiesController into the api's module tree. Following
// the existing Faculty/Department/Program convention (small modules with
// direct PrismaService DI, RBAC via @Roles + audit via @AuditAction).
import { Module } from "@nestjs/common";
import { UniversitiesController } from "./universities.controller";

@Module({ controllers: [UniversitiesController] })
export class UniversitiesModule {}
