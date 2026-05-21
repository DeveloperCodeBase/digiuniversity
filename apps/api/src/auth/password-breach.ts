/**
 * HIBP (Have I Been Pwned) password-breach check using the k-anonymity
 * Pwned Passwords API. This is the OWASP-recommended way to reject
 * known-compromised passwords without ever sending the plaintext or
 * the full hash off the box.
 *
 * Phase-20 (brought forward).
 *
 * Protocol summary (https://haveibeenpwned.com/API/v3#PwnedPasswords):
 *   1. SHA-1 the plaintext.
 *   2. Send the first 5 hex chars of the hash to
 *      `https://api.pwnedpasswords.com/range/<prefix>`.
 *   3. The response lists every breached hash starting with that
 *      prefix, one per line, with a count of occurrences. Search the
 *      list locally for our SHA-1's suffix.
 *
 * The server only ever sees a 5-char prefix that matches ~500 hashes
 * on average — there's no way for HIBP to learn which password (or
 * which user) we were checking. SHA-1 is fine for k-anonymity even
 * though it's broken as a cryptographic hash, because the property
 * we rely on is "many candidates share a 5-char prefix," not
 * collision resistance.
 *
 * Fail-open by design: if the HIBP API is unreachable, times out, or
 * returns garbage, we let the password through. Better to allow a
 * potentially-leaked password than to lock honest users out of
 * registration because of a network blip. The trade-off is
 * documented; flip `HIBP_CHECK_ENABLED=false` in .env to disable the
 * check entirely if a future review wants to require strict mode.
 *
 * Cache: a tiny in-memory LRU caches the prefix→list mapping for the
 * lifetime of the process so back-to-back registrations of similar
 * passwords (e.g. during a typo-recovery flow) don't hammer HIBP.
 * Plaintext is never cached or logged.
 */

import { BadRequestException } from "@nestjs/common";
import { createHash } from "node:crypto";

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";

// Per-process cache, max 64 prefix lists (~4 KiB each upper-bound).
// Eviction is "first-in-first-out via Map insertion order" — JS Maps
// preserve insertion order, so .keys().next().value is the oldest.
const prefixCache = new Map<string, string>();
const CACHE_MAX = 64;

/** Check a plaintext password against HIBP's Pwned Passwords API. */
export const checkPwnedPassword = async (
  plain: string,
): Promise<{ pwned: boolean; count: number }> => {
  if (!plain) return { pwned: false, count: 0 };

  const sha1 = createHash("sha1").update(plain).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  let payload: string | undefined = prefixCache.get(prefix);
  if (payload === undefined) {
    const fetched = await fetchPrefix(prefix);
    if (fetched === null) {
      // Network failure → fail open.
      return { pwned: false, count: 0 };
    }
    payload = fetched;
    if (prefixCache.size >= CACHE_MAX) {
      const oldest = prefixCache.keys().next().value;
      if (oldest !== undefined) prefixCache.delete(oldest);
    }
    prefixCache.set(prefix, payload);
  }

  // Each line: "<suffix>:<count>". The full hash returned is just
  // the suffix, so we compare directly.
  for (const line of payload.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const sep = trimmed.indexOf(":");
    if (sep < 0) continue;
    const hashSuffix = trimmed.slice(0, sep);
    const countStr = trimmed.slice(sep + 1);
    if (hashSuffix === suffix) {
      const count = Number.parseInt(countStr, 10);
      return { pwned: true, count: Number.isFinite(count) ? count : 1 };
    }
  }
  return { pwned: false, count: 0 };
};

/**
 * Convenience wrapper: throws `BadRequestException` if the password
 * is on HIBP and `HIBP_CHECK_ENABLED` is not "false". Use this from
 * register + change-password handlers — they get a clean 400 with a
 * Persian-friendly message body when the policy denies.
 *
 * Fail-open: an HIBP outage means rejectPwnedPassword silently
 * succeeds, never blocks registration. The risk of a leaked password
 * sneaking through during an HIBP outage is lower than the risk of
 * the entire registration flow breaking when HIBP is down.
 */
export const rejectPwnedPassword = async (plain: string): Promise<void> => {
  if (process.env.HIBP_CHECK_ENABLED === "false") return;
  const result = await checkPwnedPassword(plain);
  if (result.pwned) {
    throw new BadRequestException(
      // English first then Persian — the global ValidationPipe surfaces
      // `message` to clients. The web side maps the substring "breach"
      // to a localised UI hint without touching the api wording.
      `password has appeared in a known data breach (${result.count} times). Please choose another. این رمز عبور در یک نشت داده‌ی شناخته‌شده دیده شده — لطفاً رمز دیگری انتخاب کنید.`,
    );
  }
};

const fetchPrefix = async (prefix: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(HIBP_RANGE_URL + prefix, {
      method: "GET",
      headers: {
        // "Add-Padding" tells HIBP to pad the response with random
        // hashes so the response size doesn't leak how many real
        // breaches share this prefix. Cheap defense-in-depth on top
        // of k-anonymity.
        "Add-Padding": "true",
        "User-Agent": "digiuniversity-api/1.0 (+hibp-check)",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    // AbortError (timeout), TypeError (network), TLS errors — all
    // fail-open. The caller treats null as "we couldn't verify."
    return null;
  } finally {
    clearTimeout(timeout);
  }
};
