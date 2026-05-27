// apps/api/src/identity/applications/student-applications.service.ts
//
// Phase B R3.b Commit B (D71) — StudentApplication service.
//
// Commit B scope: admin list / get / transition (state machine only,
// verification gate NOT YET enforced — Commit C) / soft-delete.
// ACCEPTED → ENROLLED transitions throw NotImplementedException
// until Commit D wires the find-or-create-or-link side effect.
//
// Tenant-scoped on every read via the caller's tenantId. Soft-delete
// filter applied everywhere (deletedAt:null). Mirrors R2's
// CourseOfferingsService structure.

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppStatus, StudentApplication } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { ApplicationEnrollmentService } from "./application-enrollment.service";
import {
  ALLOWED_TRANSITIONS,
  illegalTransitionMessage,
  isLegalTransition,
  UNDER_REVIEW_FORWARD_TARGETS,
  verificationGateMessage,
  verificationGateMissing,
} from "./applications.types";

const STUDENT_APP_SELECT = {
  id: true,
  tenantId: true,
  userId: true,
  programId: true,
  applicantFullName: true,
  applicantEmail: true,
  applicantPhone: true,
  applicantNationalId: true,
  applicantBio: true,
  applicantEmailVerifiedAt: true,
  applicantPhoneVerifiedAt: true,
  status: true,
  submittedAt: true,
  decidedAt: true,
  decidedBy: true,
  resultingStudentId: true,
  createdAt: true,
  updatedAt: true,
  program: {
    select: { id: true, slug: true, name: true, nameEn: true, shortCode: true },
  },
  user: {
    select: { id: true, email: true, fullName: true },
  },
} as const;

@Injectable()
export class StudentApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    // Phase B R3.b Commit D — ENROLLED side effect orchestrator.
    private readonly enrollment: ApplicationEnrollmentService,
  ) {}

  async list(
    tenantId: string,
    opts: { status?: AppStatus; programId?: string } = {},
  ) {
    return this.prisma.studentApplication.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.programId ? { programId: opts.programId } : {}),
      },
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      select: STUDENT_APP_SELECT,
    });
  }

  async getById(tenantId: string, id: string) {
    const row = await this.prisma.studentApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: STUDENT_APP_SELECT,
    });
    if (!row) throw new NotFoundException("student application not found");
    return row;
  }

  /**
   * State-machine-validated transition. The verification gate (Q4.a)
   * lands in Commit C — until then, UNDER_REVIEW forward transitions
   * skip the gate. The ENROLLED side effect (Q5.a find-or-create-or-link)
   * lands in Commit D — until then, transitioning to ENROLLED throws
   * NotImplementedException so smoke can't trip a half-built path.
   */
  async transition(
    tenantId: string,
    actorUserId: string,
    id: string,
    to: AppStatus,
  ): Promise<StudentApplication> {
    const existing = await this.prisma.studentApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("student application not found");

    if (!isLegalTransition(existing.status, to)) {
      throw new BadRequestException(illegalTransitionMessage(existing.status, to));
    }
    if (existing.status === to) {
      // Idempotent no-op — return current state without re-writing decidedAt.
      return existing;
    }

    // Q4.a verification gate (Commit C). Only fires on forward exits
    // from UNDER_REVIEW; WITHDRAWN exit is allowed unconditionally so
    // applicants who never verified can still bail out.
    if (
      existing.status === "UNDER_REVIEW" &&
      UNDER_REVIEW_FORWARD_TARGETS.includes(to)
    ) {
      const missing = verificationGateMissing(existing);
      if (missing.length > 0) {
        throw new BadRequestException(verificationGateMessage(missing));
      }
    }

    // Commit D: ENROLLED routes through the transactional side-effect
    // orchestrator (Q5.a find-or-create-or-link + Student + Enrollment).
    // The orchestrator owns the entire $transaction including the
    // application status flip + resultingStudentId link.
    if (to === "ENROLLED") {
      return this.enrollment.enrollStudent(tenantId, actorUserId, id);
    }

    return this.prisma.studentApplication.update({
      where: { id },
      data: {
        status: to,
        // Stamp decidedAt/decidedBy only on terminal/decision states.
        ...(to === "ACCEPTED" || to === "REJECTED" || to === "WITHDRAWN"
          ? { decidedAt: new Date(), decidedBy: actorUserId }
          : {}),
        updatedBy: actorUserId,
      },
    });
  }

  async softDelete(tenantId: string, actorUserId: string, id: string) {
    const existing = await this.prisma.studentApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException("student application not found");
    await this.prisma.studentApplication.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorUserId },
    });
    return { deleted: true, previousStatus: existing.status };
  }

  /**
   * Q4.a caveat verification — admin manually flips the email-verified
   * timestamp. The actual end-user self-verification flow (email-token
   * landing page) defers to R-Notif per D71 Q3.a; this endpoint is the
   * admin escape hatch + the smoke-test path.
   *
   * Pass `verified=false` to clear the timestamp (revoke verification).
   */
  async setEmailVerified(tenantId: string, actorUserId: string, id: string, verified: boolean) {
    const existing = await this.prisma.studentApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("student application not found");
    return this.prisma.studentApplication.update({
      where: { id },
      data: {
        applicantEmailVerifiedAt: verified ? new Date() : null,
        updatedBy: actorUserId,
      },
    });
  }

  async setPhoneVerified(tenantId: string, actorUserId: string, id: string, verified: boolean) {
    const existing = await this.prisma.studentApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("student application not found");
    return this.prisma.studentApplication.update({
      where: { id },
      data: {
        applicantPhoneVerifiedAt: verified ? new Date() : null,
        updatedBy: actorUserId,
      },
    });
  }

  // Re-exported so the spec can introspect the allowed graph.
  static getAllowedTransitions(): Record<AppStatus, AppStatus[]> {
    return ALLOWED_TRANSITIONS;
  }
}
