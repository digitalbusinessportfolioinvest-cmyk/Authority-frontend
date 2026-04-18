import { C } from "./constants.js";

/** Clamp score to 0-100 range. Returns null if input is invalid. */
export function clampScore(s) {
  return (typeof s === "number" && !isNaN(s)) ? Math.max(0, Math.min(100, Math.round(s))) : null;
}

/** Normalize score name: API may return dxScore, globalScore, or dx_score. Returns null if missing. */
export function getDxScore(r) {
  const raw = r?.dxScore ?? r?.globalScore ?? r?.dx_score;
  return (raw != null) ? clampScore(raw) : null;
}

/** Score color: green >= 80, yellow >= 60, red < 60 */
export function sc(s) {
  return s >= 80 ? C.accent : s >= 60 ? C.warn : C.fail;
}

/** Email validation */
export function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

/** URL normalization and validation. Returns normalized URL or null. */
export function normalizeAndValidateUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  let u = raw.trim();
  if (/^[a-z]+:\/\//i.test(u) && !/^https?:\/\//i.test(u)) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (!parsed.hostname.includes(".")) return null;
    if (parsed.hostname.length < 4) return null;
    return parsed.toString();
  } catch { return null; }
}
