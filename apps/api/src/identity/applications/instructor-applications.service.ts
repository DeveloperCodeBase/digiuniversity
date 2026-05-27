// apps/api/src/identity/applications/instructor-applications.service.ts
//
// Phase B R3.b Commit B (D71) — InstructorApplication service.
//
// Parallel to StudentApplicationsService — shares the AppStatus state
// machine (Q1.a) + ALLOWED_TRANSITIONS via the types module. Differs
// in the ACCEPTED → ENROLLED side effect (Commit D, Q6.a) which
// additionally grants the `instructor` role on UserRole.
//
// Commit B scope identical to Student variant: admin list / get /
// transition (state machine validated; verification gate NOT YET
// enforced — Commit C) / soft-delete. ENROLLED stub-rejects.

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common";
import type { AppStatus, InstructorApplication } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import {
  ALLOWED_TRANSITIONS,
  illegalTransitionMessage,
  isLegalTransition,
} from "./applications.types";

const INSTRUCTOR_APP_SELECT = {
  id: true,
  tenantId: true,
  userId: true,
  departmentId: true,
  preferredDepartmentSlug: true,
  applicantFullName: true,
  applicantEmail: true,
  applicantPhone: true,
  applicantNationalId: true,
  applicantBio: true,
  desiredRank: true,
  expertise: true,
  cvUrl: true,
  applicantEmailVerifiedAt: true,
  applicantPhoneVerifiedAt: true,
  status: true,
  submittedAt: true,
  decidedAt: true,
  decidedBy: true,
  resultingInstructorId: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: { id: true, slug: true, name: true, nameEn: true },
  },
  user: {
    select: { id: true, email: true, fullName: true },
  },
} as const;

@Injectable()
export class InstructorApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    opts: { status?: AppStatus; departmentId?: string } = {},
  ) {
    return this.prisma.instructorApplication.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.departmentId ? { departmentId: opts.departmentId } : {}),
      },
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      select: INSTRUCTOR_APP_SELECT,
    });
  }

  async getById(tenantId: string, id: string) {
    const row = await this.prisma.instructorApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: INSTRUCTOR_APP_SELECT,
    });
    if (!row) throw new NotFoundException("instructor application not found");
    return row;
  }

  async transition(
    tenantId: string,
    actorUserId: string,
    id: string,
    to: AppStatus,
  ): Promise<InstructorApplication> {
    const existing = await this.prisma.instructorApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("instructor application not found");

    if (!isLegalTransition(existing.status, to)) {
      throw new BadRequestException(illegalTransitionMessage(existing.status, to));
    }
    if (existing.status === to) {
      return existing;
    }

    if (to === "ENROLLED") {
      throw new NotImplementedException(
        "ACCEPTED → ENROLLED side effect not yet implemented (Commit D ships the transactional find-or-create-or-link + instructor-role grant)",
      );
    }

    return this.prisma.instructorApplication.update({
      where: { id },
      data: {
        status: to,
        ...(to === "ACCEPTED" || to === "REJECTED" || to === "WITHDRAWN"
          ? { decidedAt: new Date(), decidedBy: actorUserId }
          : {}),
        updatedBy: actorUserId,
      },
    });
  }

  async softDelete(tenantId: string, actorUserId: string, id: string) {
    const existing = await this.prisma.instructorApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException("instructor application not found");
    await this.prisma.instructorApplication.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorUserId },
    });
    return { deleted: true, previousStatus: existing.status };
  }

  static getAllowedTransitions(): Record<AppStatus, AppStatus[]> {
    return ALLOWED_TRANSITIONS;
  }
}
