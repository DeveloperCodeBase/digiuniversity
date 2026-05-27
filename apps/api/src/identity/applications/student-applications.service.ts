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
  ForbiddenException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(StudentApplicationsService.name);

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

  // =====================================================================
  // Phase B R3.b Commit E (D71 Q8.a refinement) — public submission +
  // SelfOrAdmin self-read + WITHDRAW.
  // =====================================================================

  /**
   * Public idempotent submission. The `@Public()` + `@Throttle` decorators
   * live on the controller; this method assumes the throttler has already
   * approved the request.
   *
   * Idempotency per Q8.a: if a row with the same (tenantId,
   * applicantEmail, programId) already exists (and is not soft-deleted),
   * return it instead of creating a duplicate. Caller distinguishes via
   * the `created` flag in the response so the HTTP layer can choose
   * 201 (new) vs 200 (existing).
   *
   * Spam-flag side effect: after the create/return, count how many
   * non-deleted submissions have arrived from this (tenantId,
   * applicantEmail) in the last hour. If >3, queue a NotificationLog
   * row with template "application.spam.suspected" so admin can filter
   * the inbox.
   */
  async submitPublic(input: {
    tenantId: string;
    programId: string;
    applicantFullName: string;
    applicantEmail: string;
    applicantPhone?: string;
    applicantNationalId?: string;
    applicantBio?: string;
    actorUserId?: string | null;
  }): Promise<{ application: StudentApplication; created: boolean }> {
    const normalizedEmail = input.applicantEmail.toLowerCase();

    // Verify the program exists in the tenant (cross-tenant guard).
    const program = await this.prisma.program.findFirst({
      where: { id: input.programId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!program) {
      throw new BadRequestException("program not found in tenant");
    }

    // Idempotency: existing non-deleted row → return it.
    const existing = await this.prisma.studentApplication.findUnique({
      where: {
        tenantId_applicantEmail_programId: {
          tenantId: input.tenantId,
          applicantEmail: normalizedEmail,
          programId: input.programId,
        },
      },
    });

    let application: StudentApplication;
    let created = false;

    if (existing) {
      if (existing.deletedAt) {
        // Soft-deleted row blocks re-application. Admin must explicitly
        // restore (out of R3.b scope) before applicant can re-submit.
        throw new BadRequestException(
          "an earlier application for this applicant + program was soft-deleted; contact admin to restore or use a different program",
        );
      }
      application = existing;
    } else {
      application = await this.prisma.studentApplication.create({
        data: {
          tenantId: input.tenantId,
          programId: input.programId,
          applicantFullName: input.applicantFullName,
          applicantEmail: normalizedEmail,
          applicantPhone: input.applicantPhone,
          applicantNationalId: input.applicantNationalId,
          applicantBio: input.applicantBio,
          status: "SUBMITTED",
          // If a logged-in user submitted, capture their id immediately.
          userId: input.actorUserId ?? null,
          createdBy: input.actorUserId ?? null,
          updatedBy: input.actorUserId ?? null,
        },
      });
      created = true;

      // application.submitted notification stub.
      await this.prisma.notificationLog.create({
        data: {
          tenantId: input.tenantId,
          kind: "email",
          template: "application.submitted",
          targetEmail: normalizedEmail,
          subject: "درخواست شما دریافت شد",
          body:
            `سلام ${input.applicantFullName}،\n` +
            `درخواست تحصیلی شما با شناسه ${application.id} ثبت شد. ` +
            `مدت بازبینی حدود ۱۴ روز است. در صورت تأیید، شما را از طریق ایمیل مطلع خواهیم کرد.\n\n— دیجی‌یونیورسیتی`,
          studentApplicationId: application.id,
          status: "queued",
        },
      });
    }

    // Q8.a spam-flag placeholder. Counts submissions from this email
    // in the last hour; if >3, queue an admin-visible spam notification.
    // The threshold + window are deliberately fuzzy — R-Notif will
    // promote this into proper rate-limit + spam-detection logic.
    await this.maybeFlagSpam(input.tenantId, normalizedEmail, application.id);

    return { application, created };
  }

  private async maybeFlagSpam(
    tenantId: string,
    applicantEmail: string,
    applicationId: string,
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.studentApplication.count({
      where: {
        tenantId,
        applicantEmail,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentCount <= 3) return;

    // Avoid duplicate spam-flag rows for the same hour-window.
    const existingFlag = await this.prisma.notificationLog.findFirst({
      where: {
        tenantId,
        template: "application.spam.suspected",
        studentApplicationId: applicationId,
      },
    });
    if (existingFlag) return;

    await this.prisma.notificationLog.create({
      data: {
        tenantId,
        kind: "in_app",
        template: "application.spam.suspected",
        subject: "احتمال spam در درخواست‌های ورودی",
        body:
          `بیش از ${recentCount} درخواست در یک ساعت اخیر از ${applicantEmail} دریافت شده است. ` +
          `لطفاً برای بررسی، فیلتر spam را در /admin/applications اعمال کنید.`,
        studentApplicationId: applicationId,
        status: "queued",
      },
    });
    this.logger.warn(
      `spam suspected: tenant=${tenantId} email=${applicantEmail} count=${recentCount} application=${applicationId}`,
    );
  }

  /**
   * Self-read for /v1/applications/student/me. Returns the authenticated
   * user's own application (matched by userId), or 404.
   */
  async getOwn(tenantId: string, userId: string) {
    const row = await this.prisma.studentApplication.findFirst({
      where: { tenantId, userId, deletedAt: null },
      select: STUDENT_APP_SELECT,
    });
    if (!row) {
      throw new NotFoundException("no student application for this user");
    }
    return row;
  }

  /**
   * SelfOrAdmin WITHDRAW. The applicant who owns the application (matched
   * by app.userId) can withdraw it; admins can withdraw on anyone's behalf.
   * Throws 403 if a non-admin authenticated user tries to withdraw an
   * application they don't own.
   *
   * The transition itself goes through the same ALLOWED_TRANSITIONS
   * check (only legal from non-terminal states). On terminal apps
   * (already ENROLLED/REJECTED/WITHDRAWN), throws 400 with the standard
   * illegal-transition message.
   */
  async withdrawSelf(
    tenantId: string,
    actor: { userId: string; isAdmin: boolean },
    applicationId: string,
  ) {
    const app = await this.prisma.studentApplication.findFirst({
      where: { id: applicationId, tenantId, deletedAt: null },
    });
    if (!app) throw new NotFoundException("student application not found");

    if (!actor.isAdmin) {
      if (app.userId == null || app.userId !== actor.userId) {
        throw new ForbiddenException(
          "only the application owner or an admin may withdraw this application",
        );
      }
    }

    // Reuse the canonical transition path so state-machine validation +
    // decidedAt/By stamping stay in one place.
    return this.transition(tenantId, actor.userId, applicationId, "WITHDRAWN");
  }
}
