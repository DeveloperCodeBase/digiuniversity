import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error"],
  });

  app.setGlobalPrefix("v1", { exclude: ["docs", "docs-json"] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // We sit behind nginx → host Caddy → CDN. Trust forwarded headers so
  // req.ip + req.protocol reflect the original client.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", true);

  // OpenAPI / Swagger — reachable publicly at https://digiuniversity.ir/api/docs
  // because the host Caddy strips `/api` before forwarding here.
  const swaggerConfig = new DocumentBuilder()
    .setTitle("DigiUniversity Core API")
    .setDescription(
      "Persian-first AI-Native University Platform. Every route except " +
        "those marked @Public() requires a Bearer access token issued by " +
        "POST /v1/auth/login.",
    )
    .setVersion(process.env.APP_VERSION ?? "0.3.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "access-token",
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs-json",
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  Logger.log(`api listening on :${port} (v1 prefix; swagger at /docs)`, "Bootstrap");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start api:", err);
  process.exit(1);
});
