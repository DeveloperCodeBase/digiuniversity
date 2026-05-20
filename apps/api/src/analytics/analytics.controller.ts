import { Controller, ForbiddenException, Get, Param, Query } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AnalyticsService } from "./analytics.service";

class StudentRiskQueryDto {
  @IsOptional() @IsString() userId?: string;
}

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Student-facing roll-up of "my numbers". */
  @Get("student/me")
  studentSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.analytics.studentSummary(user);
  }

  /** Same shape, addressable for staff by user id. Owner reads via /me. */
  @Roles("admin", "instructor")
  @Get("student/:userId")
  studentSummaryForStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
  ) {
    return this.analytics.studentSummary({ ...user, userId });
  }

  /** Course-level analytics. */
  @Roles("admin", "instructor")
  @Get("course/:courseId")
  courseSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("courseId") courseId: string,
  ) {
    return this.analytics.courseSummary(user, courseId);
  }

  /** Tenant-level analytics (admin only). */
  @Roles("admin")
  @Get("tenant")
  tenantSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.analytics.tenantSummary(user);
  }

  /**
   * Rule-based risk score for the current student. Always carries
   * `humanReviewRequired: true` — per AGENTS.md, no automated system
   * makes a final call about a learner.
   */
  @Get("risk/me")
  myRisk(@CurrentUser() user: AuthenticatedUser) {
    return this.analytics.studentRisk(user);
  }

  /** Staff version: risk for an arbitrary user in the tenant. */
  @Roles("admin", "instructor")
  @Get("risk/:userId")
  riskForUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
  ) {
    if (!user.roles.includes("admin") && !user.roles.includes("instructor")) {
      // Belt-and-suspenders — the guard already enforces this.
      throw new ForbiddenException("staff only");
    }
    return this.analytics.studentRisk(user, userId);
  }
}
