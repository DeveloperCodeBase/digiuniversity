import { ForbiddenException, Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

interface RiskFactor {
  key: string;
  label: string;
  contribution: number; // 0..1 — how much this *added* to risk
  detail: string;
}

interface RiskScore {
  score: number;       // 0..1
  band: "low" | "medium" | "high";
  factors: RiskFactor[];
  humanReviewRequired: true;
  // ML alternative lives behind /v1/ai/learning-risk/predict — see ADR 0008
  source: "rule-based-v1";
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- student-facing summary ----------

  async studentSummary(user: AuthenticatedUser) {
    const [enrollments, submissions, attendance, aiUses, recentEvents] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: {
          tenantId: user.tenantId,
          userId: user.userId,
          deletedAt: null,
        },
        include: { course: { select: { id: true, code: true, title: true } } },
      }),
      this.prisma.submission.findMany({
        where: {
          tenantId: user.tenantId,
          userId: user.userId,
          deletedAt: null,
        },
        select: {
          id: true,
          assessmentId: true,
          status: true,
          grade: true,
          autoScore: true,
          submittedAt: true,
        },
      }),
      this.prisma.attendance.count({
        where: { tenantId: user.tenantId, userId: user.userId },
      }),
      this.prisma.aiInteractionLog.count({
        where: { tenantId: user.tenantId, userId: user.userId },
      }),
      this.prisma.learningEvent.findMany({
        where: { tenantId: user.tenantId, userId: user.userId },
        orderBy: { occurredAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          courseId: true,
          assessmentId: true,
          classSessionId: true,
          occurredAt: true,
        },
      }),
    ]);

    const graded = submissions.filter((s) => typeof s.grade === "number");
    const averageGrade = graded.length
      ? graded.reduce((s, x) => s + (x.grade as number), 0) / graded.length
      : null;

    return {
      enrollments: {
        total: enrollments.length,
        active: enrollments.filter((e) => e.status === "active").length,
        completed: enrollments.filter((e) => e.status === "completed").length,
        withdrawn: enrollments.filter((e) => e.status === "withdrawn" || e.status === "dropped")
          .length,
        items: enrollments.map((e) => ({
          id: e.id,
          status: e.status,
          course: e.course,
        })),
      },
      submissions: {
        total: submissions.length,
        graded: graded.length,
        averageGrade: averageGrade !== null ? Number(averageGrade.toFixed(2)) : null,
      },
      sessions: { joined: attendance },
      aiInteractions: aiUses,
      recentEvents,
    };
  }

  // ---------- course-facing summary (staff) ----------

  async courseSummary(user: AuthenticatedUser, courseId: string) {
    // Sanity-check the course belongs to this tenant.
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!course) throw new ForbiddenException("course not in this tenant");

    const [enrolCounts, sessionsCount, submissionAgg, gradeAgg, sessionsJoined, recentEvents] =
      await Promise.all([
        this.prisma.enrollment.groupBy({
          by: ["status"],
          where: { tenantId: user.tenantId, courseId, deletedAt: null },
          _count: { _all: true },
        }),
        this.prisma.classSession.count({
          where: { tenantId: user.tenantId, courseId, deletedAt: null },
        }),
        this.prisma.submission.groupBy({
          by: ["status"],
          where: {
            tenantId: user.tenantId,
            assessment: { courseId, deletedAt: null },
            deletedAt: null,
          },
          _count: { _all: true },
        }),
        this.prisma.submission.aggregate({
          where: {
            tenantId: user.tenantId,
            assessment: { courseId, deletedAt: null },
            deletedAt: null,
            grade: { not: null },
          },
          _avg: { grade: true },
          _count: { grade: true },
        }),
        this.prisma.attendance.count({
          where: {
            tenantId: user.tenantId,
            classSession: { courseId, deletedAt: null },
          },
        }),
        this.prisma.learningEvent.findMany({
          where: { tenantId: user.tenantId, courseId },
          orderBy: { occurredAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            userId: true,
            assessmentId: true,
            classSessionId: true,
            occurredAt: true,
          },
        }),
      ]);

    const enrolByStatus = Object.fromEntries(enrolCounts.map((r) => [r.status, r._count._all]));
    const submByStatus = Object.fromEntries(submissionAgg.map((r) => [r.status, r._count._all]));

    return {
      course: { id: course.id, code: course.code, title: course.title },
      enrollments: enrolByStatus,
      classSessions: { total: sessionsCount, attendanceRecords: sessionsJoined },
      submissions: submByStatus,
      grades: {
        averaged: gradeAgg._count.grade,
        averageGrade:
          gradeAgg._avg.grade !== null
            ? Number(Number(gradeAgg._avg.grade).toFixed(2))
            : null,
      },
      recentEvents,
    };
  }

  // ---------- tenant-facing summary (admin) ----------

  async tenantSummary(user: AuthenticatedUser) {
    const [users, courses, sessions, submissions, gradeAgg, eventsAgg, aiUses] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId: user.tenantId, isActive: true },
      }),
      this.prisma.course.count({
        where: { tenantId: user.tenantId, deletedAt: null },
      }),
      this.prisma.classSession.count({
        where: { tenantId: user.tenantId, deletedAt: null },
      }),
      this.prisma.submission.count({
        where: { tenantId: user.tenantId, deletedAt: null },
      }),
      this.prisma.submission.aggregate({
        where: { tenantId: user.tenantId, deletedAt: null, grade: { not: null } },
        _avg: { grade: true },
      }),
      this.prisma.learningEvent.groupBy({
        by: ["type"],
        where: { tenantId: user.tenantId },
        _count: { _all: true },
      }),
      this.prisma.aiInteractionLog.count({
        where: { tenantId: user.tenantId },
      }),
    ]);

    return {
      users,
      courses,
      classSessions: sessions,
      submissions,
      averageGrade:
        gradeAgg._avg.grade !== null
          ? Number(Number(gradeAgg._avg.grade).toFixed(2))
          : null,
      aiInteractions: aiUses,
      eventsByType: Object.fromEntries(eventsAgg.map((r) => [r.type, r._count._all])),
    };
  }

  // ---------- explainable risk score ----------
  //
  // Rule-based MVP per ADR 0008. Every factor surfaces a string the UI
  // can render verbatim so a human reviewer understands *why* the
  // score is what it is — exactly the AI governance posture in AGENTS.md.

  async studentRisk(user: AuthenticatedUser, targetUserId?: string): Promise<RiskScore> {
    const isStaff = user.roles.includes("admin") || user.roles.includes("instructor");
    const userId = targetUserId && isStaff ? targetUserId : user.userId;

    const now = Date.now();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    const [enrollments, gradedSubs, sessions, lastEvent] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { tenantId: user.tenantId, userId, status: "active", deletedAt: null },
      }),
      this.prisma.submission.findMany({
        where: { tenantId: user.tenantId, userId, deletedAt: null, grade: { not: null } },
        select: { grade: true },
      }),
      this.prisma.classSession.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          courseId: undefined, // not filtering on course
          course: {
            enrollments: {
              some: { userId, status: "active", deletedAt: null },
            },
          },
          scheduledStart: { lt: new Date() },
        },
        select: { id: true },
      }),
      this.prisma.learningEvent.findFirst({
        where: { tenantId: user.tenantId, userId },
        orderBy: { occurredAt: "desc" },
        select: { occurredAt: true },
      }),
    ]);

    const factors: RiskFactor[] = [];

    // 1. Grade band
    const avgGrade = gradedSubs.length
      ? gradedSubs.reduce((s, x) => s + (x.grade as number), 0) / gradedSubs.length
      : null;
    if (avgGrade === null) {
      factors.push({
        key: "no_grades",
        label: "هیچ نمره ثبت‌شده‌ای وجود ندارد",
        contribution: 0.2,
        detail: "هنوز هیچ آزمون یا تکلیفی نمره‌گذاری نشده است.",
      });
    } else if (avgGrade < 50) {
      factors.push({
        key: "low_grade_average",
        label: "میانگین نمره پایین",
        contribution: 0.4,
        detail: `میانگین نمرات: ${avgGrade.toFixed(1)}/100`,
      });
    } else if (avgGrade < 70) {
      factors.push({
        key: "medium_grade_average",
        label: "میانگین نمره متوسط",
        contribution: 0.2,
        detail: `میانگین نمرات: ${avgGrade.toFixed(1)}/100`,
      });
    }

    // 2. Class attendance ratio
    const attendedSessions = await this.prisma.attendance.count({
      where: { tenantId: user.tenantId, userId },
    });
    if (sessions.length > 0) {
      const ratio = attendedSessions / sessions.length;
      if (ratio < 0.5) {
        factors.push({
          key: "low_attendance",
          label: "حضور کم در جلسات",
          contribution: 0.3,
          detail: `حضور در ${attendedSessions} از ${sessions.length} جلسه برگزارشده`,
        });
      }
    }

    // 3. Activity recency
    if (!lastEvent) {
      factors.push({
        key: "no_activity",
        label: "هیچ فعالیتی ثبت نشده است",
        contribution: 0.3,
        detail: "هیچ رویداد یادگیری برای این کاربر وجود ندارد.",
      });
    } else if (lastEvent.occurredAt < fourteenDaysAgo) {
      const days = Math.floor((now - lastEvent.occurredAt.getTime()) / 86_400_000);
      factors.push({
        key: "stale_activity",
        label: "فعالیت اخیر کاهش یافته است",
        contribution: 0.25,
        detail: `آخرین فعالیت ${days} روز پیش`,
      });
    }

    // 4. No active enrolments
    if (enrollments.length === 0) {
      factors.push({
        key: "no_active_enrollments",
        label: "هیچ دوره فعالی ندارد",
        contribution: 0.1,
        detail: "هیچ ثبت‌نام فعالی برای این کاربر وجود ندارد.",
      });
    }

    const rawScore = factors.reduce((s, f) => s + f.contribution, 0);
    const score = Math.min(1, Number(rawScore.toFixed(2)));
    const band: RiskScore["band"] = score < 0.3 ? "low" : score < 0.6 ? "medium" : "high";

    return {
      score,
      band,
      factors,
      humanReviewRequired: true,
      source: "rule-based-v1",
    };
  }
}
