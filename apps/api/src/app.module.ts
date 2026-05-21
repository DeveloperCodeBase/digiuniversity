import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AiBridgeModule } from "./ai-bridge/ai-bridge.module";
import { AiLogsModule } from "./ai-logs/ai-logs.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AssessmentsModule } from "./assessments/assessments.module";
import { AuditModule } from "./audit/audit.module";
import { AuthzModule } from "./authz/authz.module";
import { PoliciesGuard } from "./authz/policies.guard";
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
    // Phase-15 R4: per-IP rate limit. One global "default" bucket of
    // 600 requests/min handles authed and anonymous traffic alike; auth
    // endpoints override to 10/min via @Throttle, and the high-frequency
    // learning-events emit + health probe carry @SkipThrottle so they
    // never get blocked. req.ip is the real client IP because
    // `trust proxy: true` is set in main.ts (we sit behind Caddy +
    // nginx). In-memory store is fine while we run a single api
    // replica — swap to ThrottlerStorageRedisService once we scale out.
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 600 },
    ]),
    PrismaModule,
    AuthModule,
    // Phase-15 R2: audit-log infra. Global so AuditLogService is
    // injectable everywhere; APP_INTERCEPTOR auto-captures mutations.
    AuditModule,
    // Phase-15 R6: fine-grained authorization. Global so AbilityFactory
    // is injectable everywhere; PoliciesGuard runs after RolesGuard in
    // the APP_GUARD chain and only fires when a handler declares
    // @CheckPolicies. Migration-safe: endpoints without the decorator
    // pass through unaffected.
    AuthzModule,
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
    // Order matters: APP_GUARD execution follows declaration order.
    //   1. ThrottlerGuard — cap requests/IP before any DB work happens,
    //      so a flood of unauth POST /v1/auth/login can't pin the
    //      bcrypt loop. Auth endpoints override to a tighter bucket
    //      via @Throttle on the handler.
    //   2. JwtAuthGuard  — populate req.user (skipped on @Public).
    //   3. RolesGuard    — read resolved roles from req.user; coarse
    //                      gate by role name.
    //   4. PoliciesGuard — Phase-15 R6 fine-grained gate, fires only
    //                      when a handler declares @CheckPolicies.
    //                      Routes without the decorator pass through.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
})
export class AppModule {}
