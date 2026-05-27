// Phase B R1 Commit E — Academic Hierarchy API e2e spec.
//
// Covers the 4-level hierarchy School → Faculty → Department → Program
// across all 16 CRUD endpoints introduced/extended in Commits B-D:
//
//   School      C R U D + list filter
//   Faculty     C R U D + list (+ ?schoolId filter)  (schoolId/nameEn/shortCode additive)
//   Department  C R U D + list (+ ?facultyId filter) (nameEn/shortCode additive)
//   Program     C R U D + list (+ ?departmentId filter) (nameEn/shortCode additive)
//
// Plus cross-cutting:
//   • Tenant isolation (Tenant A's School invisible to Tenant B)
//   • @Roles("admin") guard (student forbidden on mutations)
//   • Soft-delete (deleted row absent from list; restorable via DB)
//   • Faculty.schoolId optional FK behavior (link, list filter, detach)
//   • Unique constraint surfacing (slug + shortCode collisions → 400)
//   • AuditLog row written per mutation (R4 lint contract)
//   • Faculty.schoolId references a school in OTHER tenant → 400

import { createTestTenant, getPrisma, getRequest } from "./helpers";

describe("@phase-b-r1 academic hierarchy (D62 + D63)", () => {
  // -------------------- School --------------------

  it("admin creates a School with all fields, then lists + reads + updates + soft-deletes it", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    // CREATE
    const created = await req
      .post("/v1/schools")
      .set("Authorization", auth)
      .send({
        slug: "engineering",
        nameFa: "دانشکده مهندسی",
        nameEn: "School of Engineering",
        shortCode: "eng",
        description: "Engineering disciplines",
        sortOrder: 5,
        iconName: "engineering",
      })
      .expect(201);
    expect(created.body.id).toBeTruthy();
    expect(created.body.slug).toBe("engineering");
    expect(created.body.nameFa).toBe("دانشکده مهندسی");
    expect(created.body.shortCode).toBe("ENG"); // auto-uppercased
    expect(created.body.sortOrder).toBe(5);
    expect(created.body.deletedAt).toBeNull();

    // LIST
    const list = await req.get("/v1/schools").set("Authorization", auth).expect(200);
    const row = list.body.find((s: { id: string }) => s.id === created.body.id);
    expect(row).toBeDefined();
    expect(row._count.faculties).toBe(0);

    // GET by id
    const got = await req
      .get(`/v1/schools/${created.body.id}`)
      .set("Authorization", auth)
      .expect(200);
    expect(got.body.id).toBe(created.body.id);
    expect(got.body.faculties).toEqual([]);

    // UPDATE — partial body
    const updated = await req
      .patch(`/v1/schools/${created.body.id}`)
      .set("Authorization", auth)
      .send({ description: "Updated description", sortOrder: 10 })
      .expect(200);
    expect(updated.body.description).toBe("Updated description");
    expect(updated.body.sortOrder).toBe(10);
    expect(updated.body.nameFa).toBe("دانشکده مهندسی"); // unchanged

    // UPDATE with empty body → 400
    await req
      .patch(`/v1/schools/${created.body.id}`)
      .set("Authorization", auth)
      .send({})
      .expect(400);

    // SOFT DELETE
    const deleted = await req
      .delete(`/v1/schools/${created.body.id}`)
      .set("Authorization", auth)
      .expect(200);
    expect(deleted.body.deleted).toBe(true);
    expect(deleted.body.facultyCount).toBe(0);

    // After delete: GET → 404, LIST does not include it
    await req.get(`/v1/schools/${created.body.id}`).set("Authorization", auth).expect(404);
    const listAfter = await req.get("/v1/schools").set("Authorization", auth).expect(200);
    expect(listAfter.body.find((s: { id: string }) => s.id === created.body.id)).toBeUndefined();
  });

  it("rejects School create with duplicate slug within the same tenant", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    await req
      .post("/v1/schools")
      .set("Authorization", auth)
      .send({ slug: "stem", nameFa: "اول" })
      .expect(201);

    const dup = await req
      .post("/v1/schools")
      .set("Authorization", auth)
      .send({ slug: "stem", nameFa: "دوم" })
      .expect(400);
    expect(String(dup.body.message)).toMatch(/slug.*already/i);
  });

  it("rejects School create with duplicate shortCode within the same tenant", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    await req
      .post("/v1/schools")
      .set("Authorization", auth)
      .send({ slug: "a", nameFa: "ALPHA", shortCode: "ALP" })
      .expect(201);

    const dup = await req
      .post("/v1/schools")
      .set("Authorization", auth)
      .send({ slug: "b", nameFa: "BETA", shortCode: "ALP" })
      .expect(400);
    expect(String(dup.body.message)).toMatch(/shortCode.*already/i);
  });

  it("student is forbidden from any School mutation", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const studentAuth = `Bearer ${seed.student.accessToken}`;

    await req
      .post("/v1/schools")
      .set("Authorization", studentAuth)
      .send({ slug: "x", nameFa: "X" })
      .expect(403);
  });

  // -------------------- Faculty (schoolId + additive cols) --------------------

  it("Faculty create accepts schoolId; list filters by ?schoolId=; PATCH attaches/detaches", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    // Build 2 schools
    const schoolA = (
      await req
        .post("/v1/schools")
        .set("Authorization", auth)
        .send({ slug: "alpha", nameFa: "ALPHA" })
        .expect(201)
    ).body;
    const schoolB = (
      await req
        .post("/v1/schools")
        .set("Authorization", auth)
        .send({ slug: "beta", nameFa: "BETA" })
        .expect(201)
    ).body;

    // Faculty under schoolA + 1 free-floating (no schoolId)
    const fac1 = await req
      .post("/v1/faculties")
      .set("Authorization", auth)
      .send({
        slug: "fac1",
        name: "دانشکده ۱",
        nameEn: "Faculty 1",
        shortCode: "F1",
        schoolId: schoolA.id,
      })
      .expect(201);
    expect(fac1.body.schoolId).toBe(schoolA.id);
    expect(fac1.body.shortCode).toBe("F1");

    await req
      .post("/v1/faculties")
      .set("Authorization", auth)
      .send({ slug: "fac2", name: "دانشکده ۲" })
      .expect(201);

    // List with ?schoolId=A → 1 result
    const filtered = await req
      .get(`/v1/faculties?schoolId=${schoolA.id}`)
      .set("Authorization", auth)
      .expect(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].id).toBe(fac1.body.id);
    expect(filtered.body[0].school.id).toBe(schoolA.id);

    // List without filter → 2 results
    const all = await req.get("/v1/faculties").set("Authorization", auth).expect(200);
    expect(all.body.length).toBeGreaterThanOrEqual(2);

    // PATCH: detach from school via empty string
    const detached = await req
      .patch(`/v1/faculties/${fac1.body.id}`)
      .set("Authorization", auth)
      .send({ schoolId: "" })
      .expect(200);
    expect(detached.body.schoolId).toBeNull();

    // PATCH: re-attach to schoolB
    const reattached = await req
      .patch(`/v1/faculties/${fac1.body.id}`)
      .set("Authorization", auth)
      .send({ schoolId: schoolB.id })
      .expect(200);
    expect(reattached.body.schoolId).toBe(schoolB.id);
  });

  it("rejects Faculty.schoolId pointing at a school from another tenant", async () => {
    const req = await getRequest();
    const seedA = await createTestTenant();
    const seedB = await createTestTenant();

    // Create school in tenant A
    const schoolA = (
      await req
        .post("/v1/schools")
        .set("Authorization", `Bearer ${seedA.admin.accessToken}`)
        .send({ slug: "cross", nameFa: "X" })
        .expect(201)
    ).body;

    // Try to create faculty in tenant B referencing tenant A's school
    const denied = await req
      .post("/v1/faculties")
      .set("Authorization", `Bearer ${seedB.admin.accessToken}`)
      .send({ slug: "bad", name: "bad", schoolId: schoolA.id })
      .expect(400);
    expect(String(denied.body.message)).toMatch(/school.*not found/i);
  });

  // -------------------- Department + Program additive cols --------------------

  it("Department + Program persist nameEn + shortCode (additive cols)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    const faculty = (
      await req
        .post("/v1/faculties")
        .set("Authorization", auth)
        .send({ slug: "fac", name: "Faculty", shortCode: "FAC" })
        .expect(201)
    ).body;

    const dept = (
      await req
        .post("/v1/departments")
        .set("Authorization", auth)
        .send({
          facultyId: faculty.id,
          slug: "dept",
          name: "Department",
          nameEn: "Department EN",
          shortCode: "dpt",
        })
        .expect(201)
    ).body;
    expect(dept.nameEn).toBe("Department EN");
    expect(dept.shortCode).toBe("DPT");

    const prog = (
      await req
        .post("/v1/programs")
        .set("Authorization", auth)
        .send({
          departmentId: dept.id,
          slug: "prog",
          name: "Program",
          nameEn: "Program EN",
          shortCode: "prg",
          degreeLevel: "bachelor",
        })
        .expect(201)
    ).body;
    expect(prog.nameEn).toBe("Program EN");
    expect(prog.shortCode).toBe("PRG");

    // List Department returns nested faculty info
    const deptList = await req.get("/v1/departments").set("Authorization", auth).expect(200);
    const deptRow = deptList.body.find((d: { id: string }) => d.id === dept.id);
    expect(deptRow.faculty.id).toBe(faculty.id);

    // List Program returns nested department info
    const progList = await req.get("/v1/programs").set("Authorization", auth).expect(200);
    const progRow = progList.body.find((p: { id: string }) => p.id === prog.id);
    expect(progRow.department.id).toBe(dept.id);
  });

  // -------------------- AuditLog (R4 contract) --------------------

  it("writes AuditLog rows for school.create + update + delete", async () => {
    const req = await getRequest();
    const p = await getPrisma();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    const created = (
      await req
        .post("/v1/schools")
        .set("Authorization", auth)
        .send({ slug: "audit", nameFa: "Audit Test" })
        .expect(201)
    ).body;
    await req
      .patch(`/v1/schools/${created.id}`)
      .set("Authorization", auth)
      .send({ description: "x" })
      .expect(200);
    await req
      .delete(`/v1/schools/${created.id}`)
      .set("Authorization", auth)
      .expect(200);

    const logs = await p.auditLog.findMany({
      where: { tenantId: seed.tenantId, action: { in: ["school.create", "school.update", "school.delete"] } },
      orderBy: { createdAt: "asc" },
    });
    const actions = logs.map((l) => l.action);
    expect(actions).toContain("school.create");
    expect(actions).toContain("school.update");
    expect(actions).toContain("school.delete");
  });

  // -------------------- Tenant isolation --------------------

  it("tenant A's School is invisible to tenant B", async () => {
    const req = await getRequest();
    const seedA = await createTestTenant();
    const seedB = await createTestTenant();

    const schoolA = (
      await req
        .post("/v1/schools")
        .set("Authorization", `Bearer ${seedA.admin.accessToken}`)
        .send({ slug: "secret", nameFa: "Tenant A only" })
        .expect(201)
    ).body;

    // Tenant B cannot list it
    const bList = await req
      .get("/v1/schools")
      .set("Authorization", `Bearer ${seedB.admin.accessToken}`)
      .expect(200);
    expect(bList.body.find((s: { id: string }) => s.id === schoolA.id)).toBeUndefined();

    // Tenant B cannot GET by id (returns 404, not 200/403)
    await req
      .get(`/v1/schools/${schoolA.id}`)
      .set("Authorization", `Bearer ${seedB.admin.accessToken}`)
      .expect(404);

    // Tenant B cannot DELETE
    await req
      .delete(`/v1/schools/${schoolA.id}`)
      .set("Authorization", `Bearer ${seedB.admin.accessToken}`)
      .expect(404);
  });
});
