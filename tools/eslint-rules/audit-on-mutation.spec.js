#!/usr/bin/env node
/*
 * Phase A R4 — self-test for audit-on-mutation.js
 *
 * Uses Node's built-in `node:test` runner (no jest, no mocha) so this
 * spec runs against the same Node the lint rule itself uses, with
 * zero new dependencies.
 *
 * Run:
 *   node --test tools/eslint-rules/audit-on-mutation.spec.js
 *
 * The fixture pattern: write small synthetic controller files to an
 * OS tmpdir, scan them, and assert the violation array contents. This
 * proves the rule catches what it should catch and doesn't catch what
 * it shouldn't.
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { scanFile } = require("./audit-on-mutation.js");

/**
 * Write a controller-shaped TS file to a fresh tmpdir and return the
 * absolute path. The tmpdir is cleaned up by node:test's teardown.
 */
function makeFixture(t, name, source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r4-audit-lint-"));
  t.after(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {
      /* tmp cleanup best-effort */
    }
  });
  const file = path.join(dir, `${name}.controller.ts`);
  fs.writeFileSync(file, source, "utf8");
  return file;
}

test("positive: mutation handler with @AuditAction passes", (t) => {
  const file = makeFixture(
    t,
    "passing-with-action",
    `
import { Controller, Post } from "@nestjs/common";
import { AuditAction } from "../audit/audit-action.decorator";

@Controller("things")
export class ThingsController {
  @Post()
  @AuditAction("thing.create")
  create() { return { ok: true }; }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 0, "should not flag @AuditAction-decorated mutation");
});

test("positive: mutation handler with @AuditSkip passes", (t) => {
  const file = makeFixture(
    t,
    "passing-with-skip",
    `
import { Controller, Post } from "@nestjs/common";
import { AuditSkip } from "../audit/audit-action.decorator";

@Controller("things")
export class ThingsController {
  @Post()
  @AuditSkip()
  create() { return { ok: true }; }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 0, "should not flag @AuditSkip-decorated mutation");
});

test("positive: mutation handler with this.audit.log() body call passes", (t) => {
  const file = makeFixture(
    t,
    "passing-with-body-call",
    `
import { Controller, Post } from "@nestjs/common";

@Controller("things")
export class ThingsController {
  constructor(private readonly audit: any) {}
  @Post()
  async create() {
    await this.audit.log({ action: "thing.create" });
    return { ok: true };
  }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 0, "should not flag method that calls this.audit.log(...)");
});

test("positive: mutation handler with this.auditService.write() body call passes", (t) => {
  const file = makeFixture(
    t,
    "passing-with-auditservice-write",
    `
import { Controller, Patch } from "@nestjs/common";

@Controller("things")
export class ThingsController {
  constructor(private readonly auditService: any) {}
  @Patch(":id")
  async update() {
    this.auditService.write({ action: "thing.update" });
    return { ok: true };
  }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 0, "should not flag method that calls this.auditService.write(...)");
});

test("negative: mutation handler with no audit hook is flagged", (t) => {
  const file = makeFixture(
    t,
    "failing-bare-mutation",
    `
import { Controller, Post } from "@nestjs/common";

@Controller("things")
export class ThingsController {
  @Post()
  create() { return { ok: true }; }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 1, "should flag bare @Post");
  assert.equal(violations[0].method, "create");
  assert.ok(violations[0].decorators.includes("Post"), "decorators array contains Post");
});

test("negative: every mutation verb is flagged when undecorated", (t) => {
  const file = makeFixture(
    t,
    "failing-all-verbs",
    `
import { Controller, Post, Put, Patch, Delete, Get } from "@nestjs/common";

@Controller("things")
export class ThingsController {
  @Post()    a() {}
  @Put(":id")  b() {}
  @Patch(":id") c() {}
  @Delete(":id") d() {}
  @Get()     read() {}
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 4, "Post, Put, Patch, Delete all flagged");
  const flaggedMethods = violations.map((v) => v.method).sort();
  assert.deepEqual(flaggedMethods, ["a", "b", "c", "d"]);
  assert.ok(!flaggedMethods.includes("read"), "@Get is never flagged");
});

test("edge: @Get is never flagged (read-only)", (t) => {
  const file = makeFixture(
    t,
    "edge-get-readonly",
    `
import { Controller, Get } from "@nestjs/common";

@Controller("things")
export class ThingsController {
  @Get()
  list() { return []; }

  @Get(":id")
  one() { return {}; }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 0, "@Get handlers are read-only — never flagged");
});

test("edge: random this.foo.log() does NOT count as audit", (t) => {
  // This is the trickiest case: a careless reviewer might think
  // "the method calls log, that's an audit." The rule must reject
  // it — only this.audit.log / this.auditService.log etc. count.
  const file = makeFixture(
    t,
    "edge-foreign-logger",
    `
import { Controller, Post } from "@nestjs/common";

@Controller("things")
export class ThingsController {
  constructor(private readonly logger: any) {}
  @Post()
  create() {
    this.logger.log("creating thing");  // NOT an audit call
    return { ok: true };
  }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 1, "this.logger.log() must NOT satisfy the rule");
});

test("edge: nested function expression with audit.log() still counts", (t) => {
  // The walker is recursive — it should find audit.log inside any
  // nested arrow/function body within the method.
  const file = makeFixture(
    t,
    "edge-nested-audit",
    `
import { Controller, Post } from "@nestjs/common";

@Controller("things")
export class ThingsController {
  constructor(private readonly audit: any) {}
  @Post()
  async create() {
    const helper = async () => {
      await this.audit.log({ action: "x" });
    };
    await helper();
    return { ok: true };
  }
}
`,
  );
  const violations = scanFile(file);
  assert.equal(violations.length, 0, "nested this.audit.log() inside arrow body should satisfy");
});
