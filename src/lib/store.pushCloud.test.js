import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { store, setTokenProvider } from "./store.js";

// Minimal fetch stub: hands back queued responses in order. driveFileId reads
// .json() (the appDataFolder file listing); the upload only reads .ok/.status.
function queueFetch(responses) {
  const q = [...responses];
  global.fetch = vi.fn(async () => {
    if (!q.length) throw new Error("unexpected extra fetch");
    return q.shift();
  });
}
const listOk = (id) => ({ ok: true, status: 200, json: async () => ({ files: id ? [{ id }] : [] }) });
const upload = (ok, status) => ({ ok, status, json: async () => ({}) });

const STATE = { meta: { revision: 1 } };

describe("store.pushCloud auth recovery", () => {
  afterEach(() => {
    setTokenProvider(null);
    vi.restoreAllMocks();
  });

  it("succeeds without any refresh when the token is accepted", async () => {
    const provider = vi.fn(async () => "t-live");
    setTokenProvider(provider);
    queueFetch([listOk("f1"), upload(true, 200)]);

    const res = await store.pushCloud(STATE);

    expect(res).toEqual({ ok: true, health: "ok" });
    // Only the initial (non-forced) token acquisition — no reconnect churn.
    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledWith({ forceRefresh: false });
  });

  it("recovers silently from a 401 by re-minting the token and retrying", async () => {
    // Live-by-clock token gets rejected; a forced refresh yields a fresh one.
    const provider = vi.fn(async ({ forceRefresh }) => (forceRefresh ? "t-fresh" : "t-stale"));
    setTokenProvider(provider);
    queueFetch([
      listOk("f1"), upload(false, 401), // first attempt: Drive rejects
      listOk("f1"), upload(true, 200),  // retry with fresh token: succeeds
    ]);

    const res = await store.pushCloud(STATE);

    expect(res).toEqual({ ok: true, health: "ok" }); // no banner
    expect(provider).toHaveBeenCalledWith({ forceRefresh: true });
  });

  it("flags auth only when the retry is also unauthorized", async () => {
    const provider = vi.fn(async ({ forceRefresh }) => (forceRefresh ? "t-fresh" : "t-stale"));
    setTokenProvider(provider);
    queueFetch([
      listOk("f1"), upload(false, 401), // first attempt
      listOk("f1"), upload(false, 401), // retry still rejected → genuine disconnect
    ]);

    const res = await store.pushCloud(STATE);

    expect(res).toEqual({ ok: false, health: "error", reason: "auth" });
  });

  it("flags auth when no fresh token can be obtained after a 401", async () => {
    // forceRefresh path throws (lapsed Google session) → provider returns null in store.
    const provider = vi.fn(async ({ forceRefresh }) => {
      if (forceRefresh) throw new Error("not_authenticated");
      return "t-stale";
    });
    setTokenProvider(provider);
    queueFetch([listOk("f1"), upload(false, 401)]);

    const res = await store.pushCloud(STATE);

    expect(res).toEqual({ ok: false, health: "error", reason: "auth" });
  });
});
