# Seedplanner — Persistence & Sync Roadmap

Porting the local-first storage / cloud-sync / auth / purchase-gate patterns from the
reference project into Seedplanner. This doc tracks that work.

**All four phases complete.** The robustness layer now lives in pure, unit-tested modules
under `src/lib/` (storage, validate, saveStatus, reconcile, authState, auth, gate), with
54 Vitest cases. Remaining manual check: the interactive Google sign-in popup + a real
Drive push need live OAuth in a normal browser (the preview blocks popups).

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Decisions (settled)

- [x] **Module split** — pull the pure logic (`store`, `reconcile`, validator, status-label
      mapper) out of the ~3500-line `App.jsx` into small testable modules under `src/lib/`.
      Matches the "separate pure logic from framework" principle.
- [x] **Test runner: Vitest** — pure functions get unit tests that land with the code.
      Add `vitest` as a dev dependency and a `test` script.

---

## Phase 1 — Harden local storage ✅
Foundation everything else leans on. Independently shippable. Pure logic in `src/lib/`,
covered by 23 Vitest cases; wiring verified in the browser preview.

- [x] Capability probe at startup + in-memory adapter fallback (private mode / quota / disabled) — `src/lib/storage.js`
- [x] `save()` returns a success boolean; failed writes surfaced, never swallowed — `src/lib/store.js`
- [x] Shape validator at the load boundary (non-array object; list fields are arrays;
      numeric fields are numbers) — reject wrong-shape blobs that still parse as JSON — `src/lib/validate.js`
- [x] Save-status indicator (independent boolean flags) + one pure `flags → {label, tone}` function — `src/lib/saveStatus.js` + `SaveStatus` in `App.jsx`
- [x] Persist active tab/route across reload — `prefs` + `TAB_KEY`
- [x] Store & surface a "last saved at" timestamp — `lastSavedAt()`, shown in the indicator tooltip

**Done when:** validator rejects a wrong-shape blob, private-mode falls back to in-memory
without crashing, the status dot reflects real save state — all covered by tests. ✅
Verified: a JSON-valid wrong-shape blob degrades to a fresh start (no white screen),
tab restores after reload, indicator shows "Up to date" with a real save timestamp.

---

## Phase 2 — Fix sync data-loss + reconciliation ✅
⚠️ **Was an active bug, now fixed.** Previously on load the remote Drive copy *blindly
overwrote* local. `store.load()` now reconciles instead, so a stale or empty cloud file
can no longer wipe a device that has real work on it.

- [x] Pure `reconcile(local, remote)`: newer `updatedAt` wins → tie-break on `revision` — `src/lib/reconcile.js`
- [x] **Empty-remote guard**: real local data always beats a blank/empty remote, regardless of timestamps — `hasRealData()`
- [x] Stamp every edit with `updatedAt` + incrementing `revision` (at edit time, not save time) — `bumpMeta` in `App.jsx`
- [x] Validate the remote pull through the same Phase 1 validator; bad pull ⇒ keep last-good local — `reconcile` calls `isValidState`; backup import validated too
- [x] Split debounce: local write instant/unconditional, cloud push debounced (~2.5s) — `saveLocal` + `pushCloud`
- [x] Retry semantics via flags; health = `offline` vs `error` from the online/offline signal — `pushCloud` returns `{ ok, health }`, failed push keeps `dirty`

**Done when:** reconcile is unit-tested (newer-wins, tie-break, empty-guard), and a blank
remote can no longer clobber a populated device. ✅ 11 reconcile tests pass; edit-stamping
verified in the browser (revision monotonic 0→1→2, `updatedAt` set on each edit).
Note: the live Drive reconcile path needs a real Google token to exercise end-to-end;
the merge logic itself is pure and fully unit-tested.

---

## Phase 3 — Auth lifecycle ✅
Turned the one-shot token flow into a real session lifecycle. GIS wrapper in
`src/lib/auth.js`; pure derived-state machine in `src/lib/authState.js` (11 tests).

