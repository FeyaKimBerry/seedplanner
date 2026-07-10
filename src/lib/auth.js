/* ------------------------------------------------------------------ *
 * Google Identity Services (GIS) token lifecycle — browser only.
 *
 * No client secret ever lives here: this is the standard OAuth browser
 * "token" flow, authorized by a public client ID. One funnel hands out
 * tokens; the pure state machine lives in authState.js.
 *
 *   - loadGis()          inject the SDK once (cached promise, shared load)
 *   - interactiveToken() prompt: "consent" — first connect / explicit reconnect
 *   - silentToken()      prompt: "" — no UI; resolves null on a lapsed session
 *   - getToken()         layered: live cached → silent refresh → throws NOT_AUTHENTICATED
 *   - clearToken()       drop the token (e.g. on 401) but keep the user opted in
 *   - revoke()           server-side revoke for a clean sign-out
 * ------------------------------------------------------------------ */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = "openid profile email https://www.googleapis.com/auth/drive.appdata";
const GIS_SRC = "https://accounts.google.com/gsi/client";
// Treat a token as expired ~60s early so it's never handed to a request that
// would expire mid-flight.
const EXPIRY_SKEW_MS = 60 * 1000;

export function isConfigured() {
  return !!CLIENT_ID;
}

let _scriptPromise = null;
export function loadGis() {
  if (_scriptPromise) return _scriptPromise;
  _scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.querySelector(`script[src*="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      // Might already be loaded but google not yet ready — resolve on next tick too.
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _scriptPromise;
}

let _tokenClient = null;
let _pending = null;      // { resolve, reject } for the single in-flight request
let _cache = null;        // { token, expiresAt }

function getClient() {
  if (_tokenClient) return _tokenClient;
  if (!window.google?.accounts?.oauth2 || !CLIENT_ID) return null;
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (resp) => {
      const p = _pending;
      if (!p) return;
      if (resp.error) {
        p.reject(new Error(resp.error));
        return;
      }
      const ttl = (Number(resp.expires_in) || 3600) * 1000 - EXPIRY_SKEW_MS;
      _cache = { token: resp.access_token, expiresAt: Date.now() + ttl };
      p.resolve(resp.access_token);
    },
    // GIS routes silent-request failures (no session, popup blocked, etc.) here,
    // NOT to `callback`. Without this the promise would hang forever on boot.
    error_callback: (err) => {
      const p = _pending;
      if (p) p.reject(new Error((err && err.type) || "oauth_error"));
    },
  });
  return _tokenClient;
}

// Bridge the callback SDK into a promise. `prompt` is "" (silent) or "consent".
// `timeoutMs` fails the request soft if GIS never calls back (belt-and-suspenders
// for the silent path so a hung request can't wedge boot).
function requestToken(prompt, timeoutMs = 0) {
  return loadGis().then(
    () =>
      new Promise((resolve, reject) => {
        const client = getClient();
        if (!client) return reject(new Error("not_configured"));
        // Supersede any earlier in-flight request rather than dropping its resolver.
        if (_pending) _pending.reject(new Error("superseded"));

        let timer = null;
        const entry = {
          resolve: (t) => { if (timer) clearTimeout(timer); if (_pending === entry) _pending = null; resolve(t); },
          reject: (e) => { if (timer) clearTimeout(timer); if (_pending === entry) _pending = null; reject(e); },
        };
        _pending = entry;
        if (timeoutMs) timer = setTimeout(() => entry.reject(new Error("timeout")), timeoutMs);
        try {
          client.requestAccessToken({ prompt });
        } catch (e) {
          entry.reject(e);
        }
      })
  );
}

// The live cached token, or null if missing / too close to expiry.
export function cachedToken() {
  if (_cache && _cache.token && Date.now() < _cache.expiresAt) return _cache.token;
  return null;
}

export function interactiveToken() {
  return requestToken("consent");
}

// Silent refresh fails SOFT: a lapsed session yields null instead of throwing,
// so callers fall back to "needs sign-in" rather than crashing.
export async function silentToken() {
  const live = cachedToken();
  if (live) return live;
  try {
    return await requestToken("", 3500); // fail soft after 3.5s so boot can't wedge
  } catch {
    return null;
  }
}

// Layered acquisition for any authorized request: cached → silent → error.
export async function getToken() {
  const live = cachedToken();
  if (live) return live;
  const refreshed = await silentToken();
  if (refreshed) return refreshed;
  const err = new Error("not_authenticated");
  err.code = "NOT_AUTHENTICATED";
  throw err;
}

export function clearToken() {
  _cache = null;
}

export async function revoke() {
  const token = _cache?.token;
  _cache = null;
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
    if (token && window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
  } catch {
    /* best effort */
  }
}

// Fetch the signed-in user's basic profile with a token (for the sign-in UI).
export async function fetchUserInfo(token) {
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return { name: u.name, email: u.email, picture: u.picture };
  } catch {
    return null;
  }
}
