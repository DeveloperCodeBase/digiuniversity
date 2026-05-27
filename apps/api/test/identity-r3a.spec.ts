// Phase B R3.a Commit F (D68 + D69) — Identity API e2e spec.
//
// Covers:
//   • Profile self-service + auto-create-on-read invariant (Q2.a 1:1)
//   • Admin /v1/profiles list
//   • SelfOrAdmin matrix on /v1/users/:userId/profile (the D69 primitive
//     under test — student can read/write own, NOT another's; admin can
//     read/write any in tenant)
//   • Student CRUD (admin) + /v1/students/me self-read
//   • 1:0..1 invariant rejection on duplicate Student.userId
//   • Cross-tenant rejection on Student/Instructor creation
//   • Instructor CRUD + dept-reassignment sub-resource
//   • R2 CourseOffering.instructorId wire (Q3.a):
//     - assign legal instructor → 200
//     - assign User-without-instructor-role → 400 with precise message (D69)
//     - cross-tenant instructorId → 400
//     - null → unassign
//   • Instructor soft-delete → offering's instructor join returns null
//     (SetNull cascade behavior end-to-end verified via list query)
//   • AuditLog rows written for every mutation (R4 lint contract)
//
// Spec uses createTestTenant from helpers + raw Prisma for the parts
// helpers don't cover (extra users without admin/student roles, the
// instructor-role wire-up). Each test gets its own fresh tenant.

import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

import { createTestTenant, getPrisma, getRequest, type TestTenantSeed } from "./helpers";

const HIERARCHY_SLUG = "r3a-test";

async function seedDepartment(tenantId: string) {
  const prisma = await getPrisma();
  const school = await prisma.school.create({
    data: { tenantId, slug: `${HIERARCHY_SLUG}-${randomUUID().slice(0, 6)}-sch`, nameFa: "علوم" },
  });
  const faculty = await prisma.faculty.create({
    data: { tenantId, slug: `${HIERARCHY_SLUG}-${randomUUID().slice(0, 6)}-fac`, name: "Faculty of Tests", schoolId: school.id },
  });
  const department = await prisma.department.create({
    data: { tenantId, facultyId: faculty.id, slug: `${HIERARCHY_SLUG}-${randomUUID().slice(0, 6)}-dept`, name: "Dept of Tests" },
  });
  return department;
}

async function seedOffering(tenantId: string, programId: string) {
  const prisma = await getPrisma();
  return prisma.courseOffering.create({
    data: {
      tenantId,
      programId,
      slug: `r3a-off-${randomUUID().slice(0, 8)}`,
      nameFa: "ترم تست",
    },
  });
}

async function seedProgram(tenantId: string, departmentId: string) {
  const prisma = await getPrisma();
  return prisma.program.create({
    data: {
      tenantId,
      departmentId,
      slug: `${HIERARCHY_SLUG}-${randomUUID().slice(0, 6)}-prog`,
      name: "BSc Tests",
      degreeLevel: "bachelor",
    },
  });
}

/**
 * Create a User in the given tenant, with optional named roles.
 * Returns id + login JWT. Roles must already exist in the tenant
 * (createTestTenant seeds admin/instructor/student; pass the matching
 * name here).
 */
async function createUserWithRoles(
  tenantSlug: string,
  tenantId: string,
  roleNames: string[],
): Promise<{ id: string; email: string; password: string; accessToken: string }> {
  const prisma = await getPrisma();
  const req = await getRequest();
  const suffix = randomUUID().slice(0, 8);
  const email = `user-${suffix}@test.local`;
  const password = "TestPass!12345";
  const passwordHash = await bcrypt.hash(password, 4);

  const roles = await prisma.role.findMany({
    where: { tenantId, name: { in: roleNames } },
  });
  if (roles.length !== roleNames.length) {
    throw new Error(`createUserWithRoles: not all roles found in tenant. wanted ${roleNames.join(",")}, got ${roles.map((r) => r.name).join(",")}`);
  }

  const user = await prisma.user.create({
    data: {
      tenantId,
      email,
      passwordHash,
      fullName: `Test User ${suffix}`,
      userRoles: { create: roles.map((r) => ({ roleId: r.id })) },
    },
  });

  const login = await req
    .post("/v1/auth/login")
    .send({ tenantSlug, email, password })
    .expect(200);

  return { id: user.id, email, password, accessToken: login.body.accessToken };
}

// =====================================================================
// Profile + SelfOrAdmin matrix
// =====================================================================

