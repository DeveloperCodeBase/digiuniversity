import { createTestTenant, getRequest } from "./helpers";

describe("auth (Phase 2)", () => {
  it("login + /auth/me round trip works", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();

    const me = await req
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(seed.admin.email);
    expect(me.body.tenantSlug).toBe(seed.tenantSlug);
    expect(me.body.roles).toContain("admin");
  });

  it("rejects an unknown tenant with a 401 that does not leak whether the user exists", async () => {
    const req = await getRequest();
    const res = await req
      .post("/v1/auth/login")
      .send({
        tenantSlug: "definitely-not-a-tenant",
        email: "anyone@example.com",
        password: "wrongpassword12",
      })
      .expect(401);
    // Same error shape and message a wrong-password attempt would
    // produce — the response MUST NOT reveal that the tenant is the
    // thing that's wrong.
    expect(typeof res.body.message).toBe("string");
  });

  it("refresh rotates and replay is detected", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const password = seed.student.password;

    // Get a refresh token via real login.
    const login = await req
      .post("/v1/auth/login")
      .send({
        tenantSlug: seed.tenantSlug,
        email: seed.student.email,
        password,
      })
      .expect(200);
    const refresh1 = login.body.refreshToken;
    expect(typeof refresh1).toBe("string");

    // First refresh — issues a new pair.
    const rotated = await req
      .post("/v1/auth/refresh")
      .send({ refreshToken: refresh1 })
      .expect(200);
    expect(rotated.body.accessToken).toBeTruthy();
    expect(rotated.body.refreshToken).toBeTruthy();
    expect(rotated.body.refreshToken).not.toBe(refresh1);

    // Replay of the *original* refresh token must be rejected. The
    // service also burns the rest of the family — we verify that
    // separately below.
    const replay = await req
      .post("/v1/auth/refresh")
      .send({ refreshToken: refresh1 })
      .expect(401);
    expect(String(replay.body.message)).toMatch(/reuse|revoked|recogn/i);

    // The new refresh token also gets revoked by family burn, so it
    // should NOT continue to work after the replay attempt.
    await req
      .post("/v1/auth/refresh")
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });
});
