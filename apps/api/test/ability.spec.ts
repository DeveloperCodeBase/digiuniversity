/**
 * Phase-15 R6 unit test for `AbilityFactory`.
 *
 * Pure logic — no Nest container, no Prisma, no http. The factory takes
 * an AuthenticatedUser-shaped object and returns a CASL ability set;
 * we just assert which (action, subject) pairs it grants per role.
 *
 * If a new subject lands in `Subjects`, the table-driven cases below
 * are the first thing to update. The "always denied" cases catch
 * accidental over-grants that the role-by-role positive cases might
 * miss — adding `can("manage", "all")` to `support` would obviously
 * break "support cannot manage Tenant", for example.
 */

import { AbilityFactory } from "../src/authz/ability.factory";
import type { AuthenticatedUser } from "../src/auth/auth.types";

const mkUser = (roles: string[]): AuthenticatedUser => ({
  userId: "u_" + roles.join("_"),
  tenantId: "t_test",
  tenantSlug: "test",
  email: roles[0] + "@example.test",
  fullName: roles[0] + " test",
  roles,
});

describe("AbilityFactory (Phase-15 R6)", () => {
  const factory = new AbilityFactory();

  describe("anonymous", () => {
    it("an empty/null user gets an empty ability", () => {
      const ability = factory.createForUser(null);
      expect(ability.can("read", "Course")).toBe(false);
      expect(ability.can("read", "AuditLog")).toBe(false);
    });

    it("a user with no roles gets an empty ability", () => {
      const ability = factory.createForUser(mkUser([]));
      expect(ability.can("read", "Course")).toBe(false);
    });
  });

  describe("super_admin", () => {
    const ability = factory.createForUser(mkUser(["super_admin"]));

    it("can manage everything", () => {
      expect(ability.can("read", "Course")).toBe(true);
      expect(ability.can("create", "Tenant")).toBe(true);
      expect(ability.can("delete", "User")).toBe(true);
      expect(ability.can("grade", "Submission")).toBe(true);
    });

    it("cannot delete AuditLog — forensic continuity is non-negotiable", () => {
      expect(ability.can("delete", "AuditLog")).toBe(false);
      // …but can still read it.
      expect(ability.can("read", "AuditLog")).toBe(true);
    });
  });

  describe("admin", () => {
    const ability = factory.createForUser(mkUser(["admin"]));

    it("can manage within their tenant", () => {
      expect(ability.can("update", "Course")).toBe(true);
      expect(ability.can("read", "AuditLog")).toBe(true);
      expect(ability.can("grade", "Submission")).toBe(true);
    });

    it("cannot create or delete a Tenant — that's super_admin", () => {
      expect(ability.can("create", "Tenant")).toBe(false);
      expect(ability.can("delete", "Tenant")).toBe(false);
    });

    it("cannot delete AuditLog", () => {
      expect(ability.can("delete", "AuditLog")).toBe(false);
    });
  });

  describe("instructor", () => {
    const ability = factory.createForUser(mkUser(["instructor"]));

    it("can run their own courses end-to-end", () => {
      expect(ability.can("update", "Course")).toBe(true);
      expect(ability.can("publish", "Course")).toBe(true);
      expect(ability.can("grade", "Submission")).toBe(true);
      expect(ability.can("create", "ClassSession")).toBe(true);
    });

    it("cannot touch the audit trail or other users", () => {
      expect(ability.can("read", "AuditLog")).toBe(false);
      expect(ability.can("update", "User")).toBe(false);
      expect(ability.can("create", "Tenant")).toBe(false);
    });
  });

  describe("ta", () => {
    const ability = factory.createForUser(mkUser(["ta"]));

    it("can grade and read courses but not modify the catalogue", () => {
      expect(ability.can("grade", "Submission")).toBe(true);
      expect(ability.can("read", "Course")).toBe(true);
      expect(ability.can("update", "Course")).toBe(false);
      expect(ability.can("delete", "Assessment")).toBe(false);
    });
  });

  describe("content_manager", () => {
    const ability = factory.createForUser(mkUser(["content_manager"]));

    it("owns course content but not enrollments or grades", () => {
      expect(ability.can("publish", "Course")).toBe(true);
      expect(ability.can("delete", "Assessment")).toBe(true);
      expect(ability.can("grade", "Submission")).toBe(false);
      expect(ability.can("read", "Enrollment")).toBe(false);
    });
  });

  describe("support", () => {
    const ability = factory.createForUser(mkUser(["support"]));

    it("can read forensic data + reset users", () => {
      expect(ability.can("read", "AuditLog")).toBe(true);
      expect(ability.can("read", "User")).toBe(true);
      expect(ability.can("update", "User")).toBe(true); // password reset
      expect(ability.can("read", "Tenant")).toBe(true);
    });

    it("cannot teach, grade, or break course content", () => {
      expect(ability.can("grade", "Submission")).toBe(false);
      expect(ability.can("update", "Course")).toBe(false);
      expect(ability.can("delete", "AuditLog")).toBe(false);
    });
  });

  describe("moderator", () => {
    const ability = factory.createForUser(mkUser(["moderator"]));

    it("moderates Document but not Course / Submission", () => {
      expect(ability.can("moderate", "Document")).toBe(true);
      expect(ability.can("delete", "Document")).toBe(true);
      expect(ability.can("update", "Course")).toBe(false);
      expect(ability.can("grade", "Submission")).toBe(false);
    });
  });

  describe("student", () => {
    const ability = factory.createForUser(mkUser(["student"]));

    it("browses the catalogue + creates their own work", () => {
      expect(ability.can("read", "Course")).toBe(true);
      expect(ability.can("create", "Enrollment")).toBe(true);
      expect(ability.can("create", "Submission")).toBe(true);
      expect(ability.can("create", "LearningEvent")).toBe(true);
    });

    it("cannot grade, update courses, or read AuditLog", () => {
      expect(ability.can("grade", "Submission")).toBe(false);
      expect(ability.can("update", "Course")).toBe(false);
      expect(ability.can("read", "AuditLog")).toBe(false);
    });
  });

  describe("parent + org", () => {
    it("parent reads their child-shaped subjects but cannot write", () => {
      const ability = factory.createForUser(mkUser(["parent"]));
      expect(ability.can("read", "Enrollment")).toBe(true);
      expect(ability.can("read", "Submission")).toBe(true);
      expect(ability.can("create", "Submission")).toBe(false);
      expect(ability.can("update", "User")).toBe(false);
    });

    it("org reads their team-shaped subjects but cannot write", () => {
      const ability = factory.createForUser(mkUser(["org"]));
      expect(ability.can("read", "User")).toBe(true);
      expect(ability.can("read", "Enrollment")).toBe(true);
      expect(ability.can("update", "User")).toBe(false);
    });
  });

  describe("composite roles", () => {
    it("instructor + ta combines (union of grants)", () => {
      const ability = factory.createForUser(mkUser(["instructor", "ta"]));
      // From instructor:
      expect(ability.can("publish", "Course")).toBe(true);
      // From ta:
      expect(ability.can("grade", "Submission")).toBe(true);
      // Neither grants AuditLog read:
      expect(ability.can("read", "AuditLog")).toBe(false);
    });

    it("admin + super_admin = super_admin's powers (manage all minus delete AuditLog)", () => {
      const ability = factory.createForUser(mkUser(["admin", "super_admin"]));
      expect(ability.can("create", "Tenant")).toBe(true); // super_admin grants it
      expect(ability.can("delete", "AuditLog")).toBe(false); // both forbid it
    });
  });
});
