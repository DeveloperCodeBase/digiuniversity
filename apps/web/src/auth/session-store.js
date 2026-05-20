// =====================================================
// Session persistence.
//
// Lives in its own file (rather than next to AuthContext) so the API
// client can import it without pulling React in. We persist to
// localStorage but tolerate exceptions (private browsing, quota, …).
// =====================================================

const KEY = "digiu_session_v1";

const safeRead = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const safeWrite = (value) => {
  try {
    if (value == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // ignore — auth still works for the current tab via the in-memory cache.
  }
};

// We also keep an in-memory copy so reads during a request don't re-parse
// JSON every time and so private-browsing fallback still works.
let cached = safeRead();
const listeners = new Set();

const emit = () => {
  for (const fn of listeners) {
    try {
      fn(cached);
    } catch {
      // listener errors must not break siblings
    }
  }
};

export const sessionStore = {
  get: () => cached,

  set: (next) => {
    if (!next || !next.accessToken || !next.refreshToken) {
      cached = null;
      safeWrite(null);
    } else {
      cached = {
        accessToken: next.accessToken,
        accessTokenExpiresIn: next.accessTokenExpiresIn,
        refreshToken: next.refreshToken,
        refreshTokenExpiresAt: next.refreshTokenExpiresAt,
        user: next.user,
      };
      safeWrite(cached);
    }
    emit();
  },

  clear: () => {
    cached = null;
    safeWrite(null);
    emit();
  },

  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
