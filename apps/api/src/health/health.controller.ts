import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  health(): {
    status: "ok";
    service: "api";
    version: string;
    timestamp: string;
  } {
    return {
      status: "ok",
      service: "api",
      version: process.env.APP_VERSION ?? "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }
}
