import { useState } from "react";
import { C } from "./shared/constants.js";
import { clampScore, sc } from "./shared/helpers.js";
import { Icon } from "./ui.jsx";

export function AiVisibilityCheck({ data }) {
  if (!data) return null;
  const mentioned = data.mentioned ?? 0;
  const total = data.total ?? 0;
  const engines = Array.isArray(data.engines) ? data.engines : [];
  if (engines.length === 0) return null;
  const color = mentioned === 0 ? C.fail : mentioned <= 2 ? C.warn : C.accent;
  const labels = { direct: "Direct", problem: "Problem", alternative: "Alt", recommendation: "Rec" };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>AI Citability Hook</h3>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textDim }}>Can AI engines find and recommend you?</p>
        </div>
        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 18, color }}>{mentioned}/{total}</span>
      </div>
      <div style={{ padding: "4px 0" }}>
        {engines.map((e, i) => (
          <div key={e.name} style={{ padding: "12px 24px", borderBottom: i < engines.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: e.found ? C.accentDim : C.failDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={e.found ? "check" : "x"} size={13} color={e.found ? C.accent : C.fail} />
              </div>
              <span style={{ flex: 1, fontSize: 13.5, color: C.text, fontWeight: 500 }}>{e.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: e.found ? C.accent : C.fail }}>{e.found ? `${e.mentionedIn}/${e.totalAngles}` : "Not found"}</span>
            </div>
            {e.angles && (
              <div style={{ display: "flex", gap: 6, marginLeft: 38, marginTop: 6 }}>
                {e.angles.map(a => (
                  <div key={a.type} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: a.found ? C.accentDim : `${C.textDim}20`, fontSize: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.found ? C.accent : C.textDim }} />
                    <span style={{ color: a.found ? C.accent : C.textDim }}>{labels[a.type] || a.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


export function PerModelDiagnostics({ diagnostics, scanCategories }) {
  const [expanded, setExpanded] = useState(null);
  if (!diagnostics || diagnostics.length === 0) return null;

  const getCheckStatus = (checkId) => {
    if (!scanCategories) return null;
    for (const cat of Object.values(scanCategories)) {
      if (!cat) continue;
      const check = (cat.checks || []).find(c => c.id === checkId);
      if (check) return check;
    }
    return null;
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Per-Model AI Citability</h3>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textDim }}>Why each AI engine does or doesn't recommend you</p>
      </div>
      {diagnostics.map((d, i) => (
        <div key={d.engine} style={{ borderBottom: i < diagnostics.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: d.found ? C.accentDim : C.failDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={d.found ? "check" : "x"} size={13} color={d.found ? C.accent : C.fail} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{d.engine}</span>
              {d.primaryFactor && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textDim }}>{d.primaryFactor}</p>}
            </div>
            <Icon name="chevDown" size={14} color={C.textDim} />
          </div>
          {expanded === i && d.checkConnections && (
            <div style={{ padding: "0 24px 16px 62px" }}>
              {d.checkConnections.map(cc => {
                const check = getCheckStatus(cc.checkId);
                const statusColor = check ? (check.status === "pass" ? C.accent : check.status === "fail" ? C.fail : C.warn) : C.textDim;
                const statusIcon = check ? (check.status === "pass" ? "check" : check.status === "fail" ? "x" : "alertTriangle") : "minus";
                return (
                  <div key={cc.checkId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <Icon name={statusIcon} size={12} color={statusColor} />
                    <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{cc.label}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: cc.impact === "critical" ? C.failDim : cc.impact === "high" ? C.warnDim : C.infoDim, color: cc.impact === "critical" ? C.fail : cc.impact === "high" ? C.warn : C.info }}>{cc.impact}</span>
                    {check && check.status !== "pass" && check.fix && (
                      <span style={{ fontSize: 10, color: C.textDim, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{check.fix}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


export function HallucinationDisplay({ data }) {
  if (!data || !data.hallucinations || data.hallucinations.length === 0) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.fail}30`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: C.failDim }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.fail }}>Hallucination Detection</h3>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textMuted }}>
          AI engines are making {data.count} inaccurate claim{data.count !== 1 ? "s" : ""} about you
        </p>
      </div>
      {data.hallucinations.map((h, i) => (
        <div key={i} style={{ padding: "14px 24px", borderBottom: i < data.hallucinations.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.fail }}>{h.engine}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
              <span style={{ color: C.fail, fontWeight: 600, flexShrink: 0 }}>Says:</span>
              <span style={{ color: C.textMuted }}>{h.claim}</span>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
              <span style={{ color: C.accent, fontWeight: 600, flexShrink: 0 }}>Reality:</span>
              <span style={{ color: C.text }}>{h.reality}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

