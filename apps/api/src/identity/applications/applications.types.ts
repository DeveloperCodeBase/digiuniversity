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

import { randomBytes } from "node:crypto";

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

// =====================================================================
// Phase B R6 (D80) — public anon-applicant tracking-token helpers.
//
// The applicant has no User until ENROLLED (StudentApplication.userId is
// null SUBMITTED→ACCEPTED), so R3.b's authed /me + SelfOrAdmin withdraw
// cannot serve them. A high-entropy tracking token (minted in
// submitPublic) is the anon applicant's bearer capability to read status
// + withdraw on the public /track surface.
// =====================================================================

/**
 * Mint a 192-bit URL-safe tracking token. App-level (NOT a DB @default):
 * per D80 stop-trigger #6, no Prisma/Postgres default reaches the
 * >=128-bit hardening floor (uuid v4 = 122-bit; cuid is not crypto-
 * random). Mirrors generateSecurePassword() in
 * application-enrollment.service.ts.
 */
export function generateTrackingToken(): string {
  return randomBytes(24).toString("base64url"); // 24 bytes = 192 bits
}

/**
 * True iff `err` is a Prisma P2002 unique-constraint violation on the
 * trackingToken index — the signal to regenerate + retry the write.
 * (A 192-bit collision is astronomically unlikely; this is defense in
 * depth, D80.)
 */
export function isTrackingTokenCollision(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  if ((err as { code?: string }).code !== "P2002") return false;
  const target = (err as { meta?: { target?: unknown } }).meta?.target;
  const asString = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return asString.includes("trackingToken");
}

/**
 * Sentinel actor recorded on a token-driven (anon) withdraw. The audit
 * columns (decidedBy / updatedBy) are plain String? with no FK, so a
 * non-id sentinel is safe and makes the public-track origin explicit in
 * the trail (vs an admin or authed-self withdraw).
 */
export const PUBLIC_TRACK_ACTOR = "public:track-token";

/**
 * Whether the applicant may withdraw from this status. True for the 4
 * non-terminal states (WITHDRAWN is a legal target); false for the
 * terminals ENROLLED / REJECTED / WITHDRAWN. Drives the /track withdraw
 * button + the masked view's `canWithdraw`.
 */
export function canApplicantWithdraw(status: AppStatus): boolean {
  return status !== "WITHDRAWN" && isLegalTransition(status, "WITHDRAWN");
}

/**
 * Human-friendly public reference derived from the application id — NOT
 * the raw cuid (internal ids are never exposed on the public /track
 * surface). Mirrors the STU-/INS- code shape (last 6, uppercased).
 */
export function deriveApplicationReference(id: string): string {
  return `APP-${id.slice(-6).toUpperCase()}`;
}

/** Partially mask an email for the public view: keep 1-2 local chars +
 *  the full domain. e.g. `ma***@gmail.com`. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${local.length > head.length ? "***" : ""}@${domain}`;
}

/** Partially mask a phone for the public view: last 4 digits only.
 *  e.g. `***6789`. Returns null for empty input. */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length <= 4) return "****";
  return `***${digits.slice(-4)}`;
}

/**
 * The PII-masked, internal-id-free view returned by the public /track
 * endpoint (D80 PII-mask: nationalId omitted entirely; raw ids dropped;
 * email + phone masked). The submitter's confirmation page gets the full
 * row from submitPublic — this masked shape is only for the bearer-token
 * read, where the token is the sole credential.
 */
export interface PublicApplicationView {
  reference: string;
  type: "student" | "instructor";
  status: AppStatus;
  submittedAt: Date;
  decidedAt: Date | null;
  applicantFullName: string;
  applicantEmailMasked: string;
  applicantPhoneMasked: string | null;
  programName: string | null; // student variant
  departmentName: string | null; // instructor variant
  canWithdraw: boolean;
}

/**
 * Build a PublicApplicationView from a row's already-selected fields.
 * Centralizes masking + reference derivation so both services emit an
 * identical shape.
 */
export function buildPublicApplicationView(input: {
  id: string;
  type: "student" | "instructor";
  status: AppStatus;
  submittedAt: Date;
  decidedAt: Date | null;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  programName?: string | null;
  departmentName?: string | null;
}): PublicApplicationView {
  return {
    reference: deriveApplicationReference(input.id),
    type: input.type,
    status: input.status,
    submittedAt: input.submittedAt,
    decidedAt: input.decidedAt,
    applicantFullName: input.applicantFullName,
    applicantEmailMasked: maskEmail(input.applicantEmail),
    applicantPhoneMasked: maskPhone(input.applicantPhone),
    programName: input.programName ?? null,
    departmentName: input.departmentName ?? null,
    canWithdraw: canApplicantWithdraw(input.status),
  };
}
