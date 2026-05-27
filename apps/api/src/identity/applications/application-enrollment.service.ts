// apps/api/src/identity/applications/application-enrollment.service.ts
//
// Phase B R3.b Commit D (D71) — ACCEPTED → ENROLLED side effect.
//
// Q5.a refinement: find-or-create-or-link sequence inside a single
// Prisma $transaction. Eliminates the P2002 race that would arise if
// an applicant separately registered between submitting + admin
// accepting their application.
//
// Sequence for StudentApplication (Q5.a):
//   1. If application.userId is set → reuse that User.
//   2. If null:
//      a. Look up User by (tenantId, applicantEmail).
//      b. If found → LINK (set application.userId before the create).
//      c. If absent → CREATE User + Profile + queue NotificationLog
//         "user.password.claim" stub so the applicant can claim the
//         account when R-Notif ships the actual email.
//   3. Create Student row (studentCode derived from application.id).
//   4. Update application: status=ENROLLED + resultingStudentId + decidedAt.
//
// Parallel for InstructorApplication (Q6.a): step 3 creates Instructor
// + grants the `instructor` role on UserRole; no Enrollment row (admin
// uses R3.a's /v1/offerings/:id/instructor sub-endpoint to assign
// teaching loads).
//
// Whole sequence inside one $transaction — atomic. If any sub-step
// throws (e.g. (tenantId, email) UNIQUE collides because a third
// party signed up between steps 2a + 2c — exceedingly unlikely with
// the read-then-write race window), the transaction aborts and the
// application stays in ACCEPTED for the admin to retry.

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import type { Prisma, AppStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { hashPassword } from "../../auth/password";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Generate a deterministic-ish code from an application id. Application
 * ids are cuids; we take the last 6 chars uppercased so re-running the
 * side effect (which shouldn't happen — guarded by `status === "ACCEPTED"`
 * check inside the transaction) wouldn't collide on a different code.
 */
function codeFromApplicationId(prefix: string, applicationId: string): string {
  const suffix = applicationId.slice(-6).toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Generate a cryptographically-strong random password for newly-created
 * users. The applicant claims their account via the R-Notif password-
 * claim flow — they'll never need this string, and we never log it.
 * Length 32 chars from a 62-char alphabet = ~190 bits of entropy.
 */
function generateSecurePassword(): string {
  const bytes = randomBytes(24); // 192 bits raw
  return bytes.toString("base64url").slice(0, 32);
}

@Injectable()
export class ApplicationEnrollmentService {
  private readonly logger = new Logger(ApplicationEnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run the ACCEPTED → ENROLLED side effect for a StudentApplication.
   * Called by StudentApplicationsService.transition() when `to === "ENROLLED"`.
   *
   * Throws:
   * - NotFoundException if the application doesn't exist or is deleted
   * - BadRequestException if status !== "ACCEPTED" (state machine guard
   *   would already have rejected, but defense in depth)
   * - ConflictException if a third-party race in step 2c results in
   *   a duplicate User collision after we determined the User didn't exist
   */
  async enrollStudent(tenantId: string, actorUserId: string, applicationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const app = await tx.studentApplication.findFirst({
        where: { id: applicationId, tenantId, deletedAt: null },
      });
      if (!app) throw new NotFoundException("student application not found");
      if (app.status !== "ACCEPTED") {
        throw new BadRequestException(
          `student application must be ACCEPTED before ENROLLED side effect (current: ${app.status})`,
        );
      }
      if (app.resultingStudentId) {
        throw new BadRequestException(
          `student application already enrolled (resultingStudentId: ${app.resultingStudentId})`,
        );
      }

      // Q5.a find-or-create-or-link.
      const userId = await this.resolveOrCreateUser(tx, {
        tenantId,
        existingUserId: app.userId,
        email: app.applicantEmail,
        fullName: app.applicantFullName,
        applicationId: app.id,
        applicationType: "student",
        roleName: "student",
      });

      // Create the Student row.
      const studentCode = codeFromApplicationId("STU", app.id);
      const student = await tx.student.create({
        data: {
          tenantId,
          userId,
          studentCode,
          admissionDate: new Date(),
          status: "ENROLLED",
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
      });

      // Update the application — link the resulting Student + flip status.
      const enrolled = await tx.studentApplication.update({
        where: { id: app.id },
        data: {
          status: "ENROLLED" as AppStatus,
          userId, // ensure userId reflects the resolved User (was-null path)
          resultingStudentId: student.id,
          decidedAt: app.decidedAt ?? new Date(),
          decidedBy: app.decidedBy ?? actorUserId,
          updatedBy: actorUserId,
        },
      });

      this.logger.log(
        `Student enrolled: applicationId=${app.id} userId=${userId} studentId=${student.id} studentCode=${studentCode}`,
      );

      return enrolled;
    });
  }

  /**
   * Q6.a parallel: ACCEPTED → ENROLLED for InstructorApplication.
   * Differs from student variant: creates Instructor + grants the
   * `instructor` role on UserRole (no Enrollment row).
   */
  async enrollInstructor(tenantId: string, actorUserId: string, applicationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const app = await tx.instructorApplication.findFirst({
        where: { id: applicationId, tenantId, deletedAt: null },
      });
      if (!app) throw new NotFoundException("instructor application not found");
      if (app.status !== "ACCEPTED") {
        throw new BadRequestException(
          `instructor application must be ACCEPTED before ENROLLED side effect (current: ${app.status})`,
        );
      }
      if (app.resultingInstructorId) {
        throw new BadRequestException(
          `instructor application already enrolled (resultingInstructorId: ${app.resultingInstructorId})`,
        );
      }

      const userId = await this.resolveOrCreateUser(tx, {
        tenantId,
        existingUserId: app.userId,
        email: app.applicantEmail,
        fullName: app.applicantFullName,
        applicationId: app.id,
        applicationType: "instructor",
        roleName: "instructor",
      });

      // Q6.a — ensure the User holds the `instructor` role. resolveOrCreateUser
      // grants it during CREATE only; for REUSE/LINK paths we may need to
      // attach the role retroactively if the existing User doesn't have it.
      await this.ensureRoleGrant(tx, tenantId, userId, "instructor");

      const instructorCode = codeFromApplicationId("INS", app.id);
      const instructor = await tx.instructor.create({
        data: {
          tenantId,
          userId,
          instructorCode,
          departmentId: app.departmentId,
          rank: app.desiredRank,
          expertise: app.expertise,
          hireDate: new Date(),
          status: "ACTIVE",
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
      });

      const enrolled = await tx.instructorApplication.update({
        where: { id: app.id },
        data: {
          status: "ENROLLED" as AppStatus,
          userId,
          resultingInstructorId: instructor.id,
          decidedAt: app.decidedAt ?? new Date(),
          decidedBy: app.decidedBy ?? actorUserId,
          updatedBy: actorUserId,
        },
      });

      this.logger.log(
        `Instructor enrolled: applicationId=${app.id} userId=${userId} instructorId=${instructor.id} instructorCode=${instructorCode}`,
      );

      return enrolled;
    });
  }

  /**
   * Q5.a find-or-create-or-link User resolution. Runs inside the caller's
   * transaction (passed as `tx`) so the whole side effect is atomic.
   *
   * Returns the resolved userId in all paths. Side effects:
   * - REUSE / LINK: no User mutation; just returns the id.
   * - CREATE: creates User + Profile (auto-1:1 per Q2.a R3.a backfill
   *   pattern) + UserRole grant for the given roleName + queues a
   *   NotificationLog row for "user.password.claim" so the applicant
   *   can claim the account when R-Notif ships an actual email.
   *
   * The `applicationId` + `applicationType` are recorded on the
   * NotificationLog row so admin can trace back which application
   * triggered the password-claim email.
   */
  private async resolveOrCreateUser(
    tx: Prisma.TransactionClient,
    args: {
      tenantId: string;
      existingUserId: string | null;
      email: string;
      fullName: string;
      applicationId: string;
      applicationType: "student" | "instructor";
      roleName: "student" | "instructor";
    },
  ): Promise<string> {
    const { tenantId, existingUserId, email, fullName } = args;
    const normalizedEmail = email.toLowerCase();

    // Step 1 (Q5.a): reuse if applicant.userId already set.
    if (existingUserId) {
      this.logger.debug(
        `resolveOrCreateUser: REUSE existing User ${existingUserId} for application ${args.applicationId}`,
      );
      return existingUserId;
    }

    // Step 2a (Q5.a): look up by (tenantId, email).
    const existing = await tx.user.findUnique({
      where: { tenantId_email: { tenantId, email: normalizedEmail } },
      select: { id: true },
    });
    if (existing) {
      this.logger.debug(
        `resolveOrCreateUser: LINK existing User ${existing.id} (matched (tenantId, email)) for application ${args.applicationId}`,
      );
      return existing.id;
    }

    // Step 2c (Q5.a): create.
    const role = await tx.role.findUnique({
      where: { tenantId_name: { tenantId, name: args.roleName } },
      select: { id: true },
    });
    if (!role) {
      // Defensive — seed always provisions these. If absent, abort the
      // whole transaction so the admin sees the underlying configuration
      // issue rather than a half-created User.
      throw new ConflictException(
        `tenant missing required role '${args.roleName}' — cannot create applicant User`,
      );
    }

    const passwordHash = await hashPassword(generateSecurePassword());

    try {
      const created = await tx.user.create({
        data: {
          tenantId,
          email: normalizedEmail,
          passwordHash,
          fullName,
          userRoles: { create: [{ roleId: role.id }] },
          profile: { create: {} }, // R3.a Q2.a 1:1 backfill on create
        },
      });

      // Queue the password-claim notification stub (R-Notif sends it later).
      await tx.notificationLog.create({
        data: {
          tenantId,
          kind: "email",
          template: "user.password.claim",
          targetEmail: normalizedEmail,
          subject: "حساب کاربری شما در دیجی‌یونیورسیتی ایجاد شد",
          body:
            `سلام ${fullName}،\n` +
            `حساب کاربری شما در نتیجه‌ی پذیرش درخواست ${args.applicationType} ایجاد شد. ` +
            `با کلیک روی پیوند زیر می‌توانید رمز عبور خود را تنظیم کنید:\n\n` +
            `(پیوند ادعای رمز در فاز بعدی فعال خواهد شد.)\n\n— دیجی‌یونیورسیتی`,
          userId: created.id,
          ...(args.applicationType === "student"
            ? { studentApplicationId: args.applicationId }
            : { instructorApplicationId: args.applicationId }),
          status: "queued",
        },
      });

      this.logger.log(
        `resolveOrCreateUser: CREATE User ${created.id} + Profile + UserRole(${args.roleName}) + NotificationLog(user.password.claim) for application ${args.applicationId}`,
      );
      return created.id;
    } catch (err) {
      // P2002 = race: third party registered with same (tenantId, email)
      // between steps 2a (lookup) + 2c (create). Surface a precise error
      // so admin retries.
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        throw new ConflictException(
          `(tenantId, email) collision creating applicant User — likely a parallel registration race. Retry the ENROLLED transition; the second attempt will hit the LINK branch.`,
        );
      }
      throw err;
    }
  }

  /**
   * Ensure the given (userId, roleName) UserRole grant exists. Idempotent
   * — no-op if already granted. Used by enrollInstructor for the REUSE/LINK
   * path where the existing User may not yet hold the `instructor` role.
   */
  private async ensureRoleGrant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    userId: string,
    roleName: string,
  ): Promise<void> {
    const role = await tx.role.findUnique({
      where: { tenantId_name: { tenantId, name: roleName } },
      select: { id: true },
    });
    if (!role) {
      throw new ConflictException(
        `tenant missing required role '${roleName}' — cannot grant on ENROLLED`,
      );
    }
    const existing = await tx.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (!existing) {
      await tx.userRole.create({ data: { userId, roleId: role.id } });
      this.logger.log(`ensureRoleGrant: granted ${roleName} to user ${userId}`);
    }
  }
}
