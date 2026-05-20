import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { AiBridgeService } from "../ai-bridge/ai-bridge.service";
import { LearningEventsService } from "../analytics/learning-events.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

interface QuizAnswerShape {
  selectedIndex?: number;
  selectedIndices?: number[];
  text?: string;
}

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiBridgeService,
    private readonly events: LearningEventsService,
  ) {}

  /**
   * Tally an auto-gradable quiz against its question key. Returns the
   * point total (capped at the assessment's `totalPoints`). Essay
   * questions never auto-score — they need a human or an AI draft.
   */
  private autoScoreQuiz(
    questions: Array<{
      id: string;
      kind: string;
      options?: unknown;
      correctAnswer?: unknown;
      points: number;
    }>,
    answers: Record<string, QuizAnswerShape>,
  ): { autoScore: number; gradable: number } {
    let earned = 0;
    let gradable = 0;
    for (const q of questions) {
      const a = answers[q.id];
      if (q.kind === "multiple_choice") {
        gradable += q.points;
        if (!a) continue;
        const ck = q.correctAnswer;
        // Single-answer
        if (typeof ck === "number" && a.selectedIndex === ck) earned += q.points;
        // Multi-answer: arrays must match as sets
        else if (Array.isArray(ck) && Array.isArray(a.selectedIndices)) {
          const want = new Set(ck.map(Number));
          const got = new Set(a.selectedIndices.map(Number));
          if (want.size === got.size && [...want].every((v) => got.has(v))) earned += q.points;
        }
      } else if (q.kind === "short_answer") {
        gradable += q.points;
        if (!a?.text) continue;
        if (
          typeof q.correctAnswer === "string" &&
          a.text.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        ) {
          earned += q.points;
        }
      }
      // essay → not auto-graded
    }
    return { autoScore: earned, gradable };
  }

  // ---------- student-facing ----------

  async submit(
    user: AuthenticatedUser,
    dto: {
      assessmentId: string;
      answers: Record<string, unknown>;
      finalize?: boolean;
    },
  ) {
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: dto.assessmentId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        questions: {
          where: { deletedAt: null },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    if (!assessment) throw new NotFoundException("assessment not found");
    if (assessment.status === "draft") {
      throw new ForbiddenException("assessment not yet published");
    }
    if (assessment.status === "closed" && !assessment.allowLate) {
      throw new ForbiddenException("assessment is closed; late submissions disabled");
    }

    // Auto-grade only for quizzes that are being finalised. Draft saves
    // skip grading entirely so a student isn't punished for navigating
    // away.
    let autoScore: number | null = null;
    let grade: number | null = null;
    if (dto.finalize && assessment.kind === "quiz") {
      const { autoScore: earned, gradable } = this.autoScoreQuiz(
        assessment.questions as Array<{
          id: string;
          kind: string;
          options?: unknown;
          correctAnswer?: unknown;
          points: number;
        }>,
        dto.answers as Record<string, QuizAnswerShape>,
      );
      autoScore = earned;
      // If every question is auto-gradable, we can also publish a final
      // grade. Mixed quizzes leave grade null for an instructor pass.
      const hasEssay = assessment.questions.some((q) => q.kind === "essay");
      if (!hasEssay && gradable > 0) {
        grade = Number(((earned / gradable) * 100).toFixed(2));
      }
    }

    const status = dto.finalize ? (grade !== null ? "graded" : "submitted") : "draft";

    const saved = await this.prisma.submission.upsert({
      where: {
        assessmentId_userId: { assessmentId: assessment.id, userId: user.userId },
      },
      create: {
        tenantId: user.tenantId,
        assessmentId: assessment.id,
        userId: user.userId,
        status,
        answers: dto.answers as Prisma.InputJsonValue,
        autoScore,
        grade,
        submittedAt: dto.finalize ? new Date() : null,
        gradedAt: grade !== null ? new Date() : null,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
      update: {
        // Students cannot edit a graded submission.
        ...(dto.finalize
          ? {
              status,
              answers: dto.answers as Prisma.InputJsonValue,
              autoScore,
              grade: grade ?? undefined,
              submittedAt: new Date(),
              gradedAt: grade !== null ? new Date() : null,
            }
          : {
              answers: dto.answers as Prisma.InputJsonValue,
            }),
        updatedBy: user.userId,
        deletedAt: null,
      },
    });

    if (dto.finalize) {
      await this.events.emit({
        tenantId: user.tenantId,
        userId: user.userId,
        type: assessment.kind === "quiz" ? "quiz_submitted" : "assignment_submitted",
        courseId: assessment.courseId,
        assessmentId: assessment.id,
        data: { autoScore, grade, status },
      });
    }

    return saved;
  }

  async listMine(user: AuthenticatedUser) {
    return this.prisma.submission.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.userId,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            kind: true,
            totalPoints: true,
            courseId: true,
          },
        },
      },
    });
  }

  async getMine(user: AuthenticatedUser, assessmentId: string) {
    return this.prisma.submission.findUnique({
      where: { assessmentId_userId: { assessmentId, userId: user.userId } },
    });
  }

  // ---------- staff-facing ----------

  async list(
    user: AuthenticatedUser,
    filters: { assessmentId?: string; userId?: string; status?: string },
  ) {
    return this.prisma.submission.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(filters.assessmentId ? { assessmentId: filters.assessmentId } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        assessment: {
          select: { id: true, title: true, kind: true, totalPoints: true },
        },
      },
      take: 500,
    });
  }

  async getById(user: AuthenticatedUser, id: string) {
    const row = await this.prisma.submission.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        assessment: {
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException("submission not found");
    return row;
  }

  async grade(
    user: AuthenticatedUser,
    id: string,
    dto: { grade: number; feedback?: string },
  ) {
    const row = await this.prisma.submission.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!row) throw new NotFoundException("submission not found");
    if (row.status === "draft") {
      throw new BadRequestException("cannot grade a draft submission");
    }
    if (dto.grade < 0 || dto.grade > 100) {
      throw new BadRequestException("grade must be between 0 and 100");
    }
    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        status: "graded",
        grade: dto.grade,
        feedback: dto.feedback,
        gradedAt: new Date(),
        gradedBy: user.userId,
        updatedBy: user.userId,
      },
    });
    await this.events.emit({
      tenantId: user.tenantId,
      userId: row.userId,
      type: "submission_graded",
      assessmentId: row.assessmentId,
      data: { grade: dto.grade, gradedBy: user.userId },
    });
    return updated;
  }

  /**
   * Ask ai-gateway for a draft grade. Stores the envelope in
   * `Submission.aiGradeDraft` AND in the global AiInteractionLog (the
   * bridge handles the second half). NOT a final grade — flagged as
   * `humanReviewRequired` per AGENTS.md.
   */
  async aiGradeDraft(user: AuthenticatedUser, id: string) {
    const submission = await this.getById(user, id);
    const envelope = await this.ai.post({
      path: "/v1/assessment/grade-draft",
      body: {
        tenant_id: user.tenantId,
        assessment_id: submission.assessmentId,
        submission_id: submission.id,
        student_id: submission.userId,
        questions: submission.assessment.questions.map((q) => ({
          id: q.id,
          kind: q.kind,
          prompt: q.prompt,
          options: q.options ?? undefined,
          points: q.points,
        })),
        answers: submission.answers,
      },
      tenantId: user.tenantId,
      userId: user.userId,
    });

    await this.prisma.submission.update({
      where: { id },
      data: {
        aiGradeDraft: envelope as unknown as Prisma.InputJsonValue,
        updatedBy: user.userId,
      },
    });

    return envelope;
  }
}
