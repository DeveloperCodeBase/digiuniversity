// Phase B R4 Commit D (D73 + D74) — Enrollment API e2e spec.
//
// Covers:
//   • Admin manual enroll (program-term / course-level / both / neither /
//     cross-tenant / duplicate via partial unique)
//   • State machine (admin transition): legal, illegal, terminal lock,
//     completedAt stamp
//   • ENROLLED side effect creates a program-term Enrollment (Q0.a) when
//     targetOfferingId set; Student-only when null (Q1.a no-regression);
//     resultingEnrollmentId back-link (Q5.a); cross-program reject
//   • setTargetOffering validation (same-program / cross-program / tenant)
//   • ⚠️ EXISTING-FLOW REGRESSION (D74 mandate): student self-enroll +
//     withdraw still work after R4 changes
//   • Soft-delete + re-enroll after soft-delete (partial unique behavior)
//
// Pattern matches apps/api/test/applications-r3b.spec.ts.

import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

import { createTestTenant, getPrisma, getRequest, type TestTenantSeed } from "./helpers";

async function seedProgramTree(tenantId: string) {
  const prisma = await getPrisma();
  const sx = randomUUID().slice(0, 6);
  const school = await prisma.school.create({ data: { tenantId, slug: `r4-${sx}-sch`, nameFa: "علوم R4" } });
  const faculty = await prisma.faculty.create({ data: { tenantId, slug: `r4-${sx}-fac`, name: "Faculty R4", schoolId: school.id } });
  const department = await prisma.department.create({ data: { tenantId, facultyId: faculty.id, slug: `r4-${sx}-dept`, name: "Dept R4" } });
  const program = await prisma.program.create({
    data: { tenantId, departmentId: department.id, slug: `r4-${sx}-prog`, name: "BSc R4", degreeLevel: "bachelor" },
  });
  const course = await prisma.course.create({
    data: { tenantId, programId: program.id, code: `R4-${sx}`, title: "R4 Course" },
  });
  const offering = await prisma.courseOffering.create({
    data: { tenantId, programId: program.id, slug: `r4-${sx}-off`, nameFa: "ترم R4" },
  });
  return { program, course, offering };
}

async function createUser(tenantSlug: string, tenantId: string, roleNames: string[]) {
  const prisma = await getPrisma();
  const req = await getRequest();
  const sx = randomUUID().slice(0, 8);
  const email = `r4-${sx}@test.local`;
  const password = "TestPass!12345";
  const passwordHash = await bcrypt.hash(password, 4);
  const roles = await prisma.role.findMany({ where: { tenantId, name: { in: roleNames } } });
  const user = await prisma.user.create({
    data: { tenantId, email, passwordHash, fullName: `R4 User ${sx}`, userRoles: { create: roles.map((r) => ({ roleId: r.id })) } },
  });
  const login = await req.post("/v1/auth/login").send({ tenantSlug, email, password }).expect(200);
  return { id: user.id, email, password, accessToken: login.body.accessToken };
}

// =====================================================================
// Admin manual enroll
// =====================================================================

describe("@phase-b-r4 admin manual enroll", () => {
  it("program-term enroll (offeringId, no courseId) → 201 with courseId null", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { offering } = await seedProgramTree(seed.tenantId);
    const u = await createUser(seed.tenantSlug, seed.tenantId, ["student"]);
    const res = await req
      .post("/v1/enrollments/manual")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ userId: u.id, offeringId: offering.id })
      .expect(201);
    expect(res.body.offeringId).toBe(offering.id);
    expect(res.body.courseId).toBeNull();
    expect(res.body.status).toBe("active");
  });

  it("course-level enroll (courseId) → 201", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { course } = await seedProgramTree(seed.tenantId);
    const u = await createUser(seed.tenantSlug, seed.tenantId, ["student"]);
    const res = await req
      .post("/v1/enrollments/manual")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ userId: u.id, courseId: course.id })
      .expect(201);
    expect(res.body.courseId).toBe(course.id);
  });

  it("neither offeringId nor courseId → 400", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const u = await createUser(seed.tenantSlug, seed.tenantId, ["student"]);
    const res = await req
      .post("/v1/enrollments/manual")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ userId: u.id })
      .expect(400);
    expect(res.body.message).toMatch(/at least one of offeringId or courseId/);
  });

  it("cross-tenant userId → 400", async () => {
    const req = await getRequest();
    const a = await createTestTenant();
    const b = await createTestTenant();
    const { offering } = await seedProgramTree(a.tenantId);
    const res = await req
      .post("/v1/enrollments/manual")
      .set("Authorization", `Bearer ${a.admin.accessToken}`)
      .send({ userId: b.student.id, offeringId: offering.id })
      .expect(400);
    expect(res.body.message).toMatch(/does not exist in this tenant/);
  });

  it("duplicate program-term admission → 400 (partial unique)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { offering } = await seedProgramTree(seed.tenantId);
    const u = await createUser(seed.tenantSlug, seed.tenantId, ["student"]);
    const auth = `Bearer ${seed.admin.accessToken}`;
    await req.post("/v1/enrollments/manual").set("Authorization", auth).send({ userId: u.id, offeringId: offering.id }).expect(201);
    const dup = await req
      .post("/v1/enrollments/manual")
      .set("Authorization", auth)
      .send({ userId: u.id, offeringId: offering.id })
      .expect(400);
    expect(dup.body.message).toMatch(/program-term admission/);
  });

  it("re-enroll allowed after soft-delete (partial unique respects deletedAt)", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const { offering } = await seedProgramTree(seed.tenantId);
    const u = await createUser(seed.tenantSlug, seed.tenantId, ["student"]);
    const auth = `Bearer ${seed.admin.accessToken}`;
    const first = await req.post("/v1/enrollments/manual").set("Authorization", auth).send({ userId: u.id, offeringId: offering.id }).expect(201);
    // soft-delete it
    await req.delete(`/v1/enrollments/${first.body.id}`).set("Authorization", auth).expect(200);
    // re-enroll now allowed (partial unique has WHERE deletedAt IS NULL)
    const second = await req.post("/v1/enrollments/manual").set("Authorization", auth).send({ userId: u.id, offeringId: offering.id }).expect(201);
    expect(second.body.id).not.toBe(first.body.id);
    // sanity: the soft-deleted row is gone from admin GET
    await req.get(`/v1/enrollments/${first.body.id}`).set("Authorization", auth).expect(404);
  });
});

