/* ------------------------------------------------------------------ *
 * Device storage adapter with a capability probe.
 *
 * Before choosing an adapter we write and delete a throwaway key inside
 * try/catch. If that throws (private mode, storage disabled, quota) we
 * silently fall back to an in-memory adapter that satisfies the same
 * shape — the app stays fully usable for the session, it just won't
 * persist across reloads (`persistent: false`).
 *
 * `set` returns a success boolean so a rejected write is surfaced, never
 * silently swallowed. `backend` is injectable for tests.
 * ------------------------------------------------------------------ */

function probe(backend) {
  try {
    const k = "__sp_probe__";
    backend.setItem(k, "1");
    backend.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function realAdapter(backend) {
  return {
    persistent: true,
    get(key) {
      try { return backend.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { backend.setItem(key, value); return true; } catch { return false; }
    },
    remove(key) {
      try { backend.removeItem(key); } catch { /* ignore */ }
    },
  };
}

function memoryAdapter() {
  const mem = new Map();
  return {
    persistent: false,
    get(key) { return mem.has(key) ? mem.get(key) : null; },
    set(key, value) { mem.set(key, value); return true; },
    remove(key) { mem.delete(key); },
  };
}

export function createDeviceStorage(backend) {
  const b = backend !== undefined
    ? backend
    : (typeof localStorage !== "undefined" ? localStorage : null);
  if (b && probe(b)) return realAdapter(b);
  return memoryAdapter();
}
