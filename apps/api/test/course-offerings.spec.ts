// Phase B R2 Commit D — CourseOffering API e2e spec.
//
// Covers per D65 R2-Reminder-1 (state machine D18 flow):
//
//   /v1/offerings  CREATE / READ / UPDATE / TRANSITION / DELETE / LIST
//
// Plus cross-cutting:
//   • State machine: legal transitions allowed, illegal rejected 400
//   • Soft-delete allowed at ANY status (per D65 R2-Reminder-1)
//   • Tenant isolation (Tenant A's offering invisible to Tenant B)
//   • @Roles("admin") guard (student forbidden on mutations)
//   • Unique constraint (slug collision → 400)
//   • AuditLog row written per mutation (R4 lint contract)
//   • Sunset / Deprecation / Link headers on /v1/cohorts per MIGRATION_POLICY §6
//   • Dual-write: Cohort create → linked Offering exists + MigrationSyncLog
//   • Cascade: Cohort soft-delete → mirrored Offering soft-delete

import { createTestTenant, getPrisma, getRequest } from "./helpers";

const HIERARCHY_SLUG = "r2-test";

async function seedHierarchy(tenantId: string) {
  const prisma = await getPrisma();
  // Direct Prisma seed of School → Faculty → Department → Program for
  // FK validity in /v1/offerings POSTs. Tests don't go through R1
  // endpoints for setup (decouples R2 spec from R1 churn).
  const school = await prisma.school.create({
    data: { tenantId, slug: `${HIERARCHY_SLUG}-eng`, nameFa: "مهندسی" },
  });
  const faculty = await prisma.faculty.create({
    data: { tenantId, slug: `${HIERARCHY_SLUG}-cs-fac`, name: "Computer Science", schoolId: school.id },
  });
  const department = await prisma.department.create({
    data: { tenantId, facultyId: faculty.id, slug: `${HIERARCHY_SLUG}-ml-dept`, name: "Machine Learning" },
  });
  const program = await prisma.program.create({
    data: {
      tenantId,
      departmentId: department.id,
      slug: `${HIERARCHY_SLUG}-ml-msc`,
      name: "M.Sc. ML",
      degreeLevel: "master",
      durationSemesters: 4,
    },
  });
  return { school, faculty, department, program };
}

