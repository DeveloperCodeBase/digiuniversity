// Phase B R6 (D80) — applicant self-service tracking by token, e2e spec.
//
// Covers:
//   • submitPublic mints a 192-bit trackingToken (returned to the submitter
//     so the confirmation page can build the /track link)
//   • GET /track?token= returns the PII-masked view (status + reference +
//     masked email/phone), NO nationalId, NO internal ids
//   • forged / empty token → 404 (no enumeration leak)
//   • withdraw-by-token → WITHDRAWN, recorded with the public-track
//     sentinel actor; canWithdraw flips false
//   • token-withdraw on a decided (REJECTED) application → 400 (state
//     machine enforced even via the public path)
//   • idempotent re-submit returns the SAME token
//   • instructor variant: token + masked view (departmentName)
//
// Throttle-aware: each test is self-contained with a fresh tenant; no
// single test exceeds the per-route limits (5/hr submit + withdraw,
// 30/hr track). Pattern matches applications-r3b.spec.ts.

import { randomUUID } from "node:crypto";

import { createTestTenant, getPrisma, getRequest } from "./helpers";

async function seedProgram(tenantId: string) {
  const prisma = await getPrisma();
  const suffix = randomUUID().slice(0, 6);
  const school = await prisma.school.create({
    data: { tenantId, slug: `r6-${suffix}-sch`, nameFa: "علوم R6" },
  });
  const faculty = await prisma.faculty.create({
    data: { tenantId, slug: `r6-${suffix}-fac`, name: "Faculty R6", schoolId: school.id },
  });
  const department = await prisma.department.create({
    data: { tenantId, facultyId: faculty.id, slug: `r6-${suffix}-dept`, name: "Dept R6" },
  });
  const program = await prisma.program.create({
    data: {
      tenantId,
      departmentId: department.id,
      slug: `r6-${suffix}-prog`,
      name: "BSc R6",
      degreeLevel: "bachelor",
    },
  });
  return { department, program };
}

