import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AiBridgeService } from "../ai-bridge/ai-bridge.service";
import { LearningEventsService } from "../analytics/learning-events.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiBridgeService,
    private readonly events: LearningEventsService,
  ) {}

  // ---------- sessions ----------

  async createSession(
    user: AuthenticatedUser,
    input: { courseId?: string; title?: string },
  ) {
    if (input.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: input.courseId, tenantId: user.tenantId, deletedAt: null },
      });
      if (!course) throw new NotFoundException("course not in this tenant");
    }
    return this.prisma.tutorSession.create({
      data: {
        tenantId: user.tenantId,
        userId: user.userId,
        courseId: input.courseId,
        title: input.title?.trim() || "گفت‌و‌گوی جدید",
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });
  }

  async listMine(user: AuthenticatedUser) {
    return this.prisma.tutorSession.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.userId,
        deletedAt: null,
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: { _count: { select: { messages: true } } },
    });
  }

  private async loadSession(user: AuthenticatedUser, id: string) {
    const session = await this.prisma.tutorSession.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!session) throw new NotFoundException("tutor session not found");
    const isOwner = session.userId === user.userId;
    const isAdmin = user.roles.includes("admin");
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException("not your session");
    }
    return session;
  }

  async getSession(user: AuthenticatedUser, id: string) {
    const session = await this.loadSession(user, id);
    const messages = await this.prisma.tutorMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
    });
    return { ...session, messages };
  }

  async deleteSession(user: AuthenticatedUser, id: string) {
    const session = await this.loadSession(user, id);
    await this.prisma.tutorSession.update({
      where: { id: session.id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }

  // ---------- ask (the load-bearing endpoint) ----------

  async ask(
    user: AuthenticatedUser,
    sessionId: string,
    body: { question: string; topK?: number },
  ) {
    const session = await this.loadSession(user, sessionId);

    // Persist the user turn first so a downstream failure still keeps
    // the question history for the next retry.
    const userMessage = await this.prisma.tutorMessage.create({
      data: {
        tenantId: user.tenantId,
        sessionId: session.id,
        userId: user.userId,
        role: "user",
        content: body.question,
      },
    });

    const envelope = await this.ai.post({
      path: "/v1/rag/query",
      body: {
        tenant_id: user.tenantId,
        course_id: session.courseId ?? undefined,
        user_id: user.userId,
        query: body.question,
        top_k: body.topK ?? 5,
      },
      tenantId: user.tenantId,
      userId: user.userId,
    });

    const payload = (envelope.payload ?? {}) as {
      answer?: string;
      citations?: Array<{ id: string; title: string; score: number }>;
    };

    const assistantMessage = await this.prisma.tutorMessage.create({
      data: {
        tenantId: user.tenantId,
        sessionId: session.id,
        userId: null,
        role: "assistant",
        content: payload.answer ?? "(پاسخی دریافت نشد)",
        citations: (payload.citations as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
        aiRequestId: envelope.request_id,
        confidence: envelope.confidence,
        humanReviewRequired: envelope.human_review_required,
      },
    });

    await this.prisma.tutorSession.update({
      where: { id: session.id },
      data: { lastMessageAt: new Date(), updatedBy: user.userId },
    });

    await this.events.emit({
      tenantId: user.tenantId,
      userId: user.userId,
      type: "ai_tutor_asked",
      courseId: session.courseId,
      data: {
        sessionId: session.id,
        questionLength: body.question.length,
        confidence: envelope.confidence,
        humanReviewRequired: envelope.human_review_required,
      },
    });

    return {
      session: {
        id: session.id,
        title: session.title,
        courseId: session.courseId,
      },
      userMessage,
      assistantMessage,
      envelope,
    };
  }
}
