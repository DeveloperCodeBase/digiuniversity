import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Thin wrapper around PrismaClient so Nest can manage the lifecycle.
 *
 * Tenant isolation is enforced at the *controller* layer via the
 * `CurrentUser` decorator + `tenantId` parameter on every query — see
 * users.controller.ts and ai-logs.service.ts for the pattern. We picked
 * explicit filtering over a Prisma middleware after weighing the
 * trade-offs in ADR 0004.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Connected to Postgres");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
