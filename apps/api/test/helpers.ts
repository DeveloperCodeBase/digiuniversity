// =====================================================
// Shared test helpers. Boots a real NestApplication once per Jest
// process (Jest's --runInBand keeps it single-threaded), and exposes
// utilities for creating throwaway tenants + users.
//
// Tests never share state via global variables; each spec creates its
// own tenant + users + tokens so a single Postgres instance can host
// many concurrent specs without interference.
// =====================================================

import "reflect-metadata";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";
import supertest from "supertest";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

let app: INestApplication | null = null;
let prisma: PrismaService | null = null;

export const getApp = async (): Promise<INestApplication> => {
  if (app) return app;
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication({ logger: ["warn", "error"] });
  app.setGlobalPrefix("v1", { exclude: ["docs", "docs-json"] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Trust the proxy chain (same setting main.ts uses in prod).
  app.getHttpAdapter().getInstance().set("trust proxy", true);
  await app.init();

  prisma = app.get(PrismaService);
  return app;
};

export const getRequest = async (): Promise<ReturnType<typeof supertest>> => {
  const a = await getApp();
  return supertest(a.getHttpServer());
};

export const getPrisma = async (): Promise<PrismaService> => {
  if (!prisma) await getApp();
  return prisma!;
};

export interface TestTenantSeed {
  tenantId: string;
  tenantSlug: string;
  admin: { id: string; email: string; password: string; accessToken: string };
  student: { id: string; email: string; password: string; accessToken: string };
}

/**
 * Provision a fresh tenant with the three default roles and one admin
 * + one student user, then log both in and return the access tokens.
 * Every name is suffixed with a uuid so multiple specs can run side
 * by side.
 */
export const createTestTenant = async (): Promise<TestTenantSeed> => {
  const p = await getPrisma();
  const req = await getRequest();
  const suffix = randomUUID().slice(0, 8);
  const slug = `test-${suffix}`;
  const adminEmail = `admin-${suffix}@test.local`;
  const studentEmail = `student-${suffix}@test.local`;
  const password = "TestPass!12345";
  const passwordHash = await bcrypt.hash(password, 4); // cheap rounds for tests

  // Tenant + roles
  const tenant = await p.tenant.create({
    data: {
      slug,
      name: `Test tenant ${suffix}`,
      roles: {
        create: [
          { name: "admin", label: "Admin" },
          { name: "instructor", label: "Instructor" },
          { name: "student", label: "Student" },
        ],
      },
    },
    include: { roles: true },
  });
  const adminRole = tenant.roles.find((r) => r.name === "admin")!;
  const studentRole = tenant.roles.find((r) => r.name === "student")!;

  // Users
  const adminUser = await p.user.create({
    data: {
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash,
      fullName: "Test Admin",
      userRoles: { create: [{ roleId: adminRole.id }] },
    },
  });
  const studentUser = await p.user.create({
    data: {
      tenantId: tenant.id,
      email: studentEmail,
      passwordHash,
      fullName: "Test Student",
      userRoles: { create: [{ roleId: studentRole.id }] },
    },
  });

  // Log them in via the real /auth/login so we get genuine JWTs.
  const adminLogin = await req
    .post("/v1/auth/login")
    .send({ tenantSlug: slug, email: adminEmail, password })
    .expect(200);
  const studentLogin = await req
    .post("/v1/auth/login")
    .send({ tenantSlug: slug, email: studentEmail, password })
    .expect(200);

  return {
    tenantId: tenant.id,
    tenantSlug: slug,
    admin: {
      id: adminUser.id,
      email: adminEmail,
      password,
      accessToken: adminLogin.body.accessToken,
    },
    student: {
      id: studentUser.id,
      email: studentEmail,
      password,
      accessToken: studentLogin.body.accessToken,
    },
  };
};

/** Build a tiny course tree under a tenant — faculty → ... → course. */
export const createDemoCourse = async (
  seed: TestTenantSeed,
): Promise<{ courseId: string; programId: string }> => {
  const req = await getRequest();
  const auth = `Bearer ${seed.admin.accessToken}`;
  const fac = await req
    .post("/v1/faculties")
    .set("Authorization", auth)
    .send({ slug: "eng", name: "Engineering" })
    .expect(201);
  const dep = await req
    .post("/v1/departments")
    .set("Authorization", auth)
    .send({ facultyId: fac.body.id, slug: "cs", name: "CS" })
    .expect(201);
  const prog = await req
    .post("/v1/programs")
    .set("Authorization", auth)
    .send({
      departmentId: dep.body.id,
      slug: "bsc-cs",
      name: "BSc CS",
      degreeLevel: "bachelor",
    })
    .expect(201);
  const course = await req
    .post("/v1/courses")
    .set("Authorization", auth)
    .send({ programId: prog.body.id, code: "CS-T01", title: "Test Course" })
    .expect(201);
  return { courseId: course.body.id, programId: prog.body.id };
};

afterAll(async () => {
  if (app) {
    await app.close();
    app = null;
    prisma = null;
  }
});
