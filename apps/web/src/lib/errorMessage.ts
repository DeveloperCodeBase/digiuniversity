// Phase B R-CI (D85) — shared error-message extractor.
//
// Replaces the repeated inline ternary
//   `err instanceof ApiError ? err.displayMessage : err.message`
// which tripped TS18046 ('err' is of type 'unknown') on the `err.message`
// else-branch under `useUnknownInCatchVariables`. The catch param stays
// `unknown` and is narrowed here — NO `any` (R-CI anti-patchwork rule).
//
// Behaviour is a safe superset of the old ternary: ApiError → its
// displayMessage (falling back if absent, instead of returning undefined);
// any other Error → its message; anything else → the fallback string.
import { ApiError } from "../api/client.js";

export function errorMessage(err: unknown, fallback = "خطای ناشناخته"): string {
  if (err instanceof ApiError) {
    const m = (err as { displayMessage?: string }).displayMessage;
    if (m) return m;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
