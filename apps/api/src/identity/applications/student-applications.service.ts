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
  NotImplementedException,
} from "@nestjs/common";
import type { AppStatus, StudentApplication } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import {
  ALLOWED_TRANSITIONS,
  illegalTransitionMessage,
  isLegalTransition,
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
  constructor(private readonly prisma: PrismaService) {}

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

    // Commit B stub: ENROLLED transition routes through Commit D's
    // transactional side effect. Until that lands, refuse to advance.
    if (to === "ENROLLED") {
      throw new NotImplementedException(
        "ACCEPTED → ENROLLED side effect not yet implemented (Commit D ships the transactional find-or-create-or-link)",
      );
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

  // Re-exported so the spec can introspect the allowed graph.
  static getAllowedTransitions(): Record<AppStatus, AppStatus[]> {
    return ALLOWED_TRANSITIONS;
  }
}
