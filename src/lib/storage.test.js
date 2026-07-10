import { describe, it, expect } from "vitest";
import { createDeviceStorage } from "./storage.js";

// A minimal in-object localStorage stand-in for the "healthy" case.
function fakeBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

// A backend that throws on write — private mode / storage disabled / quota.
const throwingBackend = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
  removeItem: () => { throw new Error("blocked"); },
};

describe("createDeviceStorage", () => {
  it("uses a persistent adapter when the backend works", () => {
    const s = createDeviceStorage(fakeBackend());
    expect(s.persistent).toBe(true);
    expect(s.set("k", "v")).toBe(true);
    expect(s.get("k")).toBe("v");
    s.remove("k");
    expect(s.get("k")).toBe(null);
  });

  it("falls back to in-memory when the capability probe throws", () => {
    const s = createDeviceStorage(throwingBackend);
    expect(s.persistent).toBe(false);
    // still fully usable for the session
    expect(s.set("k", "v")).toBe(true);
    expect(s.get("k")).toBe("v");
  });

  it("falls back to in-memory when there is no backend at all", () => {
    const s = createDeviceStorage(null);
    expect(s.persistent).toBe(false);
    expect(s.set("k", "v")).toBe(true);
    expect(s.get("k")).toBe("v");
  });

  it("returns false from set when a write is rejected after the probe passes", () => {
    // Probe passes, but a later setItem throws (e.g. quota exceeded mid-session).
    let allow = true;
    const flaky = {
      getItem: () => null,
      setItem: (k, v) => { if (!allow) throw new Error("quota"); },
      removeItem: () => {},
    };
    const s = createDeviceStorage(flaky);
    expect(s.persistent).toBe(true);
    allow = false;
    expect(s.set("k", "v")).toBe(false);
  });

  it("get returns null instead of throwing on a read error", () => {
    let allow = true;
    const flaky = {
      getItem: () => { if (!allow) throw new Error("boom"); return null; },
      setItem: () => {},
      removeItem: () => {},
    };
    const s = createDeviceStorage(flaky);
    allow = false;
    expect(s.get("k")).toBe(null);
  });
});
