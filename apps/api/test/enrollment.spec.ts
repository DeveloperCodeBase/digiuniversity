import { createDemoCourse, createTestTenant, getRequest } from "./helpers";

describe("enrollments (Phase 3)", () => {
  it("student self-enrols, duplicate is 409, /me returns the row", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { courseId } = await createDemoCourse(seed);

    const first = await req
      .post("/v1/enrollments")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ courseId })
      .expect(201);
    expect(first.body.userId).toBe(seed.student.id);
    expect(first.body.status).toBe("active");

    // Re-enrolling the same active course is a conflict, not a silent
    // re-active.
    const dup = await req
      .post("/v1/enrollments")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ courseId })
      .expect(409);
    expect(String(dup.body.message)).toMatch(/already/i);

    // /me returns the active enrolment with the embedded course.
    const mine = await req
      .get("/v1/enrollments/me")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .expect(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].course.id).toBe(courseId);
  });

  it("student can withdraw themselves; admin can set any status", async () => {
    const req = await getRequest();
    const seed = await createTestTenant();
    const { courseId } = await createDemoCourse(seed);

    const enrol = await req
      .post("/v1/enrollments")
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ courseId })
      .expect(201);

    // Student withdraws self — allowed by the role-aware policy.
    const withdrew = await req
      .patch(`/v1/enrollments/${enrol.body.id}/status`)
      .set("Authorization", `Bearer ${seed.student.accessToken}`)
      .send({ status: "withdrawn" })
      .expect(200);
    expect(withdrew.body.status).toBe("withdrawn");

    // Admin can flip back to active afterwards.
    const reactivated = await req
      .patch(`/v1/enrollments/${enrol.body.id}/status`)
      .set("Authorization", `Bearer ${seed.admin.accessToken}`)
      .send({ status: "active" })
      .expect(200);
    expect(reactivated.body.status).toBe("active");
  });
});
