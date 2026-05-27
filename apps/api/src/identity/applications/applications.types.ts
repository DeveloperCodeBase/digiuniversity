// apps/api/src/identity/applications/applications.types.ts
//
// Phase B R3.b Commit B (D71) — shared AppStatus state-machine constants
// for both StudentApplication + InstructorApplication.
//
// Both application types use the SAME enum + SAME transition graph
// per Q1.a; they differ ONLY in the ACCEPTED → ENROLLED side effect
// (Commit D — Student creates Student+Enrollment; Instructor creates
// Instructor + grants role).
//
// Per R2 precedent (course-offerings.service.ts ALLOWED_TRANSITIONS):
// illegal transitions reject with 400 + «Allowed from X: [list]».
// Verification gate (UNDER_REVIEW → forward) per Q4.a caveat lands
// in Commit C as a separate service-layer guard.

import type { AppStatus } from "@prisma/client";

/**
 * Allowed status transitions per Q1.a state machine (D71).
 *
 * Happy path: SUBMITTED → UNDER_REVIEW → INTERVIEW → ACCEPTED → ENROLLED
 * Any pre-terminal state can move to WITHDRAWN (applicant exit, per Q7.a).
 * UNDER_REVIEW + INTERVIEW + ACCEPTED can move to REJECTED (admin exit).
 *
 * Verification gate (Q4.a caveat, Commit C): any FORWARD move from
 * UNDER_REVIEW (→ INTERVIEW / ACCEPTED / REJECTED) requires both
 * applicantEmailVerifiedAt + applicantPhoneVerifiedAt set. WITHDRAWN
 * from UNDER_REVIEW is allowed without verification (applicant exit).
 *
 * Side effect (Commit D): ACCEPTED → ENROLLED triggers transactional
 * find-or-create-or-link per Q5.a (Student) or Q6.a (Instructor).
 * Until Commit D ships, transitioning to ENROLLED throws a
 * NotImplementedException so admin smoke can't trip a half-built path.
 */
export const ALLOWED_TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  SUBMITTED:    ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  INTERVIEW:    ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED:     ["ENROLLED", "WITHDRAWN"],
  ENROLLED:     [],
  REJECTED:     [],
  WITHDRAWN:    [],
};

/**
 * Returns true if the requested transition is permitted by the state
 * machine. Same-state transitions return true (idempotent — caller can
 * decide whether to no-op or short-circuit).
 */
export function isLegalTransition(from: AppStatus, to: AppStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Build the illegal-transition error message in the canonical R2 format.
 * Centralized here so both controllers throw identical strings.
 */
export function illegalTransitionMessage(from: AppStatus, to: AppStatus): string {
  const next = ALLOWED_TRANSITIONS[from];
  return `illegal transition: ${from} → ${to}. Allowed from ${from}: [${
    next.length === 0 ? "(none — terminal)" : next.join(", ")
  }]`;
}

/**
 * Forward (non-WITHDRAWN) transitions exiting UNDER_REVIEW. The Q4.a
 * caveat verification gate (Commit C) MUST be checked only for these
 * targets — WITHDRAWN from UNDER_REVIEW is allowed unconditionally so
 * applicants can exit without ever verifying contact.
 */
export const UNDER_REVIEW_FORWARD_TARGETS: ReadonlyArray<AppStatus> = [
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
];

/**
 * Q4.a caveat enforcement — verification gate (Commit C).
 *
 * Any forward transition FROM UNDER_REVIEW requires BOTH
 * applicantEmailVerifiedAt AND applicantPhoneVerifiedAt to be set.
 *
 * Returns a precise list of missing channels so the caller can
 * compose a single 400 message naming exactly what the admin needs
 * to fix. Empty array = both verified (gate passes).
 *
 * Callers should only invoke this when the (from, to) pair is in
 * UNDER_REVIEW × UNDER_REVIEW_FORWARD_TARGETS — WITHDRAWN exits and
 * non-UNDER_REVIEW sources are excluded by the caller's earlier
 * branch in the transition method.
 */
export function verificationGateMissing(app: {
  applicantEmailVerifiedAt: Date | null;
  applicantPhoneVerifiedAt: Date | null;
}): string[] {
  const missing: string[] = [];
  if (!app.applicantEmailVerifiedAt) missing.push("email");
  if (!app.applicantPhoneVerifiedAt) missing.push("phone");
  return missing;
}

/**
 * Compose the Q4.a verification-gate rejection message. Format mirrors
 * R2's illegalTransitionMessage so admin smoke can match on a single
 * substring ("not verified (Q4.a caveat)") across both error types.
 */
export function verificationGateMessage(missing: string[]): string {
  return `cannot advance application past UNDER_REVIEW: applicant ${missing.join(" + ")} not verified (Q4.a caveat)`;
}
