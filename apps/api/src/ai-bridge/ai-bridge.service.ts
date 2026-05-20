import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

/**
 * Envelope shape returned by every ai-gateway endpoint. See
 * docs/architecture/AI_GATEWAY.md — these fields are mandated by AGENTS.md.
 */
export interface AiResponseEnvelope {
  request_id: string;
  model: string;
  provider: string;
  mode: string;
  confidence: number;
  human_review_required: boolean;
  payload: unknown;
}

/**
 * One thin seam between the core API and the ai-gateway. Every call goes
 * through `post()` so we always log to AiInteractionLog and never leak a
 * request whose envelope we'd otherwise forget to audit.
 */
@Injectable()
export class AiBridgeService {
  private readonly logger = new Logger(AiBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Call ai-gateway with `body` and persist the envelope to
   * AiInteractionLog scoped to the caller's tenant + user.
   *
   * Returns the envelope so the controller can hand it straight back to
   * the SPA (the SPA never talks to ai-gateway directly).
   */
  async post(args: {
    path: string;
    body: Record<string, unknown>;
    tenantId: string;
    userId: string;
  }): Promise<AiResponseEnvelope> {
    const base = this.config.get<string>("AI_GATEWAY_URL", "http://ai-gateway:8000");
    const url = base.replace(/\/+$/, "") + args.path;
    const started = Date.now();

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(args.body),
      });
    } catch (err) {
      this.logger.error(`ai-gateway POST ${url} failed: ${(err as Error).message}`);
      throw err;
    }

    let envelope: AiResponseEnvelope;
    try {
      envelope = (await res.json()) as AiResponseEnvelope;
    } catch (err) {
      this.logger.error(`ai-gateway returned non-JSON at ${url}: ${(err as Error).message}`);
      throw err;
    }
    if (!res.ok) {
      this.logger.warn(`ai-gateway ${url} returned ${res.status}`);
      throw new Error(`ai-gateway returned ${res.status}`);
    }

    const latencyMs = Date.now() - started;

    // Persist before returning so the audit can never be skipped by a
    // happy-path caller.
    try {
      await this.prisma.aiInteractionLog.create({
        data: {
          tenantId: args.tenantId,
          userId: args.userId,
          requestId: envelope.request_id,
          endpoint: args.path,
          model: envelope.model,
          provider: envelope.provider,
          mode: envelope.mode,
          confidence: envelope.confidence,
          humanReviewRequired: envelope.human_review_required,
          request: args.body as Prisma.InputJsonValue,
          response: envelope as unknown as Prisma.InputJsonValue,
          latencyMs,
        },
      });
    } catch (err) {
      // Don't fail the user-facing call because audit storage hiccuped —
      // but do scream so ops sees it.
      this.logger.error(
        `failed to persist AiInteractionLog for ${envelope.request_id}: ${(err as Error).message}`,
      );
    }

    return envelope;
  }
}