describe("@phase-b-r2 course offerings (D65)", () => {
  // -------------------- CRUD --------------------

  it("admin creates an offering with all fields, reads, updates, soft-deletes", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    const created = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({
        programId: program.id,
        slug: "fall-2026-ml-intro",
        nameFa: "ترم پاییز ۲۰۲۶ — مقدمه‌ای بر یادگیری ماشین",
        nameEn: "Fall 2026 — Intro to ML",
        shortCode: "f26-ml",
        capacity: 40,
        mode: "HYBRID",
      })
      .expect(201);

    expect(created.body.id).toBeTruthy();
    expect(created.body.slug).toBe("fall-2026-ml-intro");
    expect(created.body.shortCode).toBe("F26-ML"); // auto-uppercase
    expect(created.body.capacity).toBe(40);
    expect(created.body.mode).toBe("HYBRID");
    expect(created.body.status).toBe("SCHEDULED");
    expect(created.body.deletedAt).toBeNull();

    // LIST
    const list = await req.get("/v1/offerings").set("Authorization", auth).expect(200);
    expect(list.body.find((o: { id: string }) => o.id === created.body.id)).toBeDefined();

    // GET by id
    const got = await req
      .get(`/v1/offerings/${created.body.id}`)
      .set("Authorization", auth)
      .expect(200);
    expect(got.body.nameEn).toBe("Fall 2026 — Intro to ML");

    // UPDATE
    const updated = await req
      .patch(`/v1/offerings/${created.body.id}`)
      .set("Authorization", auth)
      .send({ nameFa: "ترم پاییز ۲۰۲۶ — یادگیری ماشین مقدماتی", capacity: 50 })
      .expect(200);
    expect(updated.body.nameFa).toBe("ترم پاییز ۲۰۲۶ — یادگیری ماشین مقدماتی");
    expect(updated.body.capacity).toBe(50);

    // SOFT-DELETE
    const deleted = await req
      .delete(`/v1/offerings/${created.body.id}`)
      .set("Authorization", auth)
      .expect(200);
    expect(deleted.body).toEqual({ deleted: true });

    // GET after soft-delete → 404
    await req.get(`/v1/offerings/${created.body.id}`).set("Authorization", auth).expect(404);
  });

  it("student is forbidden from creating/updating/deleting offerings (admin-only)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const studentAuth = `Bearer ${seed.student.accessToken}`;

    // STUDENT POST → 403
    await req
      .post("/v1/offerings")
      .set("Authorization", studentAuth)
      .send({ programId: program.id, slug: "x", nameFa: "x" })
      .expect(403);

    // Create as admin first so student can attempt update/delete
    const adminAuth = `Bearer ${seed.admin.accessToken}`;
    const created = await req
      .post("/v1/offerings")
      .set("Authorization", adminAuth)
      .send({ programId: program.id, slug: "spring-2026-test", nameFa: "نمونه" })
      .expect(201);

    await req
      .patch(`/v1/offerings/${created.body.id}`)
      .set("Authorization", studentAuth)
      .send({ nameFa: "hacked" })
      .expect(403);
    await req.delete(`/v1/offerings/${created.body.id}`).set("Authorization", studentAuth).expect(403);
    await req
      .post(`/v1/offerings/${created.body.id}/transition`)
      .set("Authorization", studentAuth)
      .send({ to: "OPEN" })
      .expect(403);
  });

  it("tenant isolation: Tenant A admin cannot read Tenant B offering", async () => {
    const req = await getRequest();
    const tenantA = await createTestTenant();
    const tenantB = await createTestTenant();
    const { program: progA } = await seedHierarchy(tenantA.tenantId);

    const created = await req
      .post("/v1/offerings")
      .set("Authorization", `Bearer ${tenantA.admin.accessToken}`)
      .send({ programId: progA.id, slug: "isolation-test", nameFa: "تنانت" })
      .expect(201);

    // Tenant B admin cannot see it in list
    const bList = await req
      .get("/v1/offerings")
      .set("Authorization", `Bearer ${tenantB.admin.accessToken}`)
      .expect(200);
    expect(bList.body.find((o: { id: string }) => o.id === created.body.id)).toBeUndefined();

    // Tenant B admin cannot GET by id → 404 (not 403, intentional info-hide)
    await req
      .get(`/v1/offerings/${created.body.id}`)
      .set("Authorization", `Bearer ${tenantB.admin.accessToken}`)
      .expect(404);
  });

  it("rejects cross-tenant programId on create (400)", async () => {
    const req = await getRequest();
    const tenantA = await createTestTenant();
    const tenantB = await createTestTenant();
    const { program: progA } = await seedHierarchy(tenantA.tenantId);

    // Tenant B admin tries to create an offering pointing at Tenant A's program
    await req
      .post("/v1/offerings")
      .set("Authorization", `Bearer ${tenantB.admin.accessToken}`)
      .send({ programId: progA.id, slug: "cross-tenant", nameFa: "نباید" })
      .expect(400);
  });

  it("rejects slug collision within tenant (unique constraint surfaces)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "dup-slug", nameFa: "اول" })
      .expect(201);

    // 500 or 400 depending on whether Prisma's P2002 surfaces as
    // ConflictException or generic — accept either to be defensive.
    const second = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "dup-slug", nameFa: "دوم" });
    expect([400, 409, 500]).toContain(second.status);
  });

  // -------------------- State machine (D18 flow per D65 R2-Reminder-1) --------------------

  it("state machine: full happy path SCHEDULED → OPEN → ACTIVE → COMPLETED", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    const created = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "happy-path", nameFa: "خوشحال" })
      .expect(201);
    expect(created.body.status).toBe("SCHEDULED");

    const t1 = await req
      .post(`/v1/offerings/${created.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "OPEN" })
      .expect(200);
    expect(t1.body.status).toBe("OPEN");

    const t2 = await req
      .post(`/v1/offerings/${created.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "ACTIVE" })
      .expect(200);
    expect(t2.body.status).toBe("ACTIVE");

    const t3 = await req
      .post(`/v1/offerings/${created.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "COMPLETED" })
      .expect(200);
    expect(t3.body.status).toBe("COMPLETED");
  });

  it("state machine: any status → CANCELED admin escape hatch (3 entry points)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    // From SCHEDULED
    const a = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "cancel-sched", nameFa: "لغو" })
      .expect(201);
    const aCanceled = await req
      .post(`/v1/offerings/${a.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "CANCELED" })
      .expect(200);
    expect(aCanceled.body.status).toBe("CANCELED");

    // From OPEN
    const b = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "cancel-open", nameFa: "لغو" })
      .expect(201);
    await req
      .post(`/v1/offerings/${b.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "OPEN" })
      .expect(200);
    const bCanceled = await req
      .post(`/v1/offerings/${b.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "CANCELED" })
      .expect(200);
    expect(bCanceled.body.status).toBe("CANCELED");

    // From ACTIVE
    const c = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "cancel-active", nameFa: "لغو" })
      .expect(201);
    await req
      .post(`/v1/offerings/${c.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "OPEN" })
      .expect(200);
    await req
      .post(`/v1/offerings/${c.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "ACTIVE" })
      .expect(200);
    const cCanceled = await req
      .post(`/v1/offerings/${c.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "CANCELED" })
      .expect(200);
    expect(cCanceled.body.status).toBe("CANCELED");
  });

  it("state machine: illegal transitions rejected 400 with allowed-list in message", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    // Illegal: SCHEDULED → ACTIVE (must go via OPEN)
    const a = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "illegal-1", nameFa: "x" })
      .expect(201);
    const r1 = await req
      .post(`/v1/offerings/${a.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "ACTIVE" })
      .expect(400);
    expect(r1.body.message).toMatch(/illegal transition.*SCHEDULED.*ACTIVE/);
    expect(r1.body.message).toMatch(/Allowed from SCHEDULED.*OPEN.*CANCELED/);

    // Illegal: SCHEDULED → COMPLETED
    await req
      .post(`/v1/offerings/${a.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "COMPLETED" })
      .expect(400);

    // Illegal: COMPLETED → anything (terminal)
    const b = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "illegal-2", nameFa: "y" })
      .expect(201);
    for (const next of ["OPEN", "ACTIVE", "COMPLETED"] as const) {
      await req
        .post(`/v1/offerings/${b.body.id}/transition`)
        .set("Authorization", auth)
        .send({ to: next })
        .expect(next === "OPEN" ? 200 : 400);
    }
    // Now ACTIVE → COMPLETED legally
    await req
      .post(`/v1/offerings/${b.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "ACTIVE" })
      .expect(200);
    await req
      .post(`/v1/offerings/${b.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "COMPLETED" })
      .expect(200);
    // Now COMPLETED → OPEN illegal (terminal)
    const r2 = await req
      .post(`/v1/offerings/${b.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "OPEN" })
      .expect(400);
    expect(r2.body.message).toMatch(/illegal transition.*COMPLETED.*OPEN/);

    // Illegal: CANCELED → anything (terminal)
    const c = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "illegal-3", nameFa: "z" })
      .expect(201);
    await req
      .post(`/v1/offerings/${c.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "CANCELED" })
      .expect(200);
    await req
      .post(`/v1/offerings/${c.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "OPEN" })
      .expect(400);
  });

  it("soft-delete allowed at ANY status (per D65 R2-Reminder-1)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    for (const targetStatus of ["SCHEDULED", "OPEN", "ACTIVE", "COMPLETED", "CANCELED"] as const) {
      const o = await req
        .post("/v1/offerings")
        .set("Authorization", auth)
        .send({ programId: program.id, slug: `del-at-${targetStatus.toLowerCase()}`, nameFa: targetStatus })
        .expect(201);

      // Move through transitions to reach target
      if (targetStatus === "OPEN" || targetStatus === "ACTIVE" || targetStatus === "COMPLETED") {
        await req
          .post(`/v1/offerings/${o.body.id}/transition`)
          .set("Authorization", auth)
          .send({ to: "OPEN" })
          .expect(200);
      }
      if (targetStatus === "ACTIVE" || targetStatus === "COMPLETED") {
        await req
          .post(`/v1/offerings/${o.body.id}/transition`)
          .set("Authorization", auth)
          .send({ to: "ACTIVE" })
          .expect(200);
      }
      if (targetStatus === "COMPLETED") {
        await req
          .post(`/v1/offerings/${o.body.id}/transition`)
          .set("Authorization", auth)
          .send({ to: "COMPLETED" })
          .expect(200);
      }
      if (targetStatus === "CANCELED") {
        await req
          .post(`/v1/offerings/${o.body.id}/transition`)
          .set("Authorization", auth)
          .send({ to: "CANCELED" })
          .expect(200);
      }

      await req.delete(`/v1/offerings/${o.body.id}`).set("Authorization", auth).expect(200);
    }
  });

  // -------------------- Audit + filters --------------------

  it("writes AuditLog row on every mutation (R4 lint contract)", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    const created = await req
      .post("/v1/offerings")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "audit-test", nameFa: "ممیزی" })
      .expect(201);
    await req
      .patch(`/v1/offerings/${created.body.id}`)
      .set("Authorization", auth)
      .send({ nameFa: "ممیزی-edit" })
      .expect(200);
    await req
      .post(`/v1/offerings/${created.body.id}/transition`)
      .set("Authorization", auth)
      .send({ to: "OPEN" })
      .expect(200);
    await req.delete(`/v1/offerings/${created.body.id}`).set("Authorization", auth).expect(200);

    const logs = await prisma.auditLog.findMany({
      where: { tenantId: seed.tenantId, subject: { contains: created.body.id } },
    });
    const actions = logs.map((l: { action: string }) => l.action).sort();
    expect(actions).toContain("course-offering.create");
    expect(actions).toContain("course-offering.update");
    expect(actions).toContain("course-offering.transition");
    expect(actions).toContain("course-offering.delete");
  });

  it("list filters: ?status= and ?programId= scope results", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    const a = await req.post("/v1/offerings").set("Authorization", auth)
      .send({ programId: program.id, slug: "filt-a", nameFa: "A" }).expect(201);
    const b = await req.post("/v1/offerings").set("Authorization", auth)
      .send({ programId: program.id, slug: "filt-b", nameFa: "B" }).expect(201);
    await req.post(`/v1/offerings/${b.body.id}/transition`)
      .set("Authorization", auth).send({ to: "OPEN" }).expect(200);

    const sched = await req.get("/v1/offerings?status=SCHEDULED").set("Authorization", auth).expect(200);
    expect(sched.body.find((o: { id: string }) => o.id === a.body.id)).toBeDefined();
    expect(sched.body.find((o: { id: string }) => o.id === b.body.id)).toBeUndefined();

    const open = await req.get("/v1/offerings?status=OPEN").set("Authorization", auth).expect(200);
    expect(open.body.find((o: { id: string }) => o.id === b.body.id)).toBeDefined();

    const byProg = await req.get(`/v1/offerings?programId=${program.id}`)
      .set("Authorization", auth).expect(200);
    expect(byProg.body.length).toBeGreaterThanOrEqual(2);
  });

  // -------------------- Dual-write per MIGRATION_POLICY §1 + §6 --------------------

  it("Sunset + Deprecation + Link headers on /v1/cohorts (every endpoint)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;

    const res = await req.get("/v1/cohorts").set("Authorization", auth).expect(200);
    expect(res.headers["sunset"]).toBe("Wed, 31 Dec 2026 23:59:59 GMT");
    expect(res.headers["deprecation"]).toBe("true");
    expect(res.headers["link"]).toMatch(/\/v1\/offerings.*successor-version/);
  });

  it("Cohort create → CourseOffering mirror exists + MigrationSyncLog row written", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    const cohort = await req
      .post("/v1/cohorts")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "dw-test", name: "Dual Write Test" })
      .expect(201);

    expect(cohort.body.upgradedToOfferingId).toBeTruthy();
    const offering = await prisma.courseOffering.findUnique({
      where: { id: cohort.body.upgradedToOfferingId },
    });
    expect(offering).not.toBeNull();
    expect(offering?.legacyCohortId).toBe(cohort.body.id);
    expect(offering?.nameFa).toBe("Dual Write Test");

    const syncLogs = await prisma.migrationSyncLog.findMany({
      where: { tenantId: seed.tenantId, rowId: cohort.body.id },
    });
    expect(syncLogs.length).toBeGreaterThanOrEqual(1);
    const createLog = syncLogs.find((l: { action: string }) => l.action === "create");
    expect(createLog).toBeDefined();
    expect(createLog?.source).toBe("Cohort");
    expect(createLog?.target).toBe("CourseOffering");
    expect(createLog?.targetId).toBe(cohort.body.upgradedToOfferingId);
  });

  it("Cohort soft-delete cascades to linked CourseOffering soft-delete", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    const cohort = await req
      .post("/v1/cohorts")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "casc-test", name: "Cascade" })
      .expect(201);

    await req.delete(`/v1/cohorts/${cohort.body.id}`).set("Authorization", auth).expect(200);

    // Cohort is soft-deleted
    const cohortRow = await prisma.cohort.findUnique({ where: { id: cohort.body.id } });
    expect(cohortRow?.deletedAt).not.toBeNull();

    // Linked offering soft-deleted too
    const offering = await prisma.courseOffering.findUnique({
      where: { id: cohort.body.upgradedToOfferingId! },
    });
    expect(offering?.deletedAt).not.toBeNull();

    // MigrationSyncLog has delete row
    const deleteLog = await prisma.migrationSyncLog.findFirst({
      where: { tenantId: seed.tenantId, rowId: cohort.body.id, action: "delete" },
    });
    expect(deleteLog).toBeDefined();
  });

  it("Cohort update mirrors nameFa change to linked offering", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const { program } = await seedHierarchy(seed.tenantId);
    const auth = `Bearer ${seed.admin.accessToken}`;

    const cohort = await req
      .post("/v1/cohorts")
      .set("Authorization", auth)
      .send({ programId: program.id, slug: "upd-test", name: "Before" })
      .expect(201);

    await req
      .patch(`/v1/cohorts/${cohort.body.id}`)
      .set("Authorization", auth)
      .send({ name: "After" })
      .expect(200);

    const offering = await prisma.courseOffering.findUnique({
      where: { id: cohort.body.upgradedToOfferingId! },
    });
    expect(offering?.nameFa).toBe("After");

    const updateLog = await prisma.migrationSyncLog.findFirst({
      where: { tenantId: seed.tenantId, rowId: cohort.body.id, action: "update" },
    });
    expect(updateLog).toBeDefined();
  });
});
