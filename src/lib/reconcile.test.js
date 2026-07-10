import { describe, it, expect } from "vitest";
import { reconcile, hasRealData } from "./reconcile.js";

const stamp = (iso, rev) => ({ meta: { updatedAt: iso, revision: rev } });
const withData = (extra = {}) => ({ income: [{ id: "a", amount: 1 }], ...extra });
const blank = (extra = {}) => ({ income: [], expenses: [], plans: [], ...extra });

describe("hasRealData", () => {
  it("is false for empty / blank states", () => {
    expect(hasRealData(null)).toBe(false);
    expect(hasRealData(blank())).toBe(false);
    expect(hasRealData({ settings: { startingSavings: 0 }, emergency: { current: 0, target: 0 } })).toBe(false);
  });
  it("is true when any list has entries", () => {
    expect(hasRealData(withData())).toBe(true);
  });
  it("is true when starting savings or emergency fund is set", () => {
    expect(hasRealData(blank({ settings: { startingSavings: 5000 } }))).toBe(true);
    expect(hasRealData(blank({ emergency: { current: 100, target: 0 } }))).toBe(true);
  });
});

describe("reconcile", () => {
  it("returns local when remote is missing or invalid", () => {
    const local = withData(stamp("2026-01-01T00:00:00Z", 1));
    expect(reconcile(local, null)).toBe(local);
    expect(reconcile(local, [])).toBe(local);          // array = invalid shape
    expect(reconcile(local, { income: {} })).toBe(local); // wrong-shape remote
  });

  it("returns remote when there is no local", () => {
    const remote = withData(stamp("2026-01-01T00:00:00Z", 1));
    expect(reconcile(null, remote)).toBe(remote);
  });

  it("newer updatedAt wins", () => {
    const older = withData(stamp("2026-01-01T00:00:00Z", 9));
    const newer = withData(stamp("2026-06-01T00:00:00Z", 1));
    expect(reconcile(older, newer)).toBe(newer); // remote newer
    expect(reconcile(newer, older)).toBe(newer); // local newer
  });

  it("breaks a timestamp tie with the higher revision", () => {
    const a = withData(stamp("2026-01-01T00:00:00Z", 3));
    const b = withData(stamp("2026-01-01T00:00:00Z", 7));
    expect(reconcile(a, b)).toBe(b); // remote higher rev
    expect(reconcile(b, a)).toBe(b); // local higher rev
  });

  it("keeps local on a full tie (no-op)", () => {
    const local = withData(stamp("2026-01-01T00:00:00Z", 5));
    const remote = withData(stamp("2026-01-01T00:00:00Z", 5));
    expect(reconcile(local, remote)).toBe(local);
  });

  it("empty-remote guard: a blank remote never clobbers real local work", () => {
    // Remote is BLANK but stamped much newer — must still lose to real local data.
    const local = withData(stamp("2026-01-01T00:00:00Z", 1));
    const remote = blank(stamp("2030-01-01T00:00:00Z", 99));
    expect(reconcile(local, remote)).toBe(local);
  });

  it("a real newer remote still wins over real local (normal sync)", () => {
    const local = withData(stamp("2026-01-01T00:00:00Z", 1));
    const remote = withData(stamp("2026-02-01T00:00:00Z", 1));
    expect(reconcile(local, remote)).toBe(remote);
  });

  it("treats missing meta as the oldest possible (t=0, rev=0)", () => {
    const noMeta = withData();
    const stamped = withData(stamp("2026-01-01T00:00:00Z", 1));
    expect(reconcile(noMeta, stamped)).toBe(stamped); // remote has a real stamp → wins
  });
});
