import { describe, it, expect } from "vitest";
import { saveStatus } from "./saveStatus.js";

describe("saveStatus", () => {
  it("defaults to up-to-date when no flags are set", () => {
    expect(saveStatus()).toEqual({ label: "Up to date", tone: "ok" });
    expect(saveStatus({})).toEqual({ label: "Up to date", tone: "ok" });
  });

  it("reports unsaved changes when dirty", () => {
    expect(saveStatus({ dirty: true })).toEqual({ label: "Unsaved changes", tone: "muted" });
  });

  it("reports saving while a write is in flight", () => {
    expect(saveStatus({ writing: true }).tone).toBe("pending");
  });

  it("device write failure outranks everything else", () => {
    const s = saveStatus({ deviceWriteFailed: true, writing: true, dirty: true, health: "error" });
    expect(s).toEqual({ label: "Not saved on this device", tone: "error" });
  });

  it("in-flight write outranks offline, error and dirty", () => {
    expect(saveStatus({ writing: true, health: "offline", dirty: true }).label).toBe("Saving…");
  });

  it("offline outranks sync error and dirty", () => {
    expect(saveStatus({ health: "offline", dirty: true }).tone).toBe("muted");
    expect(saveStatus({ health: "offline", dirty: true }).label).toBe("Offline");
  });

  it("sync error outranks a plain dirty flag", () => {
    expect(saveStatus({ health: "error", dirty: true })).toEqual({ label: "Sync error", tone: "error" });
  });

  it("preserves the documented priority order end to end", () => {
    // Peel one top-priority flag off at a time; the next condition should surface.
    expect(saveStatus({ deviceWriteFailed: true }).label).toBe("Not saved on this device");
    expect(saveStatus({ writing: true }).label).toBe("Saving…");
    expect(saveStatus({ health: "offline" }).label).toBe("Offline");
    expect(saveStatus({ health: "error" }).label).toBe("Sync error");
    expect(saveStatus({ dirty: true }).label).toBe("Unsaved changes");
    expect(saveStatus({}).label).toBe("Up to date");
  });
});
