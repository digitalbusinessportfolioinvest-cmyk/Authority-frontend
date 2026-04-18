import { useState } from "react";
import { C, CATS, ARCHETYPES, COUNTRIES } from "./shared/constants.js";
import { clampScore, sc, isValidEmail } from "./shared/helpers.js";
import { apiFetch } from "./shared/api.js";
import { Icon, CTAButton } from "./ui.jsx";

const DEMO_MODE = typeof window !== "undefined" && window.__DX_DEMO__ === true;

export function CheckRow({ check: ch }) {
  const [open, setOpen] = useState(false);
  if (!ch || !ch.title) return null;
  const cfg = { pass: { icon: "check", color: C.accent }, fail: { icon: "x", color: C.fail }, warn: { icon: "alertTriangle", color: C.warn }, info: { icon: "minus", color: C.info }, error: { icon: "x", color: C.fail } }[ch.status] || { icon: "minus", color: C.textDim };
  const hasContent = (ch.fix && ch.fix.trim()) || (ch.message && ch.message.trim());
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div onClick={() => hasContent && setOpen(!open)} style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, cursor: hasContent ? "pointer" : "default" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={cfg.icon} size={13} color={cfg.color} />
        </div>
        <span style={{ flex: 1, fontSize: 13.5, color: ch.status === "pass" ? C.textMuted : C.text }}>{ch.title}</span>
        {ch.severity && ch.status !== "pass" && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${cfg.color}15`, color: cfg.color, fontWeight: 600 }}>{ch.severity}</span>}
      </div>
      {open && hasContent && (
        <div style={{ padding: "0 24px 16px 62px", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
          {ch.message?.trim() && <p style={{ margin: "0 0 8px" }}>{ch.message}</p>}
          {ch.fix?.trim() && <div style={{ padding: "10px 14px", background: C.accentDim, borderRadius: 8, fontSize: 12, color: C.accent }}>{ch.fix}</div>}
        </div>
      )}
    </div>
  );
}


export function CategoryCard({ id, data, unlocked }) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;
  const meta = CATS[id] || { icon: "globe", label: id };
  const checks = data.checks || [];
  const passed = checks.filter(c => c.status === "pass" || c.status === "info").length;
  const total = checks.length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warn").length;
  const scoreVal = clampScore(data.score) ?? 0;
  const color = sc(scoreVal);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div onClick={() => unlocked && setExpanded(!expanded)} style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, cursor: unlocked ? "pointer" : "default" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={meta.icon} size={20} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{meta.label}</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color }}>{scoreVal}</span>
          </div>
          <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
            <div style={{ width: `${scoreVal}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: C.textMuted }}>
            <span>{passed}/{total} passed</span>
            {failed > 0 && <span style={{ color: C.fail }}>{failed} failed</span>}
            {warned > 0 && <span style={{ color: C.warn }}>{warned} warnings</span>}
          </div>
        </div>
        {unlocked && <Icon name="chevDown" size={16} color={C.textDim} />}
      </div>
      {id === "eeat" && data.pillars && (
        <div style={{ padding: "0 24px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(data.pillars).map(([p, s]) => {
            const val = clampScore(s) ?? 0;
            const pc = sc(val);
            const labels = { experience: "Experience", expertise: "Expertise", authoritativeness: "Authority", trust: "Trust" };
            return (
              <div key={p} style={{ flex: "1 1 45%", background: `${pc}10`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{labels[p] || p}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: pc, fontFamily: "monospace" }}>{val}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {expanded && unlocked && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "4px 0" }}>
          {checks.map((ch, i) => <CheckRow key={ch.id || i} check={ch} />)}
        </div>
      )}
    </div>
  );
}


