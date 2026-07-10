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
let _driveToken = null;
export function setDriveToken(token) { _driveToken = token; }

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

// Returns whether the upload actually succeeded, so callers can drive
// retry / health flags instead of silently assuming success.
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
    return !!(res && res.ok);
  } catch (e) {
    console.error("Drive save failed", e);
    return false;
  }
}

export const store = {
  // Pull local + remote and reconcile. The winner is persisted locally so the
  // next boot starts from the merged copy. reconcile() validates the remote and
  // applies the empty-remote guard, so this can no longer wipe local data.
  async load() {
    const local = readLocalState();
    if (_driveToken) {
      const remote = await driveLoad(_driveToken);
      const merged = reconcile(local, remote);
      if (merged && merged !== local) {
        device.set(STORE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
    return local;
  },

  isSyncing() { return !!_driveToken; },

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

  // Best-effort cloud push. Reports { ok, health } so a failed push can keep
  // the "unsaved" flag set (retry next cycle) and distinguish offline vs error.
  async pushCloud(state) {
    if (!_driveToken) return { ok: true, health: "ok" };
    const ok = await driveSave(_driveToken, state);
    if (ok) return { ok: true, health: "ok" };
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    return { ok: false, health: offline ? "offline" : "error" };
  },
};
