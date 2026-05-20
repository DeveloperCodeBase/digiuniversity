import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

interface EmitArgs {
  tenantId: string;
  userId?: string | null;
  type: string;
  courseId?: string | null;
  lessonId?: string | null;
  assessmentId?: string | null;
  classSessionId?: string | null;
  data?: Record<string, unknown> | null;
  occurredAt?: Date;
}

/**
 * Fire-and-forget event recorder. Internal services use `emit()` at
 * the seams where something measurable happens; the SPA writes
 * through the controller. Either path lands in the same table.
 *
 * `emit()` swallows DB errors on purpose — losing an event must never
 * fail a user-facing request. The logger is the safety net.
 */
@Injectable()
export class LearningEventsService {
  private readonly logger = new Logger(LearningEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async emit(args: EmitArgs): Promise<void> {
    try {
      await this.prisma.learningEvent.create({
        data: {
          tenantId: args.tenantId,
          userId: args.userId ?? null,
          type: args.type,
          courseId: args.courseId ?? null,
          lessonId: args.lessonId ?? null,
          assessmentId: args.assessmentId ?? null,
          classSessionId: args.classSessionId ?? null,
          data:
            args.data == null
              ? Prisma.JsonNull
              : (args.data as Prisma.InputJsonValue),
          ...(args.occurredAt ? { occurredAt: args.occurredAt } : {}),
        },
      });
    } catch (err) {
      this.logger.warn(
        `failed to emit '${args.type}' (tenant=${args.tenantId}, user=${args.userId ?? "—"}): ${(err as Error).message}`,
      );
    }
  }

  async listMine(args: {
    tenantId: string;
    userId: string;
    type?: string;
    courseId?: string;
    limit?: number;
  }) {
    return this.prisma.learningEvent.findMany({
      where: {
        tenantId: args.tenantId,
        userId: args.userId,
        ...(args.type ? { type: args.type } : {}),
        ...(args.courseId ? { courseId: args.courseId } : {}),
      },
      orderBy: { occurredAt: "desc" },
      take: Math.min(args.limit ?? 100, 500),
    });
  }

  async listForStaff(args: {
    tenantId: string;
    type?: string;
    courseId?: string;
    userId?: string;
    limit?: number;
  }) {
    return this.prisma.learningEvent.findMany({
      where: {
        tenantId: args.tenantId,
        ...(args.type ? { type: args.type } : {}),
        ...(args.courseId ? { courseId: args.courseId } : {}),
        ...(args.userId ? { userId: args.userId } : {}),
      },
      orderBy: { occurredAt: "desc" },
      take: Math.min(args.limit ?? 200, 1000),
    });
  }
}
