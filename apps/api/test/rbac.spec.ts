import { createTestTenant, getRequest } from "./helpers";

describe("RBAC (Phase 2 + Phase 3)", () => {
  it("students cannot list users (admin only)", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();

    const res = await req
      .get("/v1/users")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(403);
    expect(String(res.body.message)).toContain("admin");
  });

  it("admin sees the same /users list it expects", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const list = await req
      .get("/v1/users")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .expect(200);
    const emails = (list.body as Array<{ email: string }>).map((u) => u.email);
    expect(emails).toContain(seed.admin.email);
    expect(emails).toContain(seed.student.email);
  });

  it("unauthenticated requests get 401", async () => {
    const req = await getRequest();
    await req.get("/v1/users/me").expect(401);
  });
});
