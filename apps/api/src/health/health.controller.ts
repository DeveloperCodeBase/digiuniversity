import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async health(): Promise<{
    status: "ok" | "degraded";
    service: "api";
    version: string;
    timestamp: string;
    checks: { database: "ok" | "fail" };
  }> {
    let database: "ok" | "fail" = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "fail";
    }
    return {
      status: database === "ok" ? "ok" : "degraded",
      service: "api",
      version: process.env.APP_VERSION ?? "0.2.0",
      timestamp: new Date().toISOString(),
      checks: { database },
    };
  }
}
