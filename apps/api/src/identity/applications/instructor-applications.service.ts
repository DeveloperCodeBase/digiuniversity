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
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type {
  AppStatus,
  InstructorApplication,
  InstructorRank,
  Prisma,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { ApplicationEnrollmentService } from "./application-enrollment.service";
import {
  ALLOWED_TRANSITIONS,
  buildPublicApplicationView,
  generateTrackingToken,
  illegalTransitionMessage,
  isLegalTransition,
  isTrackingTokenCollision,
  PUBLIC_TRACK_ACTOR,
  type PublicApplicationView,
  UNDER_REVIEW_FORWARD_TARGETS,
  verificationGateMessage,
  verificationGateMissing,
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
  private readonly logger = new Logger(InstructorApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollment: ApplicationEnrollmentService,
  ) {}

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

    // Q4.a verification gate (Commit C). Same rules as student variant —
    // WITHDRAWN exit allowed even for unverified applicants.
    if (
      existing.status === "UNDER_REVIEW" &&
      UNDER_REVIEW_FORWARD_TARGETS.includes(to)
    ) {
      const missing = verificationGateMissing(existing);
      if (missing.length > 0) {
        throw new BadRequestException(verificationGateMessage(missing));
      }
    }

    if (to === "ENROLLED") {
      // Q6.a side effect — orchestrator creates Instructor + grants
      // `instructor` role + updates the application atomically.
      return this.enrollment.enrollInstructor(tenantId, actorUserId, id);
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

  /**
   * Q4.a admin verification escape hatch. Parallel to StudentApplication
   * variant — defers self-verification UX to R-Notif per D71 Q3.a.
   */
  async setEmailVerified(tenantId: string, actorUserId: string, id: string, verified: boolean) {
    const existing = await this.prisma.instructorApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("instructor application not found");
    return this.prisma.instructorApplication.update({
      where: { id },
      data: {
        applicantEmailVerifiedAt: verified ? new Date() : null,
        updatedBy: actorUserId,
      },
    });
  }

  async setPhoneVerified(tenantId: string, actorUserId: string, id: string, verified: boolean) {
    const existing = await this.prisma.instructorApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("instructor application not found");
    return this.prisma.instructorApplication.update({
      where: { id },
      data: {
        applicantPhoneVerifiedAt: verified ? new Date() : null,
        updatedBy: actorUserId,
      },
    });
  }

  static getAllowedTransitions(): Record<AppStatus, AppStatus[]> {
    return ALLOWED_TRANSITIONS;
  }

  // =====================================================================
  // Phase B R3.b Commit E (D71 Q8.a refinement) — public submission +
  // SelfOrAdmin self-read + WITHDRAW (parallel to StudentApplicationsService).
  // =====================================================================

  async submitPublic(input: {
    tenantId: string;
    departmentId?: string;
    preferredDepartmentSlug?: string;
    applicantFullName: string;
    applicantEmail: string;
    applicantPhone?: string;
    applicantNationalId?: string;
    applicantBio?: string;
    desiredRank?: InstructorRank;
    expertise?: string[];
    cvUrl?: string;
    actorUserId?: string | null;
  }): Promise<{ application: InstructorApplication; created: boolean }> {
    const normalizedEmail = input.applicantEmail.toLowerCase();

    // If departmentId provided, verify it exists in tenant.
    if (input.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: input.departmentId, tenantId: input.tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!dept) {
        throw new BadRequestException("departmentId not found in tenant");
      }
    }

    // Idempotency: (tenantId, applicantEmail) UNIQUE — single instructor app
    // per applicant per tenant.
    const existing = await this.prisma.instructorApplication.findUnique({
      where: {
        tenantId_applicantEmail: {
          tenantId: input.tenantId,
          applicantEmail: normalizedEmail,
        },
      },
    });

    let application: InstructorApplication;
    let created = false;

    if (existing) {
      if (existing.deletedAt) {
        throw new BadRequestException(
          "an earlier instructor application for this applicant was soft-deleted; contact admin to restore",
        );
      }
      // R6 (D80): backfill a tracking token on legacy/admin rows that
      // lack one so a re-submit always yields a working /track link.
      application = existing.trackingToken
        ? existing
        : await this.ensureTrackingToken(existing.id);
    } else {
      // R6 (D80): mint a 192-bit tracking token (app-level) on create.
      application = await this.createWithTrackingToken({
        tenantId: input.tenantId,
        departmentId: input.departmentId,
        preferredDepartmentSlug: input.preferredDepartmentSlug,
        applicantFullName: input.applicantFullName,
        applicantEmail: normalizedEmail,
        applicantPhone: input.applicantPhone,
        applicantNationalId: input.applicantNationalId,
        applicantBio: input.applicantBio,
        desiredRank: input.desiredRank,
        expertise: input.expertise ?? [],
        cvUrl: input.cvUrl,
        status: "SUBMITTED",
        userId: input.actorUserId ?? null,
        createdBy: input.actorUserId ?? null,
        updatedBy: input.actorUserId ?? null,
      });
      created = true;

      await this.prisma.notificationLog.create({
        data: {
          tenantId: input.tenantId,
          kind: "email",
          template: "application.submitted",
          targetEmail: normalizedEmail,
          subject: "درخواست همکاری شما دریافت شد",
          body:
            `سلام ${input.applicantFullName}،\n` +
            `درخواست همکاری شما به‌عنوان مدرس با شناسه ${application.id} ثبت شد. ` +
            `پس از بررسی، با شما تماس خواهیم گرفت.\n\n— دیجی‌یونیورسیتی`,
          instructorApplicationId: application.id,
          status: "queued",
        },
      });
    }

    await this.maybeFlagSpam(input.tenantId, normalizedEmail, application.id);
    return { application, created };
  }

  private async maybeFlagSpam(
    tenantId: string,
    applicantEmail: string,
    applicationId: string,
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.instructorApplication.count({
      where: { tenantId, applicantEmail, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount <= 3) return;

    const existingFlag = await this.prisma.notificationLog.findFirst({
      where: {
        tenantId,
        template: "application.spam.suspected",
        instructorApplicationId: applicationId,
      },
    });
    if (existingFlag) return;

    await this.prisma.notificationLog.create({
      data: {
        tenantId,
        kind: "in_app",
        template: "application.spam.suspected",
        subject: "احتمال spam در درخواست‌های ورودی (instructor)",
        body:
          `بیش از ${recentCount} درخواست همکاری در یک ساعت اخیر از ${applicantEmail} دریافت شده است. ` +
          `لطفاً بررسی کنید.`,
        instructorApplicationId: applicationId,
        status: "queued",
      },
    });
    this.logger.warn(
      `spam suspected (instructor): tenant=${tenantId} email=${applicantEmail} count=${recentCount}`,
    );
  }

  async getOwn(tenantId: string, userId: string) {
    const row = await this.prisma.instructorApplication.findFirst({
      where: { tenantId, userId, deletedAt: null },
      select: INSTRUCTOR_APP_SELECT,
    });
    if (!row) {
      throw new NotFoundException("no instructor application for this user");
    }
    return row;
  }

  async withdrawSelf(
    tenantId: string,
    actor: { userId: string; isAdmin: boolean },
    applicationId: string,
  ) {
    const app = await this.prisma.instructorApplication.findFirst({
      where: { id: applicationId, tenantId, deletedAt: null },
    });
    if (!app) throw new NotFoundException("instructor application not found");

    if (!actor.isAdmin) {
      if (app.userId == null || app.userId !== actor.userId) {
        throw new ForbiddenException(
          "only the application owner or an admin may withdraw this application",
        );
      }
    }

    return this.transition(tenantId, actor.userId, applicationId, "WITHDRAWN");
  }

  // ===================================================================
  // Phase B R6 (D80) — public anon tracking by token.
  // ===================================================================

  /** Create with a freshly-minted 192-bit tracking token; regenerate on
   *  the (astronomically unlikely) P2002 collision, up to 3 attempts. */
  private async createWithTrackingToken(
    data: Omit<Prisma.InstructorApplicationUncheckedCreateInput, "trackingToken">,
  ): Promise<InstructorApplication> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.instructorApplication.create({
          data: { ...data, trackingToken: generateTrackingToken() },
        });
      } catch (err) {
        lastErr = err;
        if (!isTrackingTokenCollision(err)) throw err;
      }
    }
    throw lastErr;
  }

  /** Backfill a tracking token on a row that lacks one (legacy / admin-
   *  created), so a re-submit always yields a working /track link. */
  private async ensureTrackingToken(id: string): Promise<InstructorApplication> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.instructorApplication.update({
          where: { id },
          data: { trackingToken: generateTrackingToken() },
        });
      } catch (err) {
        lastErr = err;
        if (!isTrackingTokenCollision(err)) throw err;
      }
    }
    throw lastErr;
  }

  /**
   * Public status read by tracking token. Returns the PII-masked view
   * (nationalId omitted, raw ids dropped, email/phone masked). Soft-
   * deleted rows + empty/unknown tokens → 404 (no enumeration leak).
   * The token is never logged.
   */
  async getByToken(token: string): Promise<PublicApplicationView> {
    const trimmed = (token ?? "").trim();
    if (!trimmed) {
      throw new NotFoundException("no application found for this tracking token");
    }
    const row = await this.prisma.instructorApplication.findFirst({
      where: { trackingToken: trimmed, deletedAt: null },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        decidedAt: true,
        applicantFullName: true,
        applicantEmail: true,
        applicantPhone: true,
        department: { select: { name: true } },
        preferredDepartmentSlug: true,
      },
    });
    if (!row) {
      throw new NotFoundException("no application found for this tracking token");
    }
    return buildPublicApplicationView({
      id: row.id,
      type: "instructor",
      status: row.status,
      submittedAt: row.submittedAt,
      decidedAt: row.decidedAt,
      applicantFullName: row.applicantFullName,
      applicantEmail: row.applicantEmail,
      applicantPhone: row.applicantPhone,
      departmentName: row.department?.name ?? row.preferredDepartmentSlug ?? null,
    });
  }

  /**
   * Public withdraw by tracking token. Reuses the canonical transition
   * path (state machine validates: terminal → 400; already-WITHDRAWN →
   * idempotent). Anon applicant has no User, so the public-track sentinel
   * actor is recorded. Returns the refreshed masked view.
   */
  async withdrawByToken(token: string): Promise<PublicApplicationView> {
    const trimmed = (token ?? "").trim();
    if (!trimmed) {
      throw new NotFoundException("no application found for this tracking token");
    }
    const row = await this.prisma.instructorApplication.findFirst({
      where: { trackingToken: trimmed, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!row) {
      throw new NotFoundException("no application found for this tracking token");
    }
    await this.transition(row.tenantId, PUBLIC_TRACK_ACTOR, row.id, "WITHDRAWN");
    return this.getByToken(trimmed);
  }
}
