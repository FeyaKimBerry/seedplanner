# Seedplanner — Persistence & Sync Roadmap

Porting the local-first storage / cloud-sync / auth / purchase-gate patterns from the
reference project into Seedplanner. Today the app has the *skeleton* (a `store` adapter
seam, Google Drive `appDataFolder` REST calls, a basic GIS token flow) but is missing
most of the *robustness layer*. This doc tracks that work.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Decisions (settled)

- [x] **Module split** — pull the pure logic (`store`, `reconcile`, validator, status-label
      mapper) out of the ~3500-line `App.jsx` into small testable modules under `src/lib/`.
      Matches the "separate pure logic from framework" principle.
- [x] **Test runner: Vitest** — pure functions get unit tests that land with the code.
      Add `vitest` as a dev dependency and a `test` script.

---

## Phase 1 — Harden local storage
Foundation everything else leans on. Independently shippable.

- [ ] Capability probe at startup + in-memory adapter fallback (private mode / quota / disabled)
- [ ] `save()` returns a success boolean; failed writes surfaced, never swallowed
- [ ] Shape validator at the load boundary (non-array object; list fields are arrays;
      numeric fields are numbers) — reject wrong-shape blobs that still parse as JSON
- [ ] Save-status indicator (independent boolean flags) + one pure `flags → {label, tone}` function
- [ ] Persist active tab/route across reload
- [ ] Store & surface a "last saved at" timestamp

**Done when:** validator rejects a wrong-shape blob, private-mode falls back to in-memory
without crashing, the status dot reflects real save state — all covered by tests.

---

## Phase 2 — Fix sync data-loss + reconciliation
⚠️ **Contains an active bug, not just missing features.** Today on load the remote Drive
copy *blindly overwrites* local (`App.jsx` ~L661–665). A stale or empty cloud file can
silently wipe a device that has real work on it.

- [ ] Pure `reconcile(local, remote)`: newer `updatedAt` wins → tie-break on `revision`
- [ ] **Empty-remote guard**: real local data always beats a blank/empty remote, regardless of timestamps
- [ ] Stamp every edit with `updatedAt` + incrementing `revision` (at edit time, not save time)
- [ ] Validate the remote pull through the same Phase 1 validator; bad pull ⇒ keep last-good local
- [ ] Split debounce: local write instant/unconditional, cloud push debounced (~2.5s)
- [ ] Retry semantics via flags; health = `offline` vs `error` from the online/offline signal

**Done when:** reconcile is unit-tested (newer-wins, tie-break, empty-guard), and a blank
remote can no longer clobber a populated device.

---

## Phase 3 — Auth lifecycle
Turn the one-shot token flow into a real session lifecycle.

- [ ] Silent boot refresh (`prompt: ''`) that returns null on a lapsed session instead of throwing
- [ ] Token caching with early (~60s) expiry
- [ ] Callback→promise bridge; layered token acquisition (cached → silent → recoverable "not authed" error)
- [ ] 401 handling: drop the dead token but keep the "opted-in to sync" intent
- [ ] Clean sign-out that **revokes** the token with Google (not just local delete)
- [ ] Derive user-facing state from `configured × opted-in × authenticated-now`
      (front door / local / syncing / needs-reconnect) via one pure function
- [ ] Migrate pre-intent users (infer intent from prior signals) so nobody is bounced to the welcome screen
- [ ] Silent-restore splash + dismissible reconnect banner (degrade to local-safe, never lock out)

**Done when:** a lapsed session shows "reconnect" (not "log in again"), sign-out revokes
server-side, and the derived state function is unit-tested.

---

## Phase 4 — Purchase gate
Fully independent — can slot in anytime. Anti-casual-piracy only, **not real auth**.

- [ ] Env-var-driven shared password(s), comma-separated for rotation windows; hardcoded default only if unset
- [ ] Input normalization applied identically to stored values and user input
- [ ] One-time local activation flag (works fully offline thereafter), read/write wrapped in try/catch
- [ ] Forgiving input UX (autofocus, force-uppercase, guiding "check the PDF" copy, "once per device" reassurance)

**Done when:** a correctly-normalized password activates once and the gate never reappears
on that device, including offline.

---

## Cross-cutting principles (apply in every phase)
- One-method-pair `load`/`save` adapter stays the only seam between app and persistence.
- Pure logic (reconcile, state machine, status-label mapping) lives in its own module, testable with zero UI.
- Validate at every trust boundary — local load, cloud pull, backup import.
- Local-first: the device write is the source of truth; the network is best-effort and allowed to fail without data loss.
