/* ------------------------------------------------------------------ *
 * Persistence layer — the single seam between the app and storage.
 *
 * All app code talks to `store.load()` / `store.save(state)` and nothing
 * else. This indirection is the whole design: a different backend can be
 * swapped in by replacing this module, and no feature code changes.
 *
 * Local-first: the device write always happens immediately and returns a
 * success boolean. Google Drive appDataFolder sync is a best-effort
 * follow-up for signed-in users (reconciliation lands in Phase 2 — see
 * ROADMAP.md; today the remote copy still overwrites local on load).
 * ------------------------------------------------------------------ */

import { isValidState } from "./validate.js";
import { createDeviceStorage } from "./storage.js";

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

async function driveSave(token, state) {
  try {
    const body = JSON.stringify(state);
    const id = await driveFileId(token);
    if (id) {
      await fetch("https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=media", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body,
      });
    } else {
      const meta = JSON.stringify({ name: DRIVE_FILE, parents: ["appDataFolder"] });
      const form = new FormData();
      form.append("metadata", new Blob([meta], { type: "application/json" }));
      form.append("file", new Blob([body], { type: "application/json" }));
      await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: form,
      });
    }
  } catch (e) {
    console.error("Drive save failed", e);
  }
}

export const store = {
  async load() {
    // Remote-first when signed in. NOTE (Phase 2): this still blindly trusts
    // the remote copy — reconciliation + remote validation are tracked in ROADMAP.md.
    try {
      if (_driveToken) {
        const remote = await driveLoad(_driveToken);
        if (remote) {
          device.set(STORE_KEY, JSON.stringify(remote));
          return remote;
        }
      }
    } catch { /* fall through to local */ }

    // Local path: parse + shape-validate. A corrupt or wrong-shape blob
    // degrades to a fresh start ("nothing") rather than a white screen.
    try {
      const raw = device.get(STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isValidState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  // Returns whether the device write actually landed. Cloud push is a
  // best-effort follow-up and never blocks or fails the local save.
  async save(state) {
    let ok = false;
    try {
      ok = device.set(STORE_KEY, JSON.stringify(state));
    } catch {
      ok = false;
    }
    if (ok) device.set(TS_KEY, new Date().toISOString());
    if (_driveToken) driveSave(_driveToken, state).catch(() => {});
    return ok;
  },
};
