// apps/api/src/university/course-offerings/course-offerings.service.ts
//
// Phase B R2 Commit B — CourseOffering business logic + state machine.
// The state machine for OfferingStatus is enforced here (not in the
// controller) so it survives controller refactors. Per D65 reminder
// #1, illegal transitions REJECT with 400; the matching e2e tests
// land in Commit E.

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { CourseOffering, OfferingStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

/**
 * Allowed status transitions per D65 R2-Reminder-1.
 *
 * Happy path: SCHEDULED → OPEN → ACTIVE → COMPLETED
 * Any state → CANCELED (admin escape hatch).
 * COMPLETED + CANCELED are terminal: nothing follows them (except
 * super_admin restore which would clear deletedAt, a separate flow).
 */
const ALLOWED_TRANSITIONS: Record<OfferingStatus, OfferingStatus[]> = {
  SCHEDULED: ["OPEN", "CANCELED"],
  OPEN: ["ACTIVE", "CANCELED"],
  ACTIVE: ["COMPLETED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
};

/**
 * Returns true if the requested transition is permitted by the
 * state machine. Same-state transitions return true (idempotent).
 */
export function isLegalTransition(from: OfferingStatus, to: OfferingStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

@Injectable()
export class CourseOfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, opts: { status?: OfferingStatus; programId?: string } = {}) {
    return this.prisma.courseOffering.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.programId ? { programId: opts.programId } : {}),
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        nameFa: true,
        nameEn: true,
        shortCode: true,
        startDate: true,
        endDate: true,
        capacity: true,
        mode: true,
        status: true,
        programId: true,
        legacyCohortId: true,
        // Phase B R3.a Commit E (D68 Q3.a) — instructor join. Filter by
        // deletedAt:null so soft-deleted instructors render as null (UI
        // shows "—"). The instructorId column itself stays set so admins
        // can see which instructor was assigned before deletion.
        instructorId: true,
        instructor: {
          where: { deletedAt: null },
          select: {
            id: true,
            instructorCode: true,
            rank: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: { select: { enrollments: { where: { deletedAt: null } } } },
      },
    });
  }

  async getById(tenantId: string, id: string) {
    const row = await this.prisma.courseOffering.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        // Phase B R3.a Commit E — surface the assigned instructor (with
        // soft-delete filter) so the admin detail view shows current
        // staffing without N+1.
        instructor: {
          where: { deletedAt: null },
          select: {
            id: true,
            instructorCode: true,
            rank: true,
            departmentId: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException("offering not found");
    return row;
  }

  async create(
    tenantId: string,
    userId: string,
    data: {
      programId: string;
      slug: string;
      nameFa: string;
      nameEn?: string;
      shortCode?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      capacity?: number;
      mode?: "SYNCHRONOUS" | "ASYNCHRONOUS" | "HYBRID";
      legacyCohortId?: string;
    },
  ): Promise<CourseOffering> {
    // Verify program belongs to tenant (cross-tenant defense).
    const program = await this.prisma.program.findFirst({
      where: { id: data.programId, tenantId, deletedAt: null },
    });
    if (!program) throw new BadRequestException("program not found in tenant");

    return this.prisma.courseOffering.create({
      data: {
        tenantId,
        programId: data.programId,
        slug: data.slug.toLowerCase(),
        nameFa: data.nameFa,
        nameEn: data.nameEn,
        shortCode: data.shortCode?.toUpperCase(),
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        capacity: data.capacity,
        mode: data.mode ?? "SYNCHRONOUS",
        status: "SCHEDULED",
        legacyCohortId: data.legacyCohortId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    data: Partial<{
      nameFa: string;
      nameEn: string;
      shortCode: string;
      description: string;
      startDate: Date;
      endDate: Date;
      capacity: number;
      mode: "SYNCHRONOUS" | "ASYNCHRONOUS" | "HYBRID";
    }>,
  ) {
    const existing = await this.prisma.courseOffering.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("offering not found");
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    return this.prisma.courseOffering.update({
      where: { id },
      data: {
        ...data,
        shortCode: data.shortCode ? data.shortCode.toUpperCase() : undefined,
        updatedBy: userId,
      },
    });
  }

  /**
   * State-machine-guarded transition. Per D65 R2-Reminder-1, illegal
   * transitions (e.g., ACTIVE → SCHEDULED) reject with 400. The e2e
   * spec in Commit E asserts each allowed + each illegal pair.
   */
  async transition(tenantId: string, userId: string, id: string, to: OfferingStatus) {
    const existing = await this.prisma.courseOffering.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("offering not found");
    if (!isLegalTransition(existing.status, to)) {
      throw new BadRequestException(
        `illegal transition: ${existing.status} → ${to}. Allowed from ${existing.status}: [${ALLOWED_TRANSITIONS[existing.status].join(", ") || "(none — terminal)"}]`,
      );
    }
    return this.prisma.courseOffering.update({
      where: { id },
      data: { status: to, updatedBy: userId },
    });
  }

  /**
   * Soft-delete is allowed at ANY status per D65 R2-Reminder-1.
   * Status is not changed; only `deletedAt` + `updatedBy`.
   */
  async softDelete(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.courseOffering.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("offering not found");
    await this.prisma.courseOffering.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return { deleted: true };
  }

  /**
   * Phase B R3.a Commit E (D68 Q3.a + D69) — assign or unassign an
   * Instructor to this CourseOffering. Pass `instructorId: null` (or
   * empty string from the UI) to unassign.
   *
   * Validation (per D69 explicit role-validation requirement):
   *   1. The offering exists in tenant (NotFoundException).
   *   2. If instructorId is non-null:
   *      a. The instructor exists in the SAME tenant + is not soft-deleted.
   *      b. The User backing that instructor holds the `instructor` role
   *         (BadRequestException with a precise message).
   *   3. Cross-tenant: rejected by (2a) — treats as not-in-tenant rather
   *      than leak instructor existence across tenants.
   *
   * The role check is intentionally service-layer (not DTO) so the
   * UserRole join + Role lookup stay in one place. Future R3.b
   * InstructorApplication acceptance side effect MAY also grant the
   * role; this guard ensures the offering never lands on a User who
   * isn't role-eligible.
   */
  async assignInstructor(
    tenantId: string,
    userId: string,
    offeringId: string,
    instructorId: string | null,
  ) {
    const offering = await this.prisma.courseOffering.findFirst({
      where: { id: offeringId, tenantId, deletedAt: null },
    });
    if (!offering) throw new NotFoundException("offering not found");

    if (instructorId === null || instructorId === "") {
      // Unassign — null out the FK. Idempotent if already null.
      return this.prisma.courseOffering.update({
        where: { id: offeringId },
        data: { instructorId: null, updatedBy: userId },
      });
    }

    // Look up the instructor + their User + the User's roles in a
    // single query so we can validate everything in one round-trip.
    const instructor = await this.prisma.instructor.findFirst({
      where: { id: instructorId, tenantId, deletedAt: null },
      include: {
        user: {
          include: {
            userRoles: { include: { role: { select: { name: true } } } },
          },
        },
      },
    });

    if (!instructor) {
      // Don't leak whether the instructor exists in another tenant —
      // treat cross-tenant the same as not-found.
      throw new BadRequestException("instructor not found in this tenant");
    }

    const roles = instructor.user.userRoles.map((ur) => ur.role.name);
    if (!roles.includes("instructor")) {
      throw new BadRequestException(
        `assigned user must hold the 'instructor' role (got [${roles.join(", ") || "(no roles)"}])`,
      );
    }

    return this.prisma.courseOffering.update({
      where: { id: offeringId },
      data: { instructorId, updatedBy: userId },
    });
  }
}
