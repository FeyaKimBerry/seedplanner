/* ------------------------------------------------------------------ *
 * Persistence layer — the single seam between the app and storage.
 *
 * All app code talks to this module and nothing else. This indirection is
 * the whole design: a different backend can be swapped in by replacing
 * this file, and no feature code changes.
 *
 * Local-first:
 *   - saveLocal() writes the device immediately and returns success.
 *   - pushCloud() is a best-effort, debounced follow-up to Google Drive.
 *   - load() pulls both copies and reconciles them (last-write-wins with an
 *     empty-remote guard) so a stale or blank cloud file can never wipe a
 *     device that has real work on it.
 * ------------------------------------------------------------------ */

import { isValidState } from "./validate.js";
import { createDeviceStorage } from "./storage.js";
import { reconcile } from "./reconcile.js";

export const STORE_KEY = "horizon_finance_state_v1";
const DRIVE_FILE = "seedplanner-data.json";
const TS_KEY = "horizon_last_saved_v1";

const device = createDeviceStorage();

// False when we fell back to the in-memory adapter (private mode / storage
// disabled) — the app can tell the user it won't persist on this device.
export const storageIsPersistent = device.persistent;

// Generic key/value prefs backed by the same device adapter (active tab, etc.).
export const prefs = {
  get: (k) => device.get(k),
  set: (k, v) => device.set(k, v),
};

export function lastSavedAt() {
  return device.get(TS_KEY);
}

// Parse + shape-validate the local blob. A corrupt or wrong-shape blob
// degrades to null ("nothing") rather than crashing a view.
function readLocalState() {
  try {
    const raw = device.get(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* ---- Google Drive appDataFolder sync ---- */
// Token provider is injected by the app (auth.getToken): cached → silent
// refresh → throws NOT_AUTHENTICATED. store never touches GIS directly, which
// keeps this module decoupled and testable. null = local-only (no sync).
let _tokenProvider = null;
export function setTokenProvider(fn) { _tokenProvider = fn || null; }

async function currentToken() {
  if (!_tokenProvider) return null;
  try { return await _tokenProvider(); } catch { return null; }
}

async function driveFileId(token) {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=name%3D%27" + DRIVE_FILE + "%27",
    { headers: { Authorization: "Bearer " + token } }
  );
  const json = await res.json();
  return json.files?.[0]?.id || null;
}

async function driveLoad(token) {
  try {
    const id = await driveFileId(token);
    if (!id) return null;
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files/" + id + "?alt=media",
      { headers: { Authorization: "Bearer " + token } }
    );
    return await res.json();
  } catch {
    return null;
  }
}

// Returns { ok, status } so callers can drive retry / health flags and
// distinguish a dead token (401) from other failures.
async function driveSave(token, state) {
  try {
    const body = JSON.stringify(state);
    const id = await driveFileId(token);
    let res;
    if (id) {
      res = await fetch("https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=media", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body,
      });
    } else {
      const meta = JSON.stringify({ name: DRIVE_FILE, parents: ["appDataFolder"] });
      const form = new FormData();
      form.append("metadata", new Blob([meta], { type: "application/json" }));
      form.append("file", new Blob([body], { type: "application/json" }));
      res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: form,
      });
    }
    return { ok: !!(res && res.ok), status: res ? res.status : 0 };
  } catch (e) {
    console.error("Drive save failed", e);
    return { ok: false, status: 0 };
  }
}

export const store = {
  // Pull local + remote and reconcile. The winner is persisted locally so the
  // next boot starts from the merged copy. reconcile() validates the remote and
  // applies the empty-remote guard, so this can no longer wipe local data.
  async load() {
    const local = readLocalState();
    const token = await currentToken();
    if (token) {
      const remote = await driveLoad(token);
      const merged = reconcile(local, remote);
      if (merged && merged !== local) {
        device.set(STORE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
    return local;
  },

  isSyncing() { return !!_tokenProvider; },

  // Local write: instant, unconditional, returns whether it landed.
  saveLocal(state) {
    let ok = false;
    try {
      ok = device.set(STORE_KEY, JSON.stringify(state));
    } catch {
      ok = false;
    }
    if (ok) device.set(TS_KEY, new Date().toISOString());
    return ok;
  },

  // Best-effort cloud push. Reports { ok, health, reason } so a failed push can
  // keep the "unsaved" flag set (retry next cycle), tell offline from a real
  // error, and flag a dead token (reason "auth") so the app can prompt reconnect.
  async pushCloud(state) {
    if (!_tokenProvider) return { ok: true, health: "ok" };
    const token = await currentToken();
    if (!token) return { ok: false, health: "error", reason: "auth" }; // token acquisition failed
    const { ok, status } = await driveSave(token, state);
    if (ok) return { ok: true, health: "ok" };
    if (status === 401) return { ok: false, health: "error", reason: "auth" };
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    return { ok: false, health: offline ? "offline" : "error" };
  },
};