- [x] Silent boot refresh (`prompt: ''`) that returns null on a lapsed session instead of throwing — `silentToken()` (fail-soft, 3.5s timeout, `error_callback` wired)
- [x] Token caching with early (~60s) expiry — `EXPIRY_SKEW_MS`, `cachedToken()`
- [x] Callback→promise bridge; layered token acquisition (cached → silent → recoverable "not authed" error) — `requestToken` / `getToken()`
- [x] 401 handling: drop the dead token but keep the "opted-in to sync" intent — `pushCloud` returns `reason: "auth"`; app clears token, keeps intent, flips to needs-reconnect
- [x] Clean sign-out that **revokes** the token with Google (not just local delete) — `auth.revoke()`
- [x] Derive user-facing state from `configured × opted-in × authenticated-now` via one pure function — `authView()`
- [x] Migrate pre-intent users (infer intent from prior signals) so nobody is bounced to the welcome screen — `resolveIntent()`
- [x] Silent-restore splash + dismissible reconnect banner (degrade to local-safe, never lock out)

**Done when:** a lapsed session shows "reconnect" (not "log in again"), sign-out revokes
server-side, and the derived state function is unit-tested. ✅ Verified in the browser:
legacy `{local:true}` migrates to local; sign-out → front door (intent "undecided");
continue-local → intent "local"; a `sync` intent with no live session fails soft to the
needs-reconnect banner over a fully-usable local-safe app (dismiss works).
Note: the interactive Google sign-in popup + real token push need live OAuth to exercise
end-to-end (the preview browser blocks popups); the pure state logic is unit-tested.

---

## Phase 4 — Purchase gate ✅
Fully independent. Anti-casual-piracy only, **not real auth** (the password ships in the
bundle; the activation flag is a local record a technical user could set by hand — if you
need real entitlement, swap for a server-side license check). Pure logic in `src/lib/gate.js`.

- [x] Env-var-driven shared password(s), comma-separated for rotation windows; hardcoded default only if unset — `VITE_ACCESS_CODES`, `parseValidCodes()`, default `SEEDPLANNER`
- [x] Input normalization applied identically to stored values and user input — `normalizeCode()` (both sides)
- [x] One-time local activation flag (works fully offline thereafter), read/write wrapped in try/catch — `ACTIVATED_KEY`, `isActivated()` / `markActivated()`
- [x] Forgiving input UX (autofocus, force-uppercase, guiding "check the PDF" copy, "once per device" reassurance) — `ActivationGate`

**Done when:** a correctly-normalized password activates once and the gate never reappears
on that device, including offline. ✅ Verified in the browser: a wrong code shows the
guiding error and stays gated; a messy correct code ("seed planner") normalizes and
unlocks; the flag persists across reload (no re-prompt). 9 gate tests pass (54 total).

---

## Post-launch refinement — reconnect UX (stop the nagging)
Follow-up after real-world use: on the deployed site the reconnect banner appeared
constantly because (a) the initial boot/hydration triggered a cloud push that failed,
and (b) every failed push re-armed the dismissed banner. Fixed:

- [x] Boot/hydration never pushes to the cloud — only a real edit (revision bump) does.
      A signed-in user whose silent refresh fails no longer gets a banner on load.
- [x] Banner surfaces only on a genuine sync failure (`syncStuck`, set when an actual
      push can't authenticate), not merely because a silent refresh failed.
- [x] Dismiss sticks: a dismissed banner stays gone through repeated failures; it only
      re-arms after a successful reconnect/push.
- [x] Auto-recover: a background push that silently gets a fresh token clears the banner
      and the sync-error status on its own.
- [x] "Use this device only" escape hatch in the banner — one tap switches to local mode
      (leaves the cloud file untouched, so switching back stays lossless) and clears the
      lingering sync-error status.

Verified in the browser against the deployed-site scenario (silent refresh blocked):
no banner on boot; banner only after an edit-triggered push failure; dismiss persists;
switching to local clears everything.

## Cross-cutting principles (apply in every phase)
- One-method-pair `load`/`save` adapter stays the only seam between app and persistence.
- Pure logic (reconcile, state machine, status-label mapping) lives in its own module, testable with zero UI.
- Validate at every trust boundary — local load, cloud pull, backup import.
- Local-first: the device write is the source of truth; the network is best-effort and allowed to fail without data loss.
