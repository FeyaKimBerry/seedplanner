/* ------------------------------------------------------------------ *
 * Shape validation at the load boundary.
 *
 * JSON-valid is NOT the same as safe-to-use: a blob can parse cleanly
 * yet have the wrong shape (an array where an object is expected, a
 * string where a number is expected) and poison state or crash a view.
 *
 * isValidState rejects wrong-shape blobs while staying forward-compatible:
 * MISSING fields are always allowed (additive schema growth is backfilled
 * from defaults at hydration), only fields that ARE present are checked.
 * Pure — no side effects, trivially unit-testable.
 * ------------------------------------------------------------------ */

export function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

// Fields the app iterates over as lists (incl. legacy oneOffs/goals, which
// migrate into `plans` at load — they must still validate as arrays).
const LIST_FIELDS = ["income", "expenses", "plans", "debts", "assets", "oneOffs", "goals"];

// Settings fields compared numerically. retirementTarget is intentionally
// excluded: it is null (= auto) or a number, handled by the null guard below.
const NUMBER_SETTINGS = [
  "startingSavings", "projectionYears",
  "returnConservative", "returnExpected", "returnOptimistic",
  "inflationRate", "retireMultiple",
];

export function isValidState(s) {
  if (!isPlainObject(s)) return false;

  for (const f of LIST_FIELDS) {
    if (f in s && !Array.isArray(s[f])) return false;
  }

  if ("settings" in s) {
    if (!isPlainObject(s.settings)) return false;
    for (const f of NUMBER_SETTINGS) {
      const v = s.settings[f];
      if (v != null && typeof v !== "number") return false;
    }
  }

  if ("emergency" in s && !isPlainObject(s.emergency)) return false;

  return true;
}