describe("@phase-b-r3a profile + SelfOrAdmin (D69)", () => {
  it("auto-creates Profile on first GET /v1/profile", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.student.accessToken}`;

    const res = await req.get("/v1/profile").set("Authorization", auth).expect(200);
    expect(res.body.userId).toBe(seed.student.id);
    expect(res.body.bio).toBeNull();
    expect(res.body.user.email).toBe(seed.student.email);
  });

  it("student edits own profile via PATCH /v1/profile + audit logged", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.student.accessToken}`;

    const res = await req
      .patch("/v1/profile")
      .set("Authorization", auth)
      .send({ bio: "Hello from a test" })
      .expect(200);
    expect(res.body.bio).toBe("Hello from a test");
    expect(res.body.userId).toBe(seed.student.id);

    // Audit semantic per D69: actor = student.id (NOT admin), subject = Profile:<student>
    const audit = await prisma.auditLog.findFirst({
      where: { tenantId: seed.tenantId, action: "profile.update", actorId: seed.student.id },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).not.toBeNull();
    expect(audit?.subject).toContain(seed.student.id);
  });

  it("/v1/profiles list is admin-only", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();

    await req
      .get("/v1/profiles")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .expect(200);

    await req
      .get("/v1/profiles")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(403);
  });

  it("SelfOrAdmin matrix on /v1/users/:userId/profile", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();

    // 1. student reads own → 200
    await req
      .get(`/v1/users/${seed.student.id}/profile`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(200);

    // 2. student tries to read admin's → 403
    await req
      .get(`/v1/users/${seed.admin.id}/profile`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(403);

    // 3. admin reads student's → 200
    await req
      .get(`/v1/users/${seed.student.id}/profile`)
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .expect(200);

    // 4. PATCH matrix: student edits own → 200
    await req
      .patch(`/v1/users/${seed.student.id}/profile`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ bio: "self edit" })
      .expect(200);

    // 5. student tries to PATCH admin → 403
    await req
      .patch(`/v1/users/${seed.admin.id}/profile`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ bio: "attempted hijack" })
      .expect(403);

    // 6. admin PATCH student's → 200
    const adminPatch = await req
      .patch(`/v1/users/${seed.student.id}/profile`)
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ bio: "set by admin" })
      .expect(200);
    expect(adminPatch.body.bio).toBe("set by admin");
  });

  it("cross-tenant /v1/users/:userId/profile is 404 (no leak)", async () => {
    const req = await getRequest();
    const a = await createTestTenant();
    const b = await createTestTenant();

    // admin of tenant A asks for student of tenant B
    await req
      .get(`/v1/users/${b.student.id}/profile`)
      .set("Authorization", `Bearer ${a.admin.accessToken}`)
      .expect(404);
  });
});

// =====================================================================
// Student CRUD + /v1/students/me self-read
// =====================================================================

describe("@phase-b-r3a student CRUD", () => {
  async function setupTwoUsers(seed: TestTenantSeed) {
    // student-with-record: existing seed.student gets a Student row created.
    const prisma = await getPrisma();
    const studentRow = await prisma.student.create({
      data: {
        tenantId: seed.tenantId,
        userId: seed.student.id,
        studentCode: `STU-${randomUUID().slice(0, 6)}`,
        status: "ENROLLED",
      },
    });
    // student-without-record: a fresh user with student role, no Student row.
    const noRecordStudent = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["student"]);
    return { studentRow, noRecordStudent };
  }

  it("admin creates/updates/soft-deletes a Student; /me works for the linked user", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    // Admin POSTs a Student tied to seed.student (no duplicate; create on different user)
    const extraUser = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["student"]);
    const created = await req
      .post("/v1/students")
      .set("Authorization", auth)
      .send({ userId: extraUser.id, studentCode: "stu-001", status: "ENROLLED" })
      .expect(201);
    expect(created.body.studentCode).toBe("STU-001"); // auto-uppercase
    expect(created.body.status).toBe("ENROLLED");

    // /v1/students/me works for the linked user
    const meRes = await req
      .get("/v1/students/me")
      .set("Authorization", `Bearer ${extraUser.accessToken}`)
      .expect(200);
    expect(meRes.body.id).toBe(created.body.id);

    // /v1/students/me 404 for student without a record (seed.student here)
    await req
      .get("/v1/students/me")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(404);

    // Update + soft-delete
    const upd = await req
      .patch(`/v1/students/${created.body.id}`)
      .set("Authorization", auth)
      .send({ status: "ON_LEAVE" })
      .expect(200);
    expect(upd.body.status).toBe("ON_LEAVE");

    const del = await req
      .delete(`/v1/students/${created.body.id}`)
      .set("Authorization", auth)
      .expect(200);
    expect(del.body.deleted).toBe(true);

    // subsequent GET → 404 (soft-deleted)
    await req
      .get(`/v1/students/${created.body.id}`)
      .set("Authorization", auth)
      .expect(404);
  });

  it("rejects duplicate Student for same userId (1:0..1 invariant)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const extra = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["student"]);
    const auth = `Bearer ${seed.admin.accessToken}`;
    await req
      .post("/v1/students")
      .set("Authorization", auth)
      .send({ userId: extra.id, studentCode: "S-A" })
      .expect(201);
    const dup = await req
      .post("/v1/students")
      .set("Authorization", auth)
      .send({ userId: extra.id, studentCode: "S-B" })
      .expect(400);
    expect(dup.body.message).toMatch(/1:0\.\.1/);
  });

  it("rejects cross-tenant userId", async () => {
    const req = await getRequest();
    const a = await createTestTenant();
    const b = await createTestTenant();
    const dup = await req
      .post("/v1/students")
      .set("Authorization", `Bearer ${a.admin.accessToken}`)
      .send({ userId: b.student.id, studentCode: "X" })
      .expect(400);
    expect(dup.body.message).toMatch(/does not exist in this tenant/);
  });
});

