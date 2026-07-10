/* ------------------------------------------------------------------ *
 * Auth as derived state — pure, no side effects, fully testable.
 *
 * Three independent concepts, deliberately kept separate:
 *   - configured:    does a Google client ID exist at all?
 *   - intent:        what did the user choose — "sync" | "local" | "undecided"?
 *   - authenticated: do we hold a live token right NOW?
 *
 * The user-facing state is DERIVED from these. Untangling "opted in" from
 * "authenticated now" is exactly what lets the app show "reconnect" instead
 * of bouncing the user back to a first-time login wall.
 * ------------------------------------------------------------------ */

// One-way view state the UI renders from.
//   "front-door"      → show the sign-in / choose screen (intent undecided)
//   "local"           → in the app, local-only (no cloud push)
//   "syncing"         → in the app, cloud sync live
//   "needs-reconnect" → in the app, local-safe, with a reconnect prompt
export function authView({ configured, intent, authenticated }) {
  if (intent === "undecided") return "front-door";
  if (intent === "local") return "local";
  if (intent === "sync") {
    if (!configured) return "local";              // can't sync without config → act local
    return authenticated ? "syncing" : "needs-reconnect";
  }
  return "front-door";
}

// Migration from pre-intent users: when the explicit choice is missing (older
// installs), infer it from prior signals so nobody is bounced to the welcome
// screen after an update.
//   storedIntent  — the explicit "sync" | "local" record, if present
//   legacyAuth    — the old AUTH_KEY blob: a user object (had signed in) or { local: true }
//   hasLocalData  — is there real saved data on this device?
export function resolveIntent({ storedIntent, legacyAuth, hasLocalData }) {
  // An explicit record always wins — including "undecided", written on sign-out
  // to send the user back to the front door instead of silently re-entering local.
  if (storedIntent === "sync" || storedIntent === "local" || storedIntent === "undecided") return storedIntent;
  if (legacyAuth && legacyAuth.local === true) return "local";
  if (legacyAuth && (legacyAuth.email || legacyAuth.name || legacyAuth.picture)) return "sync";
  if (hasLocalData) return "local";              // existing user, no intent record → keep them in, local
  return "undecided";                            // brand-new → front door
}
