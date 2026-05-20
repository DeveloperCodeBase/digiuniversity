import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async load(user: AuthenticatedUser, id: string) {
    const row = await this.prisma.assessment.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        course: { select: { id: true, code: true, title: true } },
        questions: {
          where: { deletedAt: null },
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            questions: { where: { deletedAt: null } },
            submissions: { where: { deletedAt: null } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException("assessment not found");
    return row;
  }

  /**
   * Hide `correctAnswer` from students. Instructors and admins see it
   * so they can review the answer key.
   */
  redactQuestionsForStudent(user: AuthenticatedUser, assessment: Awaited<ReturnType<AssessmentsService["load"]>>) {
    const isStaff = user.roles.includes("admin") || user.roles.includes("instructor");
    if (isStaff) return assessment;
    return {
      ...assessment,
      questions: assessment.questions.map((q) => ({
        ...q,
        correctAnswer: null,
      })),
    };
  }

  /**
   * Recompute totalPoints from the (non-deleted) question rows. Called
   * after every question mutation.
   */
  async recomputeTotalPoints(assessmentId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const sum = await client.question.aggregate({
      where: { assessmentId, deletedAt: null },
      _sum: { points: true },
    });
    const total = sum._sum.points ?? 0;
    await client.assessment.update({
      where: { id: assessmentId },
      data: { totalPoints: total },
    });
    return total;
  }

  async list(
    user: AuthenticatedUser,
    filters: { courseId?: string; status?: string; kind?: string },
  ) {
    return this.prisma.assessment.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.kind ? { kind: filters.kind } : {}),
      },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      include: {
        course: { select: { id: true, code: true, title: true } },
        _count: {
          select: {
            questions: { where: { deletedAt: null } },
            submissions: { where: { deletedAt: null } },
          },
        },
      },
      take: 200,
    });
  }

  async getById(user: AuthenticatedUser, id: string) {
    const row = await this.load(user, id);
    // Students may only see PUBLISHED or CLOSED assessments.
    const isStaff = user.roles.includes("admin") || user.roles.includes("instructor");
    if (!isStaff && row.status === "draft") {
      throw new ForbiddenException("assessment not yet published");
    }
    return this.redactQuestionsForStudent(user, row);
  }

  async create(
    user: AuthenticatedUser,
    dto: {
      courseId: string;
      kind: string;
      title: string;
      description?: string;
      instructions?: string;
      dueAt?: string;
      allowLate?: boolean;
    },
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!course) throw new BadRequestException("course not in this tenant");
    return this.prisma.assessment.create({
      data: {
        tenantId: user.tenantId,
        courseId: dto.courseId,
        kind: dto.kind,
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        allowLate: dto.allowLate ?? true,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    patch: {
      title?: string;
      description?: string;
      instructions?: string;
      status?: string;
      dueAt?: string;
      allowLate?: boolean;
    },
  ) {
    const existing = await this.load(user, id);
    const data: Record<string, unknown> = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.instructions !== undefined) data.instructions = patch.instructions;
    if (patch.allowLate !== undefined) data.allowLate = patch.allowLate;
    if (patch.dueAt !== undefined) data.dueAt = patch.dueAt ? new Date(patch.dueAt) : null;
    if (patch.status !== undefined) {
      data.status = patch.status;
      if (patch.status === "published" && !existing.publishedAt) data.publishedAt = new Date();
      if (patch.status === "closed" && !existing.closedAt) data.closedAt = new Date();
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    data.updatedBy = user.userId;
    return this.prisma.assessment.update({ where: { id }, data });
  }

  async softDelete(user: AuthenticatedUser, id: string) {
    await this.load(user, id);
    await this.prisma.assessment.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }

  // ---------- questions ----------

  async addQuestion(
    user: AuthenticatedUser,
    assessmentId: string,
    dto: {
      kind: string;
      prompt: string;
      options?: string[];
      correctAnswer?: number | number[] | string;
      points?: number;
      orderIndex?: number;
    },
  ) {
    const assessment = await this.load(user, assessmentId);
    if (assessment.kind !== "quiz") {
      throw new BadRequestException("only quizzes can have questions");
    }
    const question = await this.prisma.question.create({
      data: {
        tenantId: user.tenantId,
        assessmentId,
        kind: dto.kind,
        prompt: dto.prompt,
        options: dto.options as Prisma.InputJsonValue | undefined,
        correctAnswer:
          dto.correctAnswer !== undefined
            ? (dto.correctAnswer as Prisma.InputJsonValue)
            : undefined,
        points: dto.points ?? 1,
        orderIndex: dto.orderIndex ?? assessment.questions.length,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
    await this.recomputeTotalPoints(assessmentId);
    return question;
  }

  async updateQuestion(
    user: AuthenticatedUser,
    questionId: string,
    patch: {
      prompt?: string;
      options?: string[];
      correctAnswer?: number | number[] | string;
      points?: number;
      orderIndex?: number;
    },
  ) {
    const existing = await this.prisma.question.findFirst({
      where: { id: questionId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("question not found");
    const data: Record<string, unknown> = {};
    if (patch.prompt !== undefined) data.prompt = patch.prompt;
    if (patch.options !== undefined) data.options = patch.options as Prisma.InputJsonValue;
    if (patch.correctAnswer !== undefined)
      data.correctAnswer = patch.correctAnswer as Prisma.InputJsonValue;
    if (patch.points !== undefined) data.points = patch.points;
    if (patch.orderIndex !== undefined) data.orderIndex = patch.orderIndex;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    data.updatedBy = user.userId;
    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data,
    });
    if (patch.points !== undefined) {
      await this.recomputeTotalPoints(existing.assessmentId);
    }
    return updated;
  }

  async deleteQuestion(user: AuthenticatedUser, questionId: string) {
    const existing = await this.prisma.question.findFirst({
      where: { id: questionId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("question not found");
    await this.prisma.question.update({
      where: { id: questionId },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    await this.recomputeTotalPoints(existing.assessmentId);
    return { deleted: true };
  }
}
