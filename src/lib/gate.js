/* ------------------------------------------------------------------ *
 * Purchase gate — a lightweight anti-casual-piracy check. Pure logic.
 *
 * NOT real security: the password ships in the client bundle and the
 * activation flag is just a local record a technical user could set by
 * hand. It stops casual copying and honest mistakes; it does NOT stop a
 * determined sharer. If you need real entitlement enforcement, swap this
 * for a server-side license check (see ROADMAP.md).
 *
 * Key lesson baked in here: normalize BOTH sides identically before
 * comparing, or cosmetic mismatches (a trailing space, lower case, an
 * extra #) turn into support tickets.
 * ------------------------------------------------------------------ */

// Strip whitespace and common separators, then upper-case. Applied to the
// stored valid codes AND the user's input, so formatting can't cause a miss.
export function normalizeCode(s) {
  return String(s == null ? "" : s).replace(/[\s\-_#.]/g, "").toUpperCase();
}

// Parse a comma-separated list of valid codes (env var), normalized. A blank
// env value falls back to `fallback`, so an old and a new code can both be
// accepted during a rotation window without a code change.
export function parseValidCodes(raw, fallback = "") {
  const src = raw && raw.trim() ? raw : fallback;
  return src
    .split(",")
    .map(normalizeCode)
    .filter(Boolean);
}

// Does the entered code match any valid code? Both sides already normalized.
export function matchesCode(input, validCodes) {
  const n = normalizeCode(input);
  return !!n && validCodes.includes(n);
}
