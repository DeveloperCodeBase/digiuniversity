// apps/api/src/university/enrollments/enrollments.service.ts
//
// Phase B R4 Commit B (D73 + D74) — Enrollment admin business logic +
// the service-layer state machine (D74 Q2 = service-layer, NOT a
// Postgres enum).
//
// This service is the NEW R4 admin surface. The EXISTING
// enrollments.controller.ts (self-enroll, listMine, list, the RBAC
// status-change) is UNTOUCHED — D74 preserved it. The two coexist:
//   • existing PATCH /:id/status — student/instructor/admin RBAC, no
//     state-machine legality check (Phase-7 behavior, unchanged)
//   • new POST /:id/transition — admin-only, ALLOWED_TRANSITIONS-guarded
//     (the formal state machine for the /admin/enrollments page)
//
// Status stays a lowercase String to match existing data + the existing
// controller. The state machine validates legality at the value level.

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

// Lowercase to match the existing Enrollment.status String values +
// the existing controller's STATUSES const (D74 — no Postgres enum).
export type EnrollmentStatus = "active" | "completed" | "dropped" | "withdrawn";

/**
 * R4 Q2.a state machine (service-layer, D74). Same shape as R2/R3.b
 * ALLOWED_TRANSITIONS — just lowercase string keys instead of a
 * Postgres enum. ACTIVE is the only non-terminal state.
 *
 * NOTE: this governs the NEW admin POST /:id/transition endpoint only.
 * The existing PATCH /:id/status (student self-withdraw etc.) keeps its
 * Phase-7 RBAC semantics + does NOT route through here — preserving
 * backward compatibility per D74.
 */
export const ALLOWED_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  active: ["completed", "dropped", "withdrawn"],
  completed: [],
  dropped: [],
  withdrawn: [],
};

export function isLegalTransition(from: EnrollmentStatus, to: EnrollmentStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function illegalTransitionMessage(from: EnrollmentStatus, to: EnrollmentStatus): string {
  const next = ALLOWED_TRANSITIONS[from];
  return `illegal transition: ${from} → ${to}. Allowed from ${from}: [${
    next.length === 0 ? "(none — terminal)" : next.join(", ")
  }]`;
}

const ENROLLMENT_SELECT = {
  id: true,
  tenantId: true,
  userId: true,
  courseId: true,
  cohortId: true,
  offeringId: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, fullName: true } },
  course: { select: { id: true, code: true, title: true } },
  offering: {
    select: { id: true, slug: true, nameFa: true, nameEn: true, programId: true },
  },
} as const;

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin list with R4 filters (offeringId / status / programId via the
   * offering join). Distinct from the existing controller's GET / which
   * filters courseId/userId — this powers the /admin/enrollments page.
   */
  async adminList(
    tenantId: string,
    opts: { offeringId?: string; status?: EnrollmentStatus; programId?: string } = {},
  ) {
    return this.prisma.enrollment.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(opts.offeringId ? { offeringId: opts.offeringId } : {}),
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.programId ? { offering: { programId: opts.programId } } : {}),
      },
      orderBy: { enrolledAt: "desc" },
      select: ENROLLMENT_SELECT,
      take: 500,
    });
  }

  async getById(tenantId: string, id: string) {
    const row = await this.prisma.enrollment.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: ENROLLMENT_SELECT,
    });
    if (!row) throw new NotFoundException("enrollment not found");
    return row;
  }

  /**
   * Admin manual enroll — enroll a User into a CourseOffering (program-
   * term admission, courseId null) AND/OR a Course (course-level). At
   * least one of offeringId / courseId must be provided.
   *
   * Cross-tenant guards on userId / offeringId / courseId. Idempotency:
   *   • course-level → relies on the existing @@unique([tenantId, userId,
   *     courseId]); a duplicate active course enrollment → 400.
   *   • program-term → relies on the partial unique index (one active
   *     admission per (tenantId, userId, offeringId) WHERE courseId IS
   *     NULL); duplicate → 400.
   */
  async manualEnroll(
    tenantId: string,
    actorUserId: string,
    data: { userId: string; offeringId?: string; courseId?: string },
  ) {
    if (!data.offeringId && !data.courseId) {
      throw new BadRequestException("provide at least one of offeringId or courseId");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { tenantId: true },
    });
    if (!targetUser || targetUser.tenantId !== tenantId) {
      throw new BadRequestException("userId does not exist in this tenant");
    }

    if (data.offeringId) {
      const offering = await this.prisma.courseOffering.findFirst({
        where: { id: data.offeringId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!offering) throw new BadRequestException("offeringId not found in this tenant");
    }
    if (data.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: data.courseId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!course) throw new BadRequestException("courseId not found in this tenant");
    }

    try {
      return await this.prisma.enrollment.create({
        data: {
          tenantId,
          userId: data.userId,
          offeringId: data.offeringId ?? null,
          courseId: data.courseId ?? null,
          status: "active",
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        select: ENROLLMENT_SELECT,
      });
    } catch (err) {
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        throw new BadRequestException(
          data.courseId
            ? "user already has an active enrollment in this course"
            : "user already has an active program-term admission for this offering",
        );
      }
      throw err;
    }
  }

  /**
   * Admin state-machine transition (R4 Q2.a, D74 service-layer). Validates
   * legality via ALLOWED_TRANSITIONS; illegal → 400 with the «Allowed
   * from X» message (R2/R3.b shape). Stamps completedAt on → completed.
   */
  async transition(tenantId: string, actorUserId: string, id: string, to: EnrollmentStatus) {
    const existing = await this.prisma.enrollment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("enrollment not found");

    const from = existing.status as EnrollmentStatus;
    if (!isLegalTransition(from, to)) {
      throw new BadRequestException(illegalTransitionMessage(from, to));
    }
    if (from === to) return existing;

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        status: to,
        completedAt: to === "completed" ? new Date() : existing.completedAt,
        updatedBy: actorUserId,
      },
      select: ENROLLMENT_SELECT,
    });
  }

  async softDelete(tenantId: string, actorUserId: string, id: string) {
    const existing = await this.prisma.enrollment.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException("enrollment not found");
    await this.prisma.enrollment.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorUserId },
    });
    return { deleted: true, previousStatus: existing.status };
  }
}
