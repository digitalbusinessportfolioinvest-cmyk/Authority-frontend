const API_URL =
  (typeof window !== "undefined" && window.__DX_API_URL__) ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";
const TIMEOUT_MS = 60000; // 60s — scans can take time

let _memToken = null;

export function getToken() {
  if (!_memToken) { try { _memToken = localStorage.getItem("dx_token"); } catch {} }
  // Check expiry
  if (_memToken) {
    try {
      const payload = JSON.parse(atob(_memToken.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearToken();
        return null;
      }
    } catch { clearToken(); return null; }
  }
  return _memToken;
}

export function setToken(t) {
  _memToken = t;
  try { localStorage.setItem("dx_token", t); } catch {}
}

export function clearToken() {
  _memToken = null;
  try { localStorage.removeItem("dx_token"); } catch {}
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

/**
 * Standardized API fetch with timeout, error handling, and consistent response.
 * Always returns { success, error?, ...data } — never throws for HTTP errors.
 */
export async function apiFetch(path, opts = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, opts.timeout || TIMEOUT_MS);

  // If caller passes a signal, abort our controller when theirs fires
  if (opts.signal) {
    if (opts.signal.aborted) { clearTimeout(timeout); return { success: false, error: "Aborted", _aborted: true }; }
    opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const { signal: _ignored, timeout: _t, ...fetchOpts } = opts;
    const res = await fetch(`${API_URL}${path}`, {
      ...fetchOpts,
      headers: { ...authHeaders(), ...fetchOpts.headers },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.error || `HTTP ${res.status}`, _status: res.status, ...body };
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      if (timedOut) return { success: false, error: "Request timed out", _timeout: true };
      return { success: false, error: "Aborted", _aborted: true };
    }
    return { success: false, error: err.message || "Network error", _networkError: true };
  }
}

export { API_URL };
