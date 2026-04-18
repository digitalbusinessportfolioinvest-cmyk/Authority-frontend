import { useState } from "react";
import { C, GC } from "./shared/constants.js";
import { clampScore, sc } from "./shared/helpers.js";

export function Icon({ name, size = 18, color = C.textMuted }) {
  const d = {
    search: <path d="M21 21l-5.2-5.2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />,
    zap: <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" /></>,
    check: <path d="M20 6L9 17l-5-5" />,
    x: <path d="M18 6L6 18M6 6l12 12" />,
    minus: <path d="M5 12h14" />,
    alertTriangle: <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4l-10 7L2 4" /></>,
    award: <><circle cx="12" cy="8" r="6" /><path d="M15.48 11.93L17 21l-5-3-5 3 1.52-9.07" /></>,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    link: <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />,
    chevDown: <path d="M6 9l6 6 6-6" />,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
    barChart: <><path d="M12 20V10M18 20V4M6 20v-4" /></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d[name] || null}</svg>;
}

export function ScoreRing({ score, grade, size = 160 }) {
  const r = (size - 14) / 2, circ = 2 * Math.PI * r, off = circ - (score / 100) * circ;
  const color = GC[grade] || C.accent;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={C.border} strokeWidth="8" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="8" fill="none" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color, lineHeight: 1, fontFamily: "monospace" }}>{score}</span>
        <span style={{ fontSize: size * 0.08, color: C.textMuted, marginTop: 4, letterSpacing: "0.15em" }}>GRADE {grade}</span>
      </div>
    </div>
  );
}

export function SubScore({ label, score: s }) {
  const val = clampScore(s);
  if (val == null) return null;
  const color = sc(val);
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color }}>{val}</div>
      <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 8, width: "80%", margin: "8px auto 0" }}>
        <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 2, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

export function SubScoreMini({ label, value }) {
  const val = clampScore(value);
  if (val == null) return null;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, color: C.textDim }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: sc(val) }}>{val}</div>
    </div>
  );
}

export function CTAButton({ label, price, color, small, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: small ? "1" : undefined, padding: small ? "10px 16px" : "14px 20px",
      borderRadius: 10, border: `1px solid ${color}30`, background: `${color}10`,
      cursor: "pointer", textAlign: "center",
    }}>
      <div style={{ fontSize: small ? 12 : 14, fontWeight: 700, color }}>{label}</div>
      <div style={{ fontSize: small ? 10 : 12, color: C.textMuted, marginTop: 2 }}>{price}</div>
    </button>
  );
}
