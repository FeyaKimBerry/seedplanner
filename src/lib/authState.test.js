import { describe, it, expect } from "vitest";
import { authView, resolveIntent } from "./authState.js";

describe("authView", () => {
  it("shows the front door when intent is undecided", () => {
    expect(authView({ configured: true, intent: "undecided", authenticated: false })).toBe("front-door");
    expect(authView({ configured: false, intent: "undecided", authenticated: false })).toBe("front-door");
  });

  it("is local when the user chose local, regardless of auth/config", () => {
    expect(authView({ configured: true, intent: "local", authenticated: true })).toBe("local");
    expect(authView({ configured: false, intent: "local", authenticated: false })).toBe("local");
  });

  it("is syncing when opted into sync, configured and authenticated", () => {
    expect(authView({ configured: true, intent: "sync", authenticated: true })).toBe("syncing");
  });

  it("is needs-reconnect when opted into sync but not authenticated (session lapsed)", () => {
    expect(authView({ configured: true, intent: "sync", authenticated: false })).toBe("needs-reconnect");
  });

  it("degrades a sync intent to local when the integration is not configured", () => {
    expect(authView({ configured: false, intent: "sync", authenticated: false })).toBe("local");
  });
});

describe("resolveIntent", () => {
  it("honours an explicit stored intent above everything", () => {
    expect(resolveIntent({ storedIntent: "sync", legacyAuth: { local: true }, hasLocalData: true })).toBe("sync");
    expect(resolveIntent({ storedIntent: "local", legacyAuth: { email: "x" }, hasLocalData: false })).toBe("local");
  });

  it("honours an explicit undecided (sign-out) over local-data heuristics", () => {
    expect(resolveIntent({ storedIntent: "undecided", legacyAuth: null, hasLocalData: true })).toBe("undecided");
  });

  it("infers local from a legacy { local: true } record", () => {
    expect(resolveIntent({ storedIntent: null, legacyAuth: { local: true }, hasLocalData: false })).toBe("local");
  });

  it("infers sync from a legacy user profile (previously signed in)", () => {
    expect(resolveIntent({ storedIntent: null, legacyAuth: { email: "a@b.c", name: "A" }, hasLocalData: true })).toBe("sync");
  });

  it("keeps an existing local-data user in (as local) rather than bouncing to welcome", () => {
    expect(resolveIntent({ storedIntent: undefined, legacyAuth: null, hasLocalData: true })).toBe("local");
  });

  it("sends a brand-new user (no intent, no auth, no data) to the front door", () => {
    expect(resolveIntent({ storedIntent: undefined, legacyAuth: null, hasLocalData: false })).toBe("undecided");
  });
});