describe("@phase-b-r6 tracking token — student", () => {
  it("submit mints a trackingToken; GET /track returns the PII-masked view", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedProgram(seed.tenantId);
    const email = `track-${randomUUID().slice(0, 8)}@test.local`;

    const submitted = await req
      .post("/v1/applications/student")
      .send({
        tenantSlug: seed.tenantSlug,
        programId: program.id,
        applicantFullName: "Track Applicant",
        applicantEmail: email,
        applicantPhone: "09121234567",
        applicantNationalId: "1234567890",
      })
      .expect(201);

    // The submitter gets the raw token back so they can build the link.
    const token = submitted.body.trackingToken as string;
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThanOrEqual(32); // 192-bit base64url ≈ 32 chars

    const tracked = await req
      .get(`/v1/applications/student/track?token=${encodeURIComponent(token)}`)
      .expect(200);

    // Masked view shape.
    expect(tracked.body.status).toBe("SUBMITTED");
    expect(tracked.body.type).toBe("student");
    expect(tracked.body.reference).toMatch(/^APP-[A-Z0-9]{6}$/);
    expect(tracked.body.programName).toBe("BSc R6");
    expect(tracked.body.canWithdraw).toBe(true);

    // PII masking: email masked, phone last-4 only, nationalId ABSENT.
    expect(tracked.body.applicantEmailMasked).toContain("@test.local");
    expect(tracked.body.applicantEmailMasked).not.toBe(email);
    expect(tracked.body.applicantEmailMasked).toMatch(/\*/);
    expect(tracked.body.applicantPhoneMasked).toBe("***4567");

    // No internal ids / raw PII leaked over the bearer-token surface.
    expect(tracked.body.id).toBeUndefined();
    expect(tracked.body.userId).toBeUndefined();
    expect(tracked.body.programId).toBeUndefined();
    expect(tracked.body.trackingToken).toBeUndefined();
    expect(tracked.body.applicantNationalId).toBeUndefined();
    expect(tracked.body.applicantEmail).toBeUndefined();
    expect(tracked.body.applicantPhone).toBeUndefined();
    expect(JSON.stringify(tracked.body)).not.toContain("1234567890");
  });

  it("forged + empty tokens → 404 (no enumeration leak)", async () => {
    const req = await getRequest();
    await req
      .get(`/v1/applications/student/track?token=${"deadbeef".repeat(4)}`)
      .expect(404);
    await req.get("/v1/applications/student/track?token=").expect(404);
  });

  it("idempotent re-submit returns the SAME tracking token", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { program } = await seedProgram(seed.tenantId);
    const email = `idem-${randomUUID().slice(0, 8)}@test.local`;

    const first = await req
      .post("/v1/applications/student")
      .send({ tenantSlug: seed.tenantSlug, programId: program.id, applicantFullName: "Idem", applicantEmail: email })
      .expect(201);
    const dup = await req
      .post("/v1/applications/student")
      .send({ tenantSlug: seed.tenantSlug, programId: program.id, applicantFullName: "Idem", applicantEmail: email })
      .expect(200);

    expect(dup.body._idempotent).toBe(true);
    expect(dup.body.trackingToken).toBe(first.body.trackingToken);
  });

  it("withdraw-by-token flips to WITHDRAWN with the public-track sentinel actor", async () => {
    const req = await getRequest();
    const prisma = await getPrisma();
    const seed = await createTestTenant();
    const { program } = await seedProgram(seed.tenantId);

    const submitted = await req
      .post("/v1/applications/student")
      .send({
        tenantSlug: seed.tenantSlug,
        programId: program.id,
        applicantFullName: "Withdrawer",
        applicantEmail: `wd-${randomUUID().slice(0, 8)}@test.local`,
      })
      .expect(201);
    const token = submitted.body.trackingToken as string;

    const res = await req
      .post("/v1/applications/student/track/withdraw")
      .send({ token })
      .expect(200);
    expect(res.body.status).toBe("WITHDRAWN");
    expect(res.body.canWithdraw).toBe(false);

    // DB: status WITHDRAWN + sentinel actor recorded (no User for anon).
    const row = await prisma.studentApplication.findUnique({
      where: { id: submitted.body.id },
      select: { status: true, decidedBy: true },
    });
    expect(row?.status).toBe("WITHDRAWN");
    expect(row?.decidedBy).toBe("public:track-token");
  });

  it("token-withdraw on a decided (REJECTED) application → 400 (state machine)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const auth = `Bearer ${seed.admin.accessToken}`;
    const { program } = await seedProgram(seed.tenantId);

    const submitted = await req
      .post("/v1/applications/student")
      .send({
        tenantSlug: seed.tenantSlug,
        programId: program.id,
        applicantFullName: "Rejected One",
        applicantEmail: `rej-${randomUUID().slice(0, 8)}@test.local`,
        applicantPhone: "09120000000",
      })
      .expect(201);
    const token = submitted.body.trackingToken as string;
    const id = submitted.body.id as string;

    // Admin advances to REJECTED (verification gate satisfied first).
    await req.post(`/v1/applications/student/${id}/transition`).set("Authorization", auth).send({ to: "UNDER_REVIEW" }).expect(200);
    await req.patch(`/v1/applications/student/${id}/verify-email`).set("Authorization", auth).expect(200);
    await req.patch(`/v1/applications/student/${id}/verify-phone`).set("Authorization", auth).expect(200);
    await req.post(`/v1/applications/student/${id}/transition`).set("Authorization", auth).send({ to: "REJECTED" }).expect(200);

    // Token holder can still READ (status REJECTED, canWithdraw false)...
    const tracked = await req
      .get(`/v1/applications/student/track?token=${encodeURIComponent(token)}`)
      .expect(200);
    expect(tracked.body.status).toBe("REJECTED");
    expect(tracked.body.canWithdraw).toBe(false);

    // ...but withdraw is rejected by the state machine even via the token path.
    const res = await req
      .post("/v1/applications/student/track/withdraw")
      .send({ token })
      .expect(400);
    expect(res.body.message).toMatch(/Allowed from REJECTED/);
  });
});

describe("@phase-b-r6 tracking token — instructor", () => {
  it("submit mints a token; GET /track returns the masked view with departmentName", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { department } = await seedProgram(seed.tenantId);
    const email = `instr-track-${randomUUID().slice(0, 8)}@test.local`;

    const submitted = await req
      .post("/v1/applications/instructor")
      .send({
        tenantSlug: seed.tenantSlug,
        departmentId: department.id,
        applicantFullName: "Instructor Track",
        applicantEmail: email,
        applicantPhone: "09129998877",
        expertise: ["ml"],
      })
      .expect(201);
    const token = submitted.body.trackingToken as string;
    expect(typeof token).toBe("string");

    const tracked = await req
      .get(`/v1/applications/instructor/track?token=${encodeURIComponent(token)}`)
      .expect(200);
    expect(tracked.body.type).toBe("instructor");
    expect(tracked.body.status).toBe("SUBMITTED");
    expect(tracked.body.departmentName).toBe("Dept R6");
    expect(tracked.body.applicantPhoneMasked).toBe("***8877");
    expect(tracked.body.applicantNationalId).toBeUndefined();
  });
});
