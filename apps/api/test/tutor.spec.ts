import { createTestTenant, getPrisma, getRequest } from "./helpers";

describe("AI tutor (Phase 9) + AI audit (Phase 6 bridge)", () => {
  it("ask persists user + assistant turns + an audit log row + a learning event", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();

    // Create a session.
    const session = await req
      .post("/v1/tutor/sessions")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ title: "test session" })
      .expect(201);

    // Ask a question — the api will forward to ai-gateway.
    // Note: tests run inside the api container on the digiuniversity_web
    // network, so ai-gateway is reachable at http://ai-gateway:8000.
    const res = await req
      .post(`/v1/tutor/sessions/${session.body.id}/ask`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ question: "what is overfitting?" })
      .expect(200);

    expect(res.body.userMessage.role).toBe("user");
    expect(res.body.assistantMessage.role).toBe("assistant");
    expect(res.body.assistantMessage.aiRequestId).toMatch(/^req_/);
    expect(typeof res.body.assistantMessage.confidence).toBe("number");
    expect(res.body.assistantMessage.humanReviewRequired).toBe(true);

    // Both turns are persisted.
    const detail = await req
      .get(`/v1/tutor/sessions/${session.body.id}`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(200);
    expect(detail.body.messages).toHaveLength(2);

    // AiInteractionLog row exists for this requestId.
    const p = await getPrisma();
    const log = await p.aiInteractionLog.findUnique({
      where: { requestId: res.body.assistantMessage.aiRequestId },
    });
    expect(log).not.toBeNull();
    expect(log!.tenantId).toBe(seed.tenantId);
    expect(log!.userId).toBe(seed.student.id);
    expect(log!.humanReviewRequired).toBe(true);

    // The learning event was emitted.
    const event = await p.learningEvent.findFirst({
      where: {
        tenantId: seed.tenantId,
        userId: seed.student.id,
        type: "ai_tutor_asked",
      },
      orderBy: { occurredAt: "desc" },
    });
    expect(event).not.toBeNull();
  });

  it("students cannot read another user's session", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();

    const adminSession = await req
      .post("/v1/tutor/sessions")
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ title: "admin scratch" })
      .expect(201);

    await req
      .get(`/v1/tutor/sessions/${adminSession.body.id}`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(403);
  });
});
