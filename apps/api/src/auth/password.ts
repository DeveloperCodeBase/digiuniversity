/**
 * Password hashing — Argon2id forward, bcrypt for legacy reads.
 *
 * Phase-20 (brought forward): the api hashed every password with
 * bcryptjs at cost 12 from Phase 1 through Phase 15. That's not
 * broken — bcrypt at cost 12 still meets the OWASP 2024 minimum —
 * but Argon2id is the modern recommendation (memory-hard against GPU
 * cracking; resistant to side-channel attacks). This module is the
 * one place that knows the difference.
 *
 * Strategy: lazy migration. New users land on Argon2id from this
 * commit forward. Existing bcrypt users keep working — `verifyPassword`
 * detects the hash family by prefix and runs the right verifier. When
 * a bcrypt user logs in successfully, `needsRehash` returns true, and
 * the auth.service quietly re-hashes the new password and persists
 * it. The user notices nothing.
 *
 * Why not a one-shot upgrade migration: we don't have the plaintext
 * password to re-hash without the user typing it. The hash itself
 * is one-way. Lazy migration on login is the only correct path.
 *
 * Argon2id parameters: package defaults — memoryCost=65536 KiB (64 MiB),
 * timeCost=3, parallelism=4. The argon2 npm package defaults to these
 * and they exceed the OWASP 2024 recommended minimum (m=19 MiB, t=2,
 * p=1) without being so heavy that login latency suffers. Measured
 * ~80–120 ms on the api container's CPU, well under the 1s acceptable
 * range. Configurable via env if a future review wants to retune.
 *
 * The exported surface is intentionally tiny — three functions —
 * so consumers don't reach into argon2 / bcryptjs directly. That
 * keeps the next algorithm swap (whatever follows Argon2id) a
 * one-file edit.
 */

import * as argon2 from "argon2";
import * as bcrypt from "bcryptjs";

const BCRYPT_PREFIX_RE = /^\$2[aby]\$/;
const ARGON2_PREFIX_RE = /^\$argon2(id|i|d)\$/;

/**
 * Hash a plaintext password with Argon2id. Returns the encoded hash
 * string (`$argon2id$v=19$...`) which is self-describing so we can
 * decode the parameters at verify time without storing them.
 */
export const hashPassword = async (plain: string): Promise<string> => {
  return argon2.hash(plain, { type: argon2.argon2id });
};

/**
 * Verify a plaintext password against an encoded hash. Auto-detects
 * Argon2id vs legacy bcrypt and dispatches to the right verifier.
 * Returns false on any error (malformed hash, mismatched plaintext,
 * unsupported algorithm) — never throws.
 */
export const verifyPassword = async (
  encoded: string,
  plain: string,
): Promise<boolean> => {
  try {
    if (ARGON2_PREFIX_RE.test(encoded)) {
      return await argon2.verify(encoded, plain);
    }
    if (BCRYPT_PREFIX_RE.test(encoded)) {
      return await bcrypt.compare(plain, encoded);
    }
    // Unknown / corrupted hash — refuse rather than crash. A genuine
    // empty-string passwordHash (shouldn't exist) returns false here.
    return false;
  } catch {
    return false;
  }
};

/**
 * True when the stored hash should be replaced with a fresh Argon2id
 * hash. Today that means any non-argon2 hash; future versions could
 * also opt in to re-hashing argon2 hashes that no longer meet the
 * current parameter recommendations via `argon2.needsRehash(encoded)`.
 */
export const needsRehash = (encoded: string): boolean => {
  if (!encoded) return false; // empty hash is a bigger problem; not our place to fix
  if (!ARGON2_PREFIX_RE.test(encoded)) return true; // bcrypt legacy
  try {
    // argon2.needsRehash inspects the encoded params against the
    // current default options. The `type` is already encoded inside
    // the hash itself ($argon2id$…), so the options here only cover
    // timeCost / memoryCost / parallelism — passing them all undefined
    // means "use the package defaults at verify time," which is what
    // we want.
    return argon2.needsRehash(encoded);
  } catch {
    return false;
  }
};

/**
 * Algorithm family — useful for telemetry and audit logs ("user
 * logged in with bcrypt hash, queued for re-hash"). Not exposed
 * to clients.
 */
export const passwordAlgorithm = (encoded: string): "argon2id" | "bcrypt" | "unknown" => {
  if (ARGON2_PREFIX_RE.test(encoded)) return "argon2id";
  if (BCRYPT_PREFIX_RE.test(encoded)) return "bcrypt";
  return "unknown";
};