// =====================================================================
// State machine (admin transition)
// =====================================================================

describe("@phase-b-r4 admin transition state machine", () => {
  async function seedActiveEnrollment(seed: TestTenantSeed) {
    const req = await getRequest();
    const { offering } = await seedProgramTree(seed.tenantId);
    const u = await createUser(seed.tenantSlug, seed.tenantId, ["student"]);
    const res = await req
      .post("/v1/enrollments/manual")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ userId: u.id, offeringId: offering.id })
      .expect(201);
    return res.body.id as string;
  }

  it("active → completed legal; completedAt stamped", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const id = await seedActiveEnrollment(seed);
    const res = await req
      .post(`/v1/enrollments/${id}/transition`)
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ to: "completed" })
      .expect(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.completedAt).not.toBeNull();
  });

  it("illegal transition (completed → active) → 400 with terminal message", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const id = await seedActiveEnrollment(seed);
    await req.post(`/v1/enrollments/${id}/transition`).set("Authorization", auth).send({ to: "completed" }).expect(200);
    const res = await req
      .post(`/v1/enrollments/${id}/transition`)
      .set("Authorization", auth)
      .send({ to: "active" })
      .expect(400);
    expect(res.body.message).toMatch(/Allowed from completed:/);
    expect(res.body.message).toMatch(/none — terminal/);
  });
});

// =====================================================================
// ENROLLED side effect creates Enrollment (closes D72)
// =====================================================================

describe("@phase-b-r4 ENROLLED side effect → Enrollment", () => {
  async function submitAndAccept(seed: TestTenantSeed, programId: string, withTargetOffering: string | null) {
    const req = await getRequest();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const email = `r4-enr-${randomUUID().slice(0, 8)}@test.local`;
    const submitted = await req
      .post("/v1/applications/student")
      .send({ tenantSlug: seed.tenantSlug, programId, applicantFullName: "R4 Enroll", applicantEmail: email })
      .expect(201);
    const id = submitted.body.id;
    if (withTargetOffering) {
      await req.patch(`/v1/applications/student/${id}/target-offering`).set("Authorization", auth).send({ offeringId: withTargetOffering }).expect(200);
    }
    await req.post(`/v1/applications/student/${id}/transition`).set("Authorization", auth).send({ to: "UNDER_REVIEW" }).expect(200);
    await req.patch(`/v1/applications/student/${id}/verify-email`).set("Authorization", auth).expect(200);
    await req.patch(`/v1/applications/student/${id}/verify-phone`).set("Authorization", auth).expect(200);
    await req.post(`/v1/applications/student/${id}/transition`).set("Authorization", auth).send({ to: "ACCEPTED" }).expect(200);
    return id;
  }

  it("targetOffering set → ENROLLED creates program-term Enrollment + back-link", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const { program, offering } = await seedProgramTree(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;
    const appId = await submitAndAccept(seed, program.id, offering.id);

    const enrolled = await req
      .post(`/v1/applications/student/${appId}/transition`)
      .set("Authorization", auth)
      .send({ to: "ENROLLED" })
      .expect(200);
    expect(enrolled.body.status).toBe("ENROLLED");
    expect(enrolled.body.resultingStudentId).toBeTruthy();
    expect(enrolled.body.resultingEnrollmentId).toBeTruthy();

    // Verify the Enrollment row: program-term shape (offeringId set, courseId null)
    const enr = await prisma.enrollment.findUnique({ where: { id: enrolled.body.resultingEnrollmentId } });
    expect(enr?.offeringId).toBe(offering.id);
    expect(enr?.courseId).toBeNull();
    expect(enr?.status).toBe("active");
    expect(enr?.userId).toBe(enrolled.body.userId);
  });

  it("no targetOffering → ENROLLED creates Student only, resultingEnrollmentId null (Q1.a no-regression)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedProgramTree(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;
    const appId = await submitAndAccept(seed, program.id, null);
    const enrolled = await req
      .post(`/v1/applications/student/${appId}/transition`)
      .set("Authorization", auth)
      .send({ to: "ENROLLED" })
      .expect(200);
    expect(enrolled.body.resultingStudentId).toBeTruthy();
    expect(enrolled.body.resultingEnrollmentId).toBeNull();
  });

  it("setTargetOffering rejects cross-program offering → 400", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const treeA = await seedProgramTree(seed.tenantId);
    const treeB = await seedProgramTree(seed.tenantId); // different program + offering
    const email = `r4-xprog-${randomUUID().slice(0, 8)}@test.local`;
    const submitted = await req
      .post("/v1/applications/student")
      .send({ tenantSlug: seed.tenantSlug, programId: treeA.program.id, applicantFullName: "X Prog", applicantEmail: email })
      .expect(201);
    // try to target treeB's offering (different program) → 400
    const res = await req
      .patch(`/v1/applications/student/${submitted.body.id}/target-offering`)
      .set("Authorization", auth)
      .send({ offeringId: treeB.offering.id })
      .expect(400);
    expect(res.body.message).toMatch(/different program/);
  });
});

