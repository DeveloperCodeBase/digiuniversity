// Phase-16 R3 — shared axe-core setup for primitive a11y tests.
//
// `jest-axe` is the canonical wrapper that turns axe-core's promise-
// based engine into a Jest/Vitest matcher (`toHaveNoViolations()`).
// We configure it once here so each primitive test imports the
// pre-configured `axe` instance + matcher extension.
//
// WCAG 2.2 AA tags: any violation flagged at this level fails the
// test. Best-practice rules are exclusive — we don't fail on them
// (e.g. "landmark-one-main" doesn't apply to a single-primitive
// render in isolation).
import { configureAxe, toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);

export const axe = configureAxe({
  rules: {
    // The standalone render in tests doesn't include a <main> landmark
    // because the primitive is rendered without page chrome. Disable.
    "region": { enabled: false },
    "landmark-one-main": { enabled: false },
    "page-has-heading-one": { enabled: false },
  },
});