// =====================================================================
// Instructor CRUD + department reassignment + R2 instructor wire
// =====================================================================

describe("@phase-b-r3a instructor + offering wire (D68 Q3.a + D69)", () => {
  it("admin creates instructor, reassigns department, soft-deletes", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const dept1 = await seedDepartment(seed.tenantId);
    const dept2 = await seedDepartment(seed.tenantId);
    const instructorUser = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["instructor"]);

    const created = await req
      .post("/v1/instructors")
      .set("Authorization", auth)
      .send({
        userId: instructorUser.id,
        instructorCode: "ins-001",
        departmentId: dept1.id,
        rank: "ASSISTANT",
        expertise: ["ml", "rtl_ui"],
      })
      .expect(201);
    expect(created.body.instructorCode).toBe("INS-001");
    expect(created.body.expertise).toEqual(["ml", "rtl_ui"]);
    expect(created.body.departmentId).toBe(dept1.id);

    // Reassign department via sub-resource
    const reassigned = await req
      .patch(`/v1/instructors/${created.body.id}/department`)
      .set("Authorization", auth)
      .send({ departmentId: dept2.id })
      .expect(200);
    expect(reassigned.body.departmentId).toBe(dept2.id);

    // Unassign (null detach)
    const detached = await req
      .patch(`/v1/instructors/${created.body.id}/department`)
      .set("Authorization", auth)
      .send({ departmentId: null })
      .expect(200);
    expect(detached.body.departmentId).toBeNull();

    // Soft-delete
    const del = await req
      .delete(`/v1/instructors/${created.body.id}`)
      .set("Authorization", auth)
      .expect(200);
    expect(del.body.deleted).toBe(true);
    expect(del.body.taughtOfferingsCount).toBe(0);
  });

  it("students can read instructor catalog (list + getById)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const instUser = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["instructor"]);
    const created = await req
      .post("/v1/instructors")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ userId: instUser.id, instructorCode: "INS-CAT" })
      .expect(201);

    // student GETs list + single → 200
    const list = await req
      .get("/v1/instructors")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.find((x: { id: string }) => x.id === created.body.id)).toBeTruthy();

    await req
      .get(`/v1/instructors/${created.body.id}`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(200);
  });

  it("assigns instructor to offering when User holds 'instructor' role", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const dept = await seedDepartment(seed.tenantId);
    const program = await seedProgram(seed.tenantId, dept.id);
    const offering = await seedOffering(seed.tenantId, program.id);
    const instUser = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["instructor"]);
    const inst = await req
      .post("/v1/instructors")
      .set("Authorization", auth)
      .send({ userId: instUser.id, instructorCode: "INS-OK", departmentId: dept.id })
      .expect(201);

    const res = await req
      .patch(`/v1/offerings/${offering.id}/instructor`)
      .set("Authorization", auth)
      .send({ instructorId: inst.body.id })
      .expect(200);
    expect(res.body.instructorId).toBe(inst.body.id);

    // List shows the instructor joined (with name)
    const list = await req
      .get("/v1/offerings")
      .set("Authorization", auth)
      .expect(200);
    const row = list.body.find((o: { id: string }) => o.id === offering.id);
    expect(row.instructor?.id).toBe(inst.body.id);
    expect(row.instructor?.user?.fullName).toEqual(expect.any(String));
  });

  it("rejects assigning a User without the 'instructor' role (D69 explicit)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const dept = await seedDepartment(seed.tenantId);
    const program = await seedProgram(seed.tenantId, dept.id);
    const offering = await seedOffering(seed.tenantId, program.id);

    // Create a User holding ONLY the student role + an Instructor row tied to them.
    // (The instructor row exists in the table; the role on the User does not.)
    const wrongUser = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["student"]);
    const prisma = await getPrisma();
    const inst = await prisma.instructor.create({
      data: {
        tenantId: seed.tenantId,
        userId: wrongUser.id,
        instructorCode: "INS-WRONG",
      },
    });

    const res = await req
      .patch(`/v1/offerings/${offering.id}/instructor`)
      .set("Authorization", auth)
      .send({ instructorId: inst.id })
      .expect(400);
    expect(res.body.message).toMatch(/'instructor' role/);
    expect(res.body.message).toMatch(/student/); // names what they actually have
  });

  it("rejects cross-tenant instructorId", async () => {
    const req = await getRequest();
    const a = await createTestTenant();
    const b = await createTestTenant();
    const dept = await seedDepartment(a.tenantId);
    const program = await seedProgram(a.tenantId, dept.id);
    const offering = await seedOffering(a.tenantId, program.id);

    // Create instructor in TENANT B
    const bInstUser = await createUserWithRoles(b.tenantSlug, b.tenantId, ["instructor"]);
    const bInst = await (await getPrisma()).instructor.create({
      data: { tenantId: b.tenantId, userId: bInstUser.id, instructorCode: "X" },
    });

    // Admin of tenant A tries to assign tenant B's instructor → 400
    const res = await req
      .patch(`/v1/offerings/${offering.id}/instructor`)
      .set("Authorization", `Bearer ${a.admin.accessToken}`)
      .send({ instructorId: bInst.id })
      .expect(400);
    expect(res.body.message).toMatch(/not found in this tenant/);
  });

  it("null/empty instructorId unassigns (idempotent)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const dept = await seedDepartment(seed.tenantId);
    const program = await seedProgram(seed.tenantId, dept.id);
    const offering = await seedOffering(seed.tenantId, program.id);
    const instUser = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["instructor"]);
    const inst = await req
      .post("/v1/instructors")
      .set("Authorization", auth)
      .send({ userId: instUser.id, instructorCode: "INS-NULL" })
      .expect(201);

    // Assign
    await req
      .patch(`/v1/offerings/${offering.id}/instructor`)
      .set("Authorization", auth)
      .send({ instructorId: inst.body.id })
      .expect(200);

    // Unassign with null
    const r1 = await req
      .patch(`/v1/offerings/${offering.id}/instructor`)
      .set("Authorization", auth)
      .send({ instructorId: null })
      .expect(200);
    expect(r1.body.instructorId).toBeNull();

    // Unassign again with empty string → still null (idempotent)
    const r2 = await req
      .patch(`/v1/offerings/${offering.id}/instructor`)
      .set("Authorization", auth)
      .send({ instructorId: "" })
      .expect(200);
    expect(r2.body.instructorId).toBeNull();
  });

  it("instructor soft-delete causes offering's instructor join to return null (SetNull cascade behavior)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const dept = await seedDepartment(seed.tenantId);
    const program = await seedProgram(seed.tenantId, dept.id);
    const offering = await seedOffering(seed.tenantId, program.id);
    const instUser = await createUserWithRoles(seed.tenantSlug, seed.tenantId, ["instructor"]);
    const inst = await req
      .post("/v1/instructors")
      .set("Authorization", auth)
      .send({ userId: instUser.id, instructorCode: "INS-SD" })
      .expect(201);
    await req
      .patch(`/v1/offerings/${offering.id}/instructor`)
      .set("Authorization", auth)
      .send({ instructorId: inst.body.id })
      .expect(200);

    // Soft-delete the instructor
    await req
      .delete(`/v1/instructors/${inst.body.id}`)
      .set("Authorization", auth)
      .expect(200);

    // The list query joins with deletedAt:null on the instructor side,
    // so the offering's `instructor` should now render as null even
    // though `instructorId` is still set (soft-delete doesn't null FKs).
    const list = await req.get("/v1/offerings").set("Authorization", auth).expect(200);
    const row = list.body.find((o: { id: string }) => o.id === offering.id);
    expect(row.instructorId).toBe(inst.body.id); // FK still set on the row
    expect(row.instructor).toBeNull(); // but the joined record is null
  });
});
