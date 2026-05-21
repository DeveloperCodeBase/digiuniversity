/**
 * Phase-20 unit test for `src/auth/password.ts`.
 *
 * Pure logic, no Nest container, no Prisma. Verifies the lazy
 * migration contract:
 *   - hashPassword produces an Argon2id hash for new users.
 *   - verifyPassword accepts both Argon2id (new) and bcrypt (legacy)
 *     so existing users don't lock out the moment we switch
 *     algorithms.
 *   - needsRehash flags bcrypt as needing replacement but is happy
 *     with a fresh Argon2id hash.
 *   - passwordAlgorithm classifies the hash family correctly.
 *
 * A frozen pre-computed bcrypt hash lets the spec run without
 * importing bcryptjs in the test code, so we exercise the verifier
 * exactly as it would behave on a stored legacy hash.
 */

import * as bcrypt from "bcryptjs";

import {
  hashPassword,
  needsRehash,
  passwordAlgorithm,
  verifyPassword,
} from "../src/auth/password";

// Generate the legacy bcrypt hash at suite setup rather than baking
// it in — this proves the verifier handles whatever shape bcryptjs
// actually produces today, not a frozen snapshot that could drift
// from the lib's defaults.
const LEGACY_PLAINTEXT = "correct horse battery staple";
let LEGACY_BCRYPT = "";
beforeAll(async () => {
  LEGACY_BCRYPT = await bcrypt.hash(LEGACY_PLAINTEXT, 10);
});

describe("password helpers (Phase-20)", () => {
  describe("hashPassword", () => {
    it("produces an Argon2id encoded hash", async () => {
      const hash = await hashPassword("hunter2-bf-9");
      expect(hash).toMatch(/^\$argon2id\$v=19\$/);
      expect(passwordAlgorithm(hash)).toBe("argon2id");
    });

    it("each call yields a different salt → a different hash", async () => {
      const a = await hashPassword("same-plain");
      const b = await hashPassword("same-plain");
      expect(a).not.toEqual(b);
    });
  });

  describe("verifyPassword", () => {
    it("verifies a fresh argon2id hash", async () => {
      const hash = await hashPassword("hunter2-bf-9");
      expect(await verifyPassword(hash, "hunter2-bf-9")).toBe(true);
      expect(await verifyPassword(hash, "hunter2-bf-x")).toBe(false);
    });

    it("verifies a legacy bcrypt hash (migration safety)", async () => {
      expect(await verifyPassword(LEGACY_BCRYPT, LEGACY_PLAINTEXT)).toBe(true);
      expect(await verifyPassword(LEGACY_BCRYPT, "wrong")).toBe(false);
    });

    it("returns false instead of throwing for a malformed hash", async () => {
      expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
      expect(await verifyPassword("", "anything")).toBe(false);
    });
  });

  describe("needsRehash", () => {
    it("flags bcrypt hashes for rehashing", () => {
      expect(needsRehash(LEGACY_BCRYPT)).toBe(true);
    });

    it("does not flag a fresh argon2id hash", async () => {
      const hash = await hashPassword("hunter2-bf-9");
      expect(needsRehash(hash)).toBe(false);
    });

    it("ignores empty hashes (defensive — corruption is a bigger issue)", () => {
      expect(needsRehash("")).toBe(false);
    });
  });

  describe("passwordAlgorithm", () => {
    it("classifies bcrypt", () => {
      expect(passwordAlgorithm(LEGACY_BCRYPT)).toBe("bcrypt");
    });
    it("classifies argon2id", async () => {
      expect(passwordAlgorithm(await hashPassword("x"))).toBe("argon2id");
    });
    it("treats unknown shapes as `unknown` rather than crashing", () => {
      expect(passwordAlgorithm("$pbkdf2$abc")).toBe("unknown");
    });
  });
});