// =====================================================================
// ⚠️ EXISTING-FLOW REGRESSION (D74 mandate)
// =====================================================================

describe("@phase-b-r4 existing enrollment flow regression (D74)", () => {
  it("student self-enroll (POST /enrollments with courseId) still works", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { course } = await seedProgramTree(seed.tenantId);
    const res = await req
      .post("/v1/enrollments")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ courseId: course.id })
      .expect(201);
    expect(res.body.courseId).toBe(course.id);
    expect(res.body.status).toBe("active");
    expect(res.body.userId).toBe(seed.student.id);
  });

  it("student withdraw via PATCH /:id/status still works (existing RBAC)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { course } = await seedProgramTree(seed.tenantId);
    const auth = `Bearer ${seed.student.accessToken}`;
    const created = await req.post("/v1/enrollments").set("Authorization", auth).send({ courseId: course.id }).expect(201);
    // student withdraws themselves (owner can set withdrawn/dropped)
    const res = await req
      .patch(`/v1/enrollments/${created.body.id}/status`)
      .set("Authorization", auth)
      .send({ status: "withdrawn" })
      .expect(200);
    expect(res.body.status).toBe("withdrawn");
  });

  it("student listMine still works + includes course-level + program-term rows", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { course, offering } = await seedProgramTree(seed.tenantId);
    const sAuth = `Bearer ${seed.student.accessToken}`;
    const aAuth = `Bearer ${seed.admin.accessToken}`;
    // student self-enrolls in a course
    await req.post("/v1/enrollments").set("Authorization", sAuth).send({ courseId: course.id }).expect(201);
    // admin enrolls the same student into a program-term offering
    await req.post("/v1/enrollments/manual").set("Authorization", aAuth).send({ userId: seed.student.id, offeringId: offering.id }).expect(201);
    const mine = await req.get("/v1/enrollments/me").set("Authorization", sAuth).expect(200);
    expect(Array.isArray(mine.body)).toBe(true);
    expect(mine.body.length).toBeGreaterThanOrEqual(2);
  });
});

// =====================================================================
// Soft-delete + cross-tenant list
// =====================================================================

describe("@phase-b-r4 soft-delete + cross-tenant", () => {
  it("admin soft-delete → GET 404", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { offering } = await seedProgramTree(seed.tenantId);
    const u = await createUser(seed.tenantSlug, seed.tenantId, ["student"]);
    const auth = `Bearer ${seed.admin.accessToken}`;
    const created = await req.post("/v1/enrollments/manual").set("Authorization", auth).send({ userId: u.id, offeringId: offering.id }).expect(201);
    await req.delete(`/v1/enrollments/${created.body.id}`).set("Authorization", auth).expect(200);
    await req.get(`/v1/enrollments/${created.body.id}`).set("Authorization", auth).expect(404);
  });

  it("admin getById cross-tenant → 404 (not found, no leak)", async () => {
    const req = await getRequest();
    const a = await createTestTenant();
    const b = await createTestTenant();
    const { offering } = await seedProgramTree(b.tenantId);
    const u = await createUser(b.tenantSlug, b.tenantId, ["student"]);
    const created = await req.post("/v1/enrollments/manual").set("Authorization", `Bearer ${b.admin.accessToken}`).send({ userId: u.id, offeringId: offering.id }).expect(201);
    // admin of tenant A asks for tenant B's enrollment → 404
    await req.get(`/v1/enrollments/${created.body.id}`).set("Authorization", `Bearer ${a.admin.accessToken}`).expect(404);
  });
});
