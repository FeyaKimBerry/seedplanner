/* ------------------------------------------------------------------ *
 * Save-status mapping — pure (flags in, {label, tone} out).
 *
 * Modeled on a video game's save icon: always visible, a coloured dot
 * plus a short label. The mapping is PRIORITY-ORDERED so the most serious
 * condition wins — a failed local write ("not even safe on this device")
 * outranks everything, then in-flight, then offline, then sync error,
 * then plain "unsaved", then "up to date".
 *
 * Keeping this as one pure function makes it trivially testable and keeps
 * the UI dumb. Labels live here; callers map `tone` to a colour.
 * ------------------------------------------------------------------ */

export const TONES = ["error", "pending", "muted", "ok"];

export function saveStatus(flags = {}) {
  const {
    deviceWriteFailed = false,
    writing = false,
    health = "ok", // "ok" | "offline" | "error"
    dirty = false,
  } = flags;

  if (deviceWriteFailed) return { label: "Not saved on this device", tone: "error" };
  if (writing) return { label: "Saving…", tone: "pending" };
  if (health === "offline") return { label: "Offline", tone: "muted" };
  if (health === "error") return { label: "Sync error", tone: "error" };
  if (dirty) return { label: "Unsaved changes", tone: "muted" };
  return { label: "Up to date", tone: "ok" };
}
