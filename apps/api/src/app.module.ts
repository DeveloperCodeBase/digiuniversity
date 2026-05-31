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
// Phase B R3.a Commit B (D68) — Identity track (Profile/Student/Instructor).
import { IdentityModule } from "./identity/identity.module";
import { LiveClassModule } from "./live-class/live-class.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TenantsModule } from "./tenants/tenants.module";
import { CohortsModule } from "./university/cohorts/cohorts.module";
import { CourseOfferingsModule } from "./university/course-offerings/course-offerings.module";
import { CoursesModule } from "./university/courses/courses.module";
import { DepartmentsModule } from "./university/departments/departments.module";
import { EnrollmentsModule } from "./university/enrollments/enrollments.module";
import { FacultiesModule } from "./university/faculties/faculties.module";
import { ProgramsModule } from "./university/programs/programs.module";
import { SchoolsModule } from "./university/schools/schools.module";
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
    // skipIf disables throttling entirely when NODE_ENV=test (the api-test
    // compose service sets it). The integration suite boots the real
    // AppModule and runs --runInBand, so every request shares one in-memory
    // bucket keyed on the single loopback IP — without this, cumulative
    // volume across 120+ tests trips 429 and the suite is non-hermetic
    // (R-CI capstone D88). Prod is NODE_ENV=production, so the guard is
    // unchanged there. The proper per-test throttler control is R-CI-Api.
    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ttl: 60_000, limit: 600 }],
      skipIf: () => process.env.NODE_ENV === "test",
    }),
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
    // Phase B R1 Commit B (D62) — Schools sits above Faculty in the
    // Academic Hierarchy (per D63 Path A).
    SchoolsModule,
    FacultiesModule,
    DepartmentsModule,
    ProgramsModule,
    CoursesModule,
    CohortsModule,
    // Phase B R2 Commit B (D65) — CourseOffering ships alongside Cohort
    // during the Sunset window. LegacySyncService in Commit C ties them
    // together via the dual-write interceptor.
    CourseOfferingsModule,
    EnrollmentsModule,
    // Phase B R3.a Commit B (D68 + D69) — Identity foundation: Profile +
    // SelfOrAdminGuard primitive ship together. Student + Instructor
    // submodules land in C + D. State machines + Applications defer to R3.b.
    IdentityModule,
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
