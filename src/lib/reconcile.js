/* ------------------------------------------------------------------ *
 * Cross-device reconciliation — pure, deterministic, side-effect-free.
 *
 * When a device boots (or reconnects) it has a local copy and a remote
 * copy. reconcile() merges them by a fixed set of rules:
 *
 *   1. Validate both. A copy that fails the shape check is treated as
 *      "nothing" — a garbage remote never overwrites good local data.
 *   2. If only one side is valid, that side wins.
 *   3. Empty-remote guard: a remote with no meaningful user data never
 *      clobbers a local copy that has real work on it, regardless of
 *      timestamps. ("Newest wins" needs an escape hatch so a fresh/blank
 *      cloud file can't wipe a populated device.)
 *   4. Last-write-wins: newer `meta.updatedAt` wins; on a tie, the higher
 *      `meta.revision` wins; on a full tie, local is kept (no-op).
 *
 * Stamps are set at EDIT time (see App.jsx bumpMeta), so they reflect when
 * the user actually changed something, not when a save happened to fire.
 * ------------------------------------------------------------------ */

import { isValidState } from "./validate.js";

const LIST_FIELDS = ["income", "expenses", "plans", "debts", "assets", "oneOffs", "goals"];

// Does this state hold meaningful user data? Drives the empty-remote guard.
export function hasRealData(s) {
  if (!s) return false;
  if (LIST_FIELDS.some((k) => Array.isArray(s[k]) && s[k].length > 0)) return true;
  if (s.settings && Number(s.settings.startingSavings) > 0) return true;
  if (s.emergency && (Number(s.emergency.current) > 0 || Number(s.emergency.target) > 0)) return true;
  return false;
}

function stampOf(s) {
  const parsed = s && s.meta && s.meta.updatedAt ? Date.parse(s.meta.updatedAt) : NaN;
  return {
    t: Number.isNaN(parsed) ? 0 : parsed,
    rev: (s && s.meta && Number(s.meta.revision)) || 0,
  };
}

export function reconcile(local, remote) {
  const L = isValidState(local) ? local : null;
  const R = isValidState(remote) ? remote : null;

  if (!R) return L;          // no/garbage remote → keep whatever local we have
  if (!L) return R;          // no local → take remote

  // Empty-remote guard: real local work always beats a blank remote.
  if (!hasRealData(R) && hasRealData(L)) return L;

  const ls = stampOf(L);
  const rs = stampOf(R);
  if (rs.t > ls.t) return R;
  if (rs.t < ls.t) return L;
  return rs.rev > ls.rev ? R : L; // timestamp tie → higher revision; else keep local
}
