import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "node:crypto";

/**
 * What every live-class provider must implement.
 *
 * Phase 6 ships only `MockLiveClassProvider`. When LiveKit or
 * BigBlueButton gets wired in, they implement this same shape and the
 * module's `useClass` flips — no controller code changes.
 */
export interface LiveClassProvider {
  /** Provider key persisted on ClassSession.provider. */
  readonly key: string;

  /**
   * Create a meeting on the provider side. Implementations should be
   * idempotent — calling twice for the same sessionId should return the
   * same meeting id (the mock provider hashes for determinism).
   */
  createMeeting(args: {
    tenantSlug: string;
    courseCode: string;
    sessionId: string;
    title: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  }): Promise<{ providerMeetingId: string; joinUrl: string }>;

  /**
   * Produce a join URL for `user` on an already-created meeting.
   * For the mock provider this is just a deterministic deep link.
   */
  getJoinUrl(args: {
    providerMeetingId: string;
    user: { userId: string; email: string; roles: string[] };
  }): Promise<{ joinUrl: string; expiresAt?: Date }>;

  /** Optional teardown. Mock returns immediately. */
  endMeeting(providerMeetingId: string): Promise<void>;
}

export const LIVE_CLASS_PROVIDER = Symbol("LIVE_CLASS_PROVIDER");

@Injectable()
export class MockLiveClassProvider implements LiveClassProvider {
  readonly key = "mock";
  private readonly logger = new Logger(MockLiveClassProvider.name);

  async createMeeting(args: {
    tenantSlug: string;
    courseCode: string;
    sessionId: string;
    title: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  }): Promise<{ providerMeetingId: string; joinUrl: string }> {
    // Deterministic id so re-running the seed or re-creating a stale
    // ClassSession lands on the same room. 12 hex chars is plenty for a
    // mock and is also small enough to print in logs.
    const meetingId =
      "mock_" +
      createHash("sha256")
        .update(`${args.tenantSlug}:${args.courseCode}:${args.sessionId}`)
        .digest("hex")
        .slice(0, 12);
    const joinUrl = `https://digiuniversity.ir/#classroom/${meetingId}`;
    this.logger.log(`[mock] createMeeting → ${meetingId}`);
    return { providerMeetingId: meetingId, joinUrl };
  }

  async getJoinUrl(args: {
    providerMeetingId: string;
    user: { userId: string; email: string; roles: string[] };
  }): Promise<{ joinUrl: string; expiresAt?: Date }> {
    // The mock layer doesn't sign tokens; the deep link is the join.
    // A real provider would mint a short-lived participant JWT here.
    const joinUrl = `https://digiuniversity.ir/#classroom/${args.providerMeetingId}?u=${encodeURIComponent(args.user.userId)}`;
    return { joinUrl };
  }

  async endMeeting(providerMeetingId: string): Promise<void> {
    this.logger.log(`[mock] endMeeting → ${providerMeetingId}`);
  }
}
