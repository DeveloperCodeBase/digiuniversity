import { createDemoCourse, createTestTenant, getRequest } from "./helpers";

/**
 * Phase-15 R3 + R6 end-to-end: AuditInterceptor captures every
 * mutating endpoint, the AuditController surfaces the rows through
 * /v1/audit-logs with both the @Roles coarse gate and the CASL
 * @CheckPolicies fine gate.
 *
 * We exercise the real chain — supertest hits /v1/courses POST,
 * which the AuditInterceptor wraps, which writes to AuditLog. Then
 * we query /v1/audit-logs as admin to confirm the row landed and
 * as student to confirm the gate rejects.
 */
describe("AuditLog (Phase 15 R3 + R6)", () => {
  it("admin sees a course.create row after creating a course", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    await createDemoCourse(seed);

    const res = await req
      .get("/v1/audit-logs?action=course.create&limit=10")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .expect(200);

    const body = res.body as {
      total: number;
      limit: number;
      offset: number;
      items: Array<{
        action: string;
        subject: string;
        actor: { email: string } | null;
      }>;
    };
    expect(body.total).toBeGreaterThanOrEqual(1);
    // The CS-T01 course is the most recent course.create for this
    // tenant (createTestTenant builds a fresh tenant per spec, so
    // nothing else writes to it).
    const newestCreate = body.items.find((i) => i.action === "course.create");
    expect(newestCreate).toBeDefined();
    expect(newestCreate?.actor?.email).toBe(seed.admin.email);
    // Subject format is "<id>" — the response.id of the created
    // course. Not the route template :id; the interceptor reads the
    // actual created entity's id from the handler's return value.
    expect(typeof newestCreate?.subject).toBe("string");
    expect((newestCreate?.subject ?? "").length).toBeGreaterThan(0);
  });

  it("student GET /v1/audit-logs is 403 (Roles or CASL gate)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();

    await req
      .get("/v1/audit-logs?limit=1")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(403);
  });

  it("filter by actorId narrows to that user's audit rows only", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    await createDemoCourse(seed);

    const res = await req
      .get(`/v1/audit-logs?actorId=${encodeURIComponent(seed.admin.id)}&limit=50`)
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .expect(200);

    const items = (res.body as { items: Array<{ actor: { id: string } | null }> }).items;
    expect(items.length).toBeGreaterThanOrEqual(1);
    // Every returned row must be this actor's — proves the filter
    // isn't a no-op.
    for (const row of items) {
      expect(row.actor?.id).toBe(seed.admin.id);
    }
  });

  it("limit caps at 200 (oversized requests are clamped)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    await createDemoCourse(seed);

    // 500 exceeds the controller's @Max(200) validator → 400 from
    // class-validator. Verifies the bound is enforced rather than
    // silently honored.
    await req
      .get("/v1/audit-logs?limit=500")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .expect(400);
  });
});
