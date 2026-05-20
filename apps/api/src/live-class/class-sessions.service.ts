import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { LearningEventsService } from "../analytics/learning-events.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import {
  LIVE_CLASS_PROVIDER,
  type LiveClassProvider,
} from "./live-class.provider";

const ALLOWED_STATUSES = ["scheduled", "live", "ended", "cancelled"] as const;
type Status = (typeof ALLOWED_STATUSES)[number];

@Injectable()
export class ClassSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LIVE_CLASS_PROVIDER) private readonly provider: LiveClassProvider,
    private readonly events: LearningEventsService,
  ) {}

  // ---------- helpers ----------

  private async loadTenantedSession(user: AuthenticatedUser, id: string) {
    const row = await this.prisma.classSession.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        course: { select: { id: true, code: true, title: true, programId: true } },
        host: { select: { id: true, email: true, fullName: true } },
        recording: true,
        _count: { select: { attendance: true } },
      },
    });
    if (!row) throw new NotFoundException("class session not found");
    return row;
  }

  private async ensureCanJoin(user: AuthenticatedUser, session: { id: string; courseId: string; joinPolicy: string; hostUserId: string | null; tenantId: string }) {
    const isAdmin = user.roles.includes("admin");
    const isInstructor = user.roles.includes("instructor");
    if (isAdmin || isInstructor) return; // staff always join
    if (session.joinPolicy === "public") return;
    // enrolled-only: must have an active enrolment in this course
    const enrolment = await this.prisma.enrollment.findFirst({
      where: {
        tenantId: user.tenantId,
        userId: user.userId,
        courseId: session.courseId,
        status: "active",
        deletedAt: null,
      },
    });
    if (!enrolment) {
      throw new ForbiddenException(
        "you must be actively enrolled in this course to join",
      );
    }
  }

  // ---------- CRUD ----------

  async list(
    user: AuthenticatedUser,
    filters: { courseId?: string; status?: Status } = {},
  ) {
    return this.prisma.classSession.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { scheduledStart: "asc" },
      include: {
        course: { select: { id: true, code: true, title: true } },
        host: { select: { id: true, email: true, fullName: true } },
        recording: { select: { id: true, status: true, durationSeconds: true } },
        _count: { select: { attendance: true } },
      },
      take: 200,
    });
  }

  async getById(user: AuthenticatedUser, id: string) {
    return this.loadTenantedSession(user, id);
  }

  async create(
    user: AuthenticatedUser,
    input: {
      courseId: string;
      title: string;
      description?: string;
      scheduledStart: string;
      scheduledEnd: string;
      joinPolicy?: string;
      hostUserId?: string;
    },
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: input.courseId, tenantId: user.tenantId, deletedAt: null },
    });
    if (!course) throw new BadRequestException("course not in this tenant");

    const start = new Date(input.scheduledStart);
    const end = new Date(input.scheduledEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("invalid scheduled times");
    }
    if (end <= start) {
      throw new BadRequestException("scheduledEnd must be after scheduledStart");
    }

    const hostId = input.hostUserId ?? user.userId;

    // Reserve the row first, then ask the provider to create the
    // meeting, then patch the provider fields. We do it in this order so
    // an external-provider failure leaves a `provider: 'mock' → joinUrl
    // null` row we can re-provision rather than a half-created meeting
    // with no DB record.
    const created = await this.prisma.classSession.create({
      data: {
        tenantId: user.tenantId,
        courseId: input.courseId,
        hostUserId: hostId,
        title: input.title,
        description: input.description,
        scheduledStart: start,
        scheduledEnd: end,
        joinPolicy: input.joinPolicy ?? "enrolled",
        provider: this.provider.key,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });

    const meeting = await this.provider.createMeeting({
      tenantSlug: user.tenantSlug,
      courseCode: course.code,
      sessionId: created.id,
      title: created.title,
      scheduledStart: start,
      scheduledEnd: end,
    });

    return this.prisma.classSession.update({
      where: { id: created.id },
      data: {
        providerMeetingId: meeting.providerMeetingId,
        joinUrl: meeting.joinUrl,
        updatedBy: user.userId,
      },
      include: {
        course: { select: { id: true, code: true, title: true } },
        host: { select: { id: true, email: true, fullName: true } },
      },
    });
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    patch: {
      title?: string;
      description?: string;
      scheduledStart?: string;
      scheduledEnd?: string;
      status?: Status;
      joinPolicy?: string;
    },
  ) {
    const existing = await this.loadTenantedSession(user, id);
    const data: Record<string, unknown> = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.joinPolicy !== undefined) data.joinPolicy = patch.joinPolicy;
    if (patch.scheduledStart !== undefined) {
      const d = new Date(patch.scheduledStart);
      if (Number.isNaN(d.getTime())) throw new BadRequestException("invalid scheduledStart");
      data.scheduledStart = d;
    }
    if (patch.scheduledEnd !== undefined) {
      const d = new Date(patch.scheduledEnd);
      if (Number.isNaN(d.getTime())) throw new BadRequestException("invalid scheduledEnd");
      data.scheduledEnd = d;
    }
    if (patch.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(patch.status)) {
        throw new BadRequestException("invalid status");
      }
      data.status = patch.status;
      if (patch.status === "live" && !existing.actualStart) data.actualStart = new Date();
      if (patch.status === "ended" && !existing.actualEnd) data.actualEnd = new Date();
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException("nothing to update");
    }
    data.updatedBy = user.userId;
    return this.prisma.classSession.update({ where: { id }, data });
  }

  async softDelete(user: AuthenticatedUser, id: string) {
    const existing = await this.loadTenantedSession(user, id);
    await this.prisma.classSession.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: "cancelled", updatedBy: user.userId },
    });
    return { deleted: true };
  }

  // ---------- attendance ----------

  async join(user: AuthenticatedUser, id: string) {
    const session = await this.loadTenantedSession(user, id);
    if (session.status === "cancelled" || session.deletedAt) {
      throw new BadRequestException("session is cancelled");
    }
    await this.ensureCanJoin(user, session);
    if (!session.providerMeetingId) {
      throw new BadRequestException("provider meeting not provisioned yet");
    }
    const { joinUrl } = await this.provider.getJoinUrl({
      providerMeetingId: session.providerMeetingId,
      user: { userId: user.userId, email: user.email, roles: user.roles },
    });
    const attendance = await this.prisma.attendance.create({
      data: {
        tenantId: user.tenantId,
        classSessionId: session.id,
        userId: user.userId,
      },
    });
    await this.events.emit({
      tenantId: user.tenantId,
      userId: user.userId,
      type: "class_joined",
      courseId: session.courseId,
      classSessionId: session.id,
      data: { attendanceId: attendance.id },
    });
    return {
      session: {
        id: session.id,
        title: session.title,
        provider: session.provider,
        providerMeetingId: session.providerMeetingId,
      },
      joinUrl,
      attendanceId: attendance.id,
    };
  }

  async leave(user: AuthenticatedUser, id: string) {
    const session = await this.loadTenantedSession(user, id);
    const last = await this.prisma.attendance.findFirst({
      where: { classSessionId: session.id, userId: user.userId, leftAt: null },
      orderBy: { joinedAt: "desc" },
    });
    if (!last) return { left: false };
    await this.prisma.attendance.update({
      where: { id: last.id },
      data: { leftAt: new Date() },
    });
    await this.events.emit({
      tenantId: user.tenantId,
      userId: user.userId,
      type: "class_left",
      courseId: session.courseId,
      classSessionId: session.id,
      data: { attendanceId: last.id },
    });
    return { left: true };
  }

  async attendance(user: AuthenticatedUser, id: string) {
    const session = await this.loadTenantedSession(user, id);
    const isStaff = user.roles.includes("admin") || user.roles.includes("instructor");
    if (!isStaff && session.hostUserId !== user.userId) {
      throw new ForbiddenException("attendance roster is staff-only");
    }
    return this.prisma.attendance.findMany({
      where: { classSessionId: session.id, tenantId: user.tenantId },
      orderBy: { joinedAt: "asc" },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
  }
}
