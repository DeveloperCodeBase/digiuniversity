// =====================================================
// API client — single fetch wrapper used by every call from the SPA.
//
// Responsibilities:
//   - prefix paths with /api (the host Caddy strips this before forwarding)
//   - attach the access JWT from sessionStore
//   - retry once on 401 by exchanging the refresh JWT for a fresh pair
//   - throw a structured ApiError so callers can inspect status + body
// =====================================================

import { sessionStore } from "../auth/session-store.js";

const API_PREFIX = "/api";

export class ApiError extends Error {
  constructor({ status, statusText, body, url }) {
    super(
      `${status} ${statusText} on ${url}: ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`,
    );
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.url = url;
  }

  /** Pull the most useful human-readable message out of the body. */
  get displayMessage() {
    if (typeof this.body === "string") return this.body;
    if (this.body && typeof this.body === "object") {
      if (Array.isArray(this.body.message)) return this.body.message.join("\n");
      if (typeof this.body.message === "string") return this.body.message;
      if (typeof this.body.error === "string") return this.body.error;
    }
    return this.statusText || "خطای ناشناخته";
  }
}

const readBody = async (res) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
};

/**
 * Low-level request. Use the higher-level helpers in endpoints.js unless
 * you need full control.
 */
const rawFetch = async (method, path, { body, headers, accessToken } = {}) => {
  const url = path.startsWith("http") ? path : API_PREFIX + path;
  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  };
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new ApiError({
      status: res.status,
      statusText: res.statusText,
      body: await readBody(res),
      url,
    });
  }
  if (res.status === 204) return null;
  return readBody(res);
};

// Single-flight refresh: if 30 requests race a 401, we want exactly one
// refresh attempt and the rest to await its outcome.
let refreshInFlight = null;

const tryRefresh = async () => {
  if (refreshInFlight) return refreshInFlight;
  const session = sessionStore.get();
  if (!session?.refreshToken) return null;
  refreshInFlight = (async () => {
    try {
      const next = await rawFetch("POST", "/v1/auth/refresh", {
        body: { refreshToken: session.refreshToken },
      });
      sessionStore.set(next);
      return next;
    } catch (err) {
      sessionStore.clear();
      throw err;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

/**
 * Authenticated request — auto-refreshes on 401 once, then retries.
 */
export const apiFetch = async (method, path, opts = {}) => {
  const session = sessionStore.get();
  const accessToken = session?.accessToken;
  try {
    return await rawFetch(method, path, { ...opts, accessToken });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || opts._retried) {
      throw err;
    }
    let next;
    try {
      next = await tryRefresh();
    } catch {
      throw err;
    }
    if (!next?.accessToken) throw err;
    return rawFetch(method, path, {
      ...opts,
      _retried: true,
      accessToken: next.accessToken,
    });
  }
};

/**
 * Public (unauthenticated) request — used by login / register / health.
 */
export const apiPublic = (method, path, opts = {}) => rawFetch(method, path, opts);

export const api = {
  get: (path, opts) => apiFetch("GET", path, opts),
  post: (path, body, opts) => apiFetch("POST", path, { ...opts, body }),
  patch: (path, body, opts) => apiFetch("PATCH", path, { ...opts, body }),
  // `del` was the original short-form, but the R1 academicAdminApi
  // helpers (deleteSchool / deleteFaculty / etc.) were authored against
  // `api.delete` — which previously evaluated to undefined. The R1+R2
  // admin delete buttons were silently broken at the network layer
  // (the soft-delete buttons resolved to a TypeError in the browser
  // console; the server-side soft-delete never ran). Adding `delete`
  // as an alias here is the minimum-touch fix: keeps `api.del`
  // working for the legacy tutorApi.deleteSession + makes every
  // `api.delete(...)` call site (R1, R2, and R3.a's identityApi)
  // actually hit the backend. Discovered while authoring R3.a Commit I.
  del: (path, opts) => apiFetch("DELETE", path, opts),
  delete: (path, opts) => apiFetch("DELETE", path, opts),
};

export const publicApi = {
  post: (path, body, opts) => apiPublic("POST", path, { ...opts, body }),
  get: (path, opts) => apiPublic("GET", path, opts),
};
