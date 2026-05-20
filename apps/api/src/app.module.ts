import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AiBridgeModule } from "./ai-bridge/ai-bridge.module";
import { AiLogsModule } from "./ai-logs/ai-logs.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AssessmentsModule } from "./assessments/assessments.module";
import { TutorModule } from "./tutor/tutor.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";
import { HealthController } from "./health/health.controller";
import { LiveClassModule } from "./live-class/live-class.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TenantsModule } from "./tenants/tenants.module";
import { CohortsModule } from "./university/cohorts/cohorts.module";
import { CoursesModule } from "./university/courses/courses.module";
import { DepartmentsModule } from "./university/departments/departments.module";
import { EnrollmentsModule } from "./university/enrollments/enrollments.module";
import { FacultiesModule } from "./university/faculties/faculties.module";
import { ProgramsModule } from "./university/programs/programs.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    AiLogsModule,
    // University domain (Phase 3).
    FacultiesModule,
    DepartmentsModule,
    ProgramsModule,
    CoursesModule,
    CohortsModule,
    EnrollmentsModule,
    // Live class + AI bridge (Phase 6).
    AiBridgeModule,
    LiveClassModule,
    // Assessments + submissions (Phase 7).
    AssessmentsModule,
    // Learning events + analytics (Phase 8). Global so other modules
    // can inject LearningEventsService without re-importing.
    AnalyticsModule,
    // RAG-ready tutor (Phase 9).
    TutorModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: JwtAuthGuard runs first to populate req.user, then
    // RolesGuard reads the resolved roles. APP_GUARD execution order
    // follows declaration order.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
