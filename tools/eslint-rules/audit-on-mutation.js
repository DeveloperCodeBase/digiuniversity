#!/usr/bin/env node
/*
 * Phase A R4 — audit-on-mutation enforcement
 *
 * Fails CI when a NestJS controller mutation handler (@Post / @Put /
 * @Patch / @Delete) lacks an audit decision. Three things satisfy the
 * rule:
 *
 *   1. @AuditAction("foo.bar")              — canonical action name.
 *   2. @AuditSkip()                         — explicit opt-out (with
 *                                              a code comment please).
 *   3. this.audit.log({ ... })              — manual write inside the
 *      this.auditService.log({ ... })        method body.
 *
 * The runtime `AuditInterceptor` already writes a row for every
 * authenticated 2xx mutation, but it falls back to a noisy
 * `<method>.<path-segment>` action name when no @AuditAction is
 * present. This rule forces the canonical name at the source, and
 * forces explicit opt-out for routes that legitimately skip audit
 * (public auth endpoints, high-frequency event firehoses).
 *
 * Why a standalone Node script instead of a real ESLint plugin?
 *
 * The api workspace doesn't have ESLint installed (Phase A "Foundation
 * Repair" is not the moment to add a 50MB dep tree). We reuse the
 * `typescript` compiler the api already pins for `tsc --noEmit` and
 * walk the AST directly. Same enforcement strength; zero new deps.
 *
 * If Phase B+ wants a true ESLint plugin, the rule logic here ports
 * cleanly — ESLint's AST exposes the same node shapes.
 *
 * Usage:
 *   node tools/eslint-rules/audit-on-mutation.js
 *
 * Exit codes:
 *   0  no violations
 *   1  violations printed to stderr
 *   2  internal error (typescript not resolvable, scan failed, etc.)
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const API_SRC = path.join(REPO_ROOT, "apps", "api", "src");

// We require typescript from the api workspace so this script works
// from the repo root without the dep being hoisted. If `typescript`
// is moved elsewhere later, fall through to a top-level require.
let ts;
try {
  ts = require(path.join(REPO_ROOT, "apps", "api", "node_modules", "typescript"));
} catch (_) {
  try {
    ts = require("typescript");
  } catch (err) {
    process.stderr.write(
      "audit-on-mutation: cannot resolve `typescript`. Run `npm install` in apps/api first.\n",
    );
    process.exit(2);
  }
}

const MUTATION_DECORATORS = new Set(["Post", "Put", "Patch", "Delete"]);
const AUDIT_DECORATORS = new Set(["AuditAction", "AuditSkip"]);
// Service field names that satisfy the rule when called inside the
// method body. Keep this list narrow — `this.foo.log(...)` is NOT a
// satisfying call (would silently pass on any random logger).
const AUDIT_SERVICE_FIELDS = new Set(["audit", "auditService", "auditLog", "audits"]);
const AUDIT_METHOD_NAMES = new Set(["log", "write", "record"]);

/** Recursively list every *.controller.ts file under apps/api/src. */
function listControllerFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listControllerFiles(full));
    } else if (entry.isFile() && full.endsWith(".controller.ts")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Return the identifier name of a decorator's call expression. e.g.
 * `@Post("login")` → "Post". Returns null for shapes we don't
 * recognise (so the rule never crashes on a parser surprise).
 */
function decoratorIdentifier(decorator) {
  if (!decorator || !decorator.expression) return null;
  const expr = decorator.expression;
  // `@Post()` → CallExpression whose `.expression` is the Identifier.
  if (ts.isCallExpression(expr)) {
    if (ts.isIdentifier(expr.expression)) return expr.expression.text;
    return null;
  }
  // `@AuditSkip` (rare — usually called) → Identifier directly.
  if (ts.isIdentifier(expr)) return expr.text;
  return null;
}

/**
 * Walk a method body looking for `this.<auditField>.<method>(...)`.
 * The field whitelist + method whitelist prevent random `this.x.log()`
 * calls from passing the rule by accident.
 */
function methodCallsAuditService(method) {
  if (!method.body) return false;
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const innerExpr = node.expression.expression;
      const methodName = node.expression.name && node.expression.name.text;
      if (
        ts.isPropertyAccessExpression(innerExpr) &&
        innerExpr.expression.kind === ts.SyntaxKind.ThisKeyword &&
        AUDIT_SERVICE_FIELDS.has(innerExpr.name.text) &&
        methodName &&
        AUDIT_METHOD_NAMES.has(methodName)
      ) {
        found = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(method.body);
  return found;
}

/**
 * Collect violations for a single source file. Returns an array of
 * { file, line, col, method, hasMutation, decorators } records.
 */
function scanFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.ES2022,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  const violations = [];

  const visit = (node) => {
    if (ts.isClassDeclaration(node)) {
      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member)) continue;
        // TS 5.x: decorators live on the modifiers array. We accept
        // either shape so the rule works across minor TS versions.
        const decorators = ts.canHaveDecorators
          ? (ts.getDecorators(member) || [])
          : (member.decorators || []);

        const decoratorNames = decorators
          .map(decoratorIdentifier)
          .filter(Boolean);

        const hasMutation = decoratorNames.some((d) => MUTATION_DECORATORS.has(d));
        if (!hasMutation) continue;

        const hasAuditDecorator = decoratorNames.some((d) => AUDIT_DECORATORS.has(d));
        const hasAuditCall = methodCallsAuditService(member);

        if (!hasAuditDecorator && !hasAuditCall) {
          const nameNode = member.name;
          const methodName =
            nameNode && ts.isIdentifier(nameNode) ? nameNode.text : "<anonymous>";
          const { line, character } = sf.getLineAndCharacterOfPosition(
            member.getStart(sf),
          );
          violations.push({
            file: path.relative(REPO_ROOT, filePath),
            line: line + 1,
            col: character + 1,
            method: methodName,
            decorators: decoratorNames,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return violations;
}

// Exported for the sibling .spec.js. CLI path stays the same.
module.exports = {
  scanFile,
  listControllerFiles,
  decoratorIdentifier,
  methodCallsAuditService,
  MUTATION_DECORATORS,
  AUDIT_DECORATORS,
  AUDIT_SERVICE_FIELDS,
  AUDIT_METHOD_NAMES,
};

function main() {
  const files = listControllerFiles(API_SRC);
  if (files.length === 0) {
    process.stderr.write(
      `audit-on-mutation: no controller files under ${API_SRC}\n`,
    );
    process.exit(2);
  }

  const allViolations = [];
  for (const f of files) {
    try {
      allViolations.push(...scanFile(f));
    } catch (err) {
      process.stderr.write(
        `audit-on-mutation: scan failed for ${f}: ${
          err && err.message ? err.message : String(err)
        }\n`,
      );
      process.exit(2);
    }
  }

  if (allViolations.length === 0) {
    const okMsg = `audit-on-mutation: PASS (${files.length} controller files scanned, 0 violations)\n`;
    process.stdout.write(okMsg);
    process.exit(0);
  }

  process.stderr.write(
    `audit-on-mutation: ${allViolations.length} violation(s) — every mutation handler must declare @AuditAction("foo.bar"), @AuditSkip(), or call this.audit.log(...) directly.\n\n`,
  );
  for (const v of allViolations) {
    const decoratorList =
      v.decorators.length > 0
        ? v.decorators.map((d) => `@${d}`).join(" ")
        : "(no decorators)";
    process.stderr.write(
      `  ${v.file}:${v.line}:${v.col}  method=${v.method}  decorators=${decoratorList}\n`,
    );
  }
  process.stderr.write(
    "\nFix: add @AuditAction(\"...\") for a canonical name, @AuditSkip() with a justifying comment for opt-out, or call this.audit.log({ ... }) directly.\n",
  );
  process.exit(1);
}

// Only run as CLI when invoked directly (`node tools/.../audit-on-mutation.js`).
// When `require()`'d by the sibling spec, exports are consumed instead.
if (require.main === module) {
  main();
}