export function MaturityTimeline({ maturity }) {
  if (!maturity?.categories || !maturity?.summary) return null;
  const { categories, summary } = maturity;
  const labels = { seo: "Technical SEO", performance: "Performance", security: "Security", accessibility: "Accessibility", aiVisibility: "AI Visibility", eeat: "E-E-A-T", qfo: "Query Fan-Out", linkQuality: "Link Quality" };
  const yc = y => (typeof y === "number" && y >= 2026) ? C.accent : (y >= 2024) ? "#3B82F6" : (y >= 2021) ? C.warn : C.fail;
  const avgYear = summary.averageYear ?? 0;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>SEO Maturity Timeline</h3></div>
        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 18, color: yc(avgYear) }}>{avgYear}</span>
      </div>
      <div style={{ padding: "12px 24px" }}>
        {Object.entries(categories).map(([id, d]) => {
          if (!d || typeof d.year !== "number") return null;
          return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 28, borderRadius: 6, background: `${yc(d.year)}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: yc(d.year) }}>{d.year}</span>
            </div>
            <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{labels[id] || id}</span>
            <span style={{ fontSize: 11, color: C.textDim }}>{d.label || ""}</span>
          </div>
          );
        })}
      </div>
      {(summary.gap ?? 0) > 3 && (
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.warn }}>
          {summary.gap}-year gap between strongest and weakest dimension.
        </div>
      )}
    </div>
  );
}

/* ═══ Authority Brief ═══ */
export function AuthorityBrief({ results }) {
  const top3 = (results.topIssues || []).slice(0, 3);
  if (top3.length === 0) return null;
  return (
    <div style={{ background: `linear-gradient(135deg, ${C.card}, #151A22)`, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.accent }}>Authority Brief</h3>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: C.textMuted }}>Your 3 most critical issues</p>
      {results.archetypeContext && <p style={{ margin: "0 0 12px", fontSize: 12, color: C.info, fontStyle: "italic" }}>{results.archetypeContext}</p>}
      {top3.map((issue, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: C.accent, flexShrink: 0 }}>{i + 1}.</span>
          <div>
            <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{issue.title}</span>
            {issue.fix && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted }}>{issue.fix}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}


export function DiagnosticBridge({ bridge }) {
  const [open, setOpen] = useState(null);
  if (!bridge || bridge.length === 0) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Quick Fixes</h3>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textDim }}>Checklists and code snippets for your top issues</p>
      </div>
      {bridge.map((b, i) => (
        <div key={i} style={{ borderBottom: i < bridge.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <div onClick={() => setOpen(open === i ? null : i)} style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: 13, color: C.text, fontWeight: 600, flex: 1 }}>{b.title}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: C.failDim, color: C.fail, fontWeight: 600 }}>{b.severity}</span>
          </div>
          {open === i && b.bridge && (
            <div style={{ padding: "0 24px 16px" }}>
              {Array.isArray(b.bridge.checklist) && b.bridge.checklist.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {b.bridge.checklist.map((item, ci) => (
                    <div key={ci} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 12, color: C.textMuted }}>
                      <span style={{ color: C.accent }}>→</span><span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {b.bridge.codeSnippet && (
                <pre style={{ padding: 12, background: C.bg, borderRadius: 8, fontSize: 11, color: C.accent, overflow: "auto", whiteSpace: "pre-wrap", margin: 0 }}>{b.bridge.codeSnippet}</pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


export function ScanProgress({ progress, archetype, onArchetype, geolocation, onGeolocation }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 56, height: 56, margin: "0 auto 20px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>Diagnosing your site</p>
      <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 24px" }}>{progress}</p>
      <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {archetype !== undefined && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, textAlign: "left" }}>
            <p style={{ fontSize: 13, color: C.text, fontWeight: 600, margin: "0 0 8px" }}>What type of site is this?</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ARCHETYPES.map(a => (
                <button key={a} onClick={() => onArchetype(a)} style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  border: `1px solid ${archetype === a ? C.accent : C.border}`,
                  background: archetype === a ? C.accentDim : C.bg,
                  color: archetype === a ? C.accent : C.textMuted,
                }}>{a}</button>
              ))}
            </div>
          </div>
        )}
        {geolocation !== undefined && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, textAlign: "left" }}>
            <p style={{ fontSize: 13, color: C.text, fontWeight: 600, margin: "0 0 8px" }}>Where are your customers?</p>
            <select value={geolocation} onChange={e => onGeolocation(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 13 }}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ═══ Post-Result CTAs ═══ */
export function ResultCTAs({ scanId, user }) {
  const doCheckout = async (product) => {
    if (DEMO_MODE) { alert(`Checkout: ${product}`); return; }
    if (!scanId) { alert("Scan not saved. Please re-scan before purchasing."); return; }
    const email = user?.email || prompt("Enter your email for the report:");
    if (!email || !isValidEmail(email)) { if (email) alert("Please enter a valid email."); return; }
    const data = await apiFetch("/api/checkout", { method: "POST", body: JSON.stringify({ scan_id: scanId, email, product }) });
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Checkout failed");
  };
  const doMonitorSubscribe = async (tier) => {
    if (!user) { alert("Create an account first to enable monitoring."); return; }
    const domain = prompt("Domain to monitor:");
    if (!domain) return;
    const competitors = tier === "agency" ? (prompt("Competitor domains (comma-separated, max 3):") || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3) : [];
    const data = await apiFetch("/api/monitor/subscribe", { method: "POST", body: JSON.stringify({ domain, tier, competitors }) });
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Subscription failed");
  };
  const doBadge = async () => {
    if (!user) { alert("Create an account to enable your badge."); return; }
    const data = await apiFetch("/api/badge/enable", { method: "POST", body: JSON.stringify({ scan_id: scanId }) });
    if (data.success) alert("Badge enabled! Your trust badge is now live.");
    else alert(data.error || "Failed");
  };
  const doDirectory = async () => {
    if (!user) { alert("Create an account to join the directory."); return; }
    const data = await apiFetch("/api/directory/join", { method: "POST", body: JSON.stringify({ scan_id: scanId }) });
    if (data.success) alert("Listed in AuthorityDx directory!");
    else alert(data.error || "Failed");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <CTAButton label="Dx Report PDF" price="€0.95" color={C.accent} onClick={() => doCheckout("report")} />
        <CTAButton label="AI Visibility Deep Scan" price="€3.50" color={C.info} onClick={() => doCheckout("llm_visibility")} />
        <CTAButton label="Both — Save €0.50" price="€3.95" color={C.purple} onClick={() => doCheckout("combo")} />
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.text }}>Track your progress</h4>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: C.textMuted }}>Get a weekly email when your score changes</p>
        <div style={{ display: "flex", gap: 8 }}>
          <CTAButton label="Dx Monitor" price="€1/mo" color={C.accent} small onClick={() => doMonitorSubscribe("monitor")} />
          <CTAButton label="+ 3 Competitors" price="€5/mo" color={C.purple} small onClick={() => doMonitorSubscribe("agency")} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={doBadge} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
          Get your trust badge (free backlink)
        </button>
        <button onClick={doDirectory} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
          Join the directory
        </button>
      </div>
    </div>
  );
}

export function TopIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Top Issues to Fix</h3>
      </div>
      {issues.slice(0, 5).map((issue, i) => <CheckRow key={issue.id || i} check={issue} />)}
    </div>
  );
}

/* ═══ Scan History Page ═══ */

