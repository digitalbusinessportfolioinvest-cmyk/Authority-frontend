import { useState, useEffect, useRef } from "react";
import { C, GC, CATS } from "./shared/constants.js";
import { clampScore, getDxScore, sc } from "./shared/helpers.js";
import { apiFetch, API_URL } from "./shared/api.js";
import { Icon, ScoreRing, SubScore, SubScoreMini } from "./ui.jsx";
import { CategoryCard } from "./scan-results.jsx";

export function ScanHistoryPage({ user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    apiFetch("/api/user/scans").then(d => {
      if (d.error) { setError(d.error); setLoading(false); return; }
      setScans(d.scans || []); setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, []);
  if (loading) return <p style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Loading scan history...</p>;
  if (error) return <p style={{ color: C.fail, textAlign: "center", padding: 40 }}>Failed to load: {error}</p>;
  if (scans.length === 0) return <p style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>No scans yet. Run your first scan above.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>Scan History</h2>
      {scans.map(s => (
        <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `${GC[s.grade] || C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: GC[s.grade] || C.accent }}>{getDxScore(s) ?? "—"}</span>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.domain}</span>
            <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: C.textMuted }}>
              <span>Grade {s.grade || "?"}</span>
              {s.archetype && <span>{s.archetype}</span>}
              <span>{s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <SubScoreMini label="TH" value={s.scores_technical_health} />
            <SubScoreMini label="TR" value={s.scores_trust} />
            <SubScoreMini label="AI" value={s.scores_ai_readiness} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicReportPage({ domain }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    apiFetch(`/api/report/${encodeURIComponent(domain)}`)
      .then(d => { if (!d.success) throw new Error(d.error || "Load failed"); return d; })
      .then(d => { setReport(d.report || null); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [domain]);
  if (loading) return <p style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Loading report...</p>;
  if (error) return <p style={{ color: C.fail, textAlign: "center", padding: 40 }}>Failed to load report: {error}</p>;
  if (!report) return <p style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>No public report for {domain}.</p>;

  /* #4 — safe JSON parse */
  let result = null;
  try { result = typeof report.full_result === "string" ? JSON.parse(report.full_result) : report.full_result; }
  catch { result = null; }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Public Report: {domain}</h2>
      <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 20px" }}>
        Independently audited — {report.created_at ? new Date(report.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "N/A"}
      </p>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <ScoreRing score={getDxScore(report) ?? 0} grade={report.grade || "?"} size={140} />
      </div>
      {result?.scores && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, background: C.card, borderRadius: 12, padding: "20px 16px", border: `1px solid ${C.border}` }}>
          <SubScore label="Technical" score={result.scores.technicalHealth} />
          <SubScore label="Trust" score={result.scores.trust} />
          <SubScore label="AI Ready" score={result.scores.aiReadiness} />
          {result.scores.architecture != null && <SubScore label="Architecture" score={result.scores.architecture} />}
        </div>
      )}
      {/* #5 — guard categories */}
      {result?.categories && Object.entries(result.categories).map(([id, data]) => (
        data?.checks ? <div key={id} style={{ marginBottom: 8 }}><CategoryCard id={id} data={data} unlocked={false} /></div> : null
      ))}
    </div>
  );
}

/* ═══ Radar Page — #3 #8 #9 #13 error handling, race condition, loading, scroll ═══ */
export function RadarPage({ user }) {
  const [subs, setSubs] = useState([]);
  const [radarData, setRadarData] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radarLoading, setRadarLoading] = useState(false);
  const [error, setError] = useState(null);
  /* #8 — track request ID to prevent race condition */
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch("/api/user/subscriptions", { signal: ctrl.signal }).then(d => {
      if (d.error) { setError(d.error); setLoading(false); return; }
      const agencySubs = (d.subscriptions || []).filter(s => s.tier === "agency" && s.active);
      setSubs(agencySubs);
      if (agencySubs.length > 0) setSelectedSub(agencySubs[0]);
      setLoading(false);
    }).catch(e => { if (e.name !== "AbortError") { setError(e.message); setLoading(false); } });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!selectedSub) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const myRequestId = ++requestIdRef.current;
    setRadarLoading(true);
    setError(null);
    apiFetch(`/api/monitor/radar/${selectedSub.id}`, { signal: ctrl.signal }).then(d => {
      /* #8 — discard stale response */
      if (requestIdRef.current !== myRequestId) return;
      if (d.error) { setError(d.error); setRadarLoading(false); return; }
      setRadarData(d);
      setRadarLoading(false);
    }).catch(e => {
      if (requestIdRef.current !== myRequestId) return;
      if (e.name !== "AbortError") { setError(e.message); setRadarLoading(false); }
    });
    return () => ctrl.abort();
  }, [selectedSub]);

  if (loading) return <p style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Loading...</p>;
  if (error) return <p style={{ color: C.fail, textAlign: "center", padding: 40 }}>Error: {error}</p>;
  if (subs.length === 0) return <p style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>No Agency subscriptions. Subscribe to Dx Monitor Agency (€5/mo) to track competitors.</p>;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Competitor Radar</h2>
      {subs.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {subs.map(s => (
            <button key={s.id} onClick={() => setSelectedSub(s)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${selectedSub?.id === s.id ? C.accent : C.border}`,
              background: selectedSub?.id === s.id ? C.accentDim : C.card,
              color: selectedSub?.id === s.id ? C.accent : C.textMuted,
            }}>{s.domain}</button>
          ))}
        </div>
      )}
      {radarLoading && <p style={{ color: C.textMuted, textAlign: "center", padding: 20 }}>Loading radar data...</p>}
      {!radarLoading && radarData && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.accent, margin: "0 0 12px" }}>{radarData.domain}</h3>
          <ScoreHistory label="Your scores" history={radarData.ownHistory} />
          {Object.entries(radarData.competitors || {}).map(([comp, history]) => (
            <ScoreHistory key={comp} label={comp} history={history} isCompetitor />
          ))}
        </>
      )}
    </div>
  );
}

/* #4 #13 — safe JSON parse + mobile scroll */
export function ScoreHistory({ label, history, isCompetitor }) {
  if (!history || history.length === 0) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: isCompetitor ? C.warn : C.text }}>{label}</h4>
      {/* #13 — controlled horizontal scroll for mobile */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", paddingBottom: 4 }}>
        {history.map((h, i) => {
          let scores, delta;
          try { scores = typeof h.scores === "string" ? JSON.parse(h.scores) : (h.scores || {}); } catch { scores = {}; }
          try { delta = typeof h.delta === "string" ? JSON.parse(h.delta) : h.delta; } catch { delta = null; }
          const dxVal = getDxScore(scores);
          return (
            <div key={i} style={{ minWidth: 80, textAlign: "center", padding: "8px 12px", background: C.bg, borderRadius: 8, flexShrink: 0 }}>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: sc(dxVal || 0) }}>{dxVal ?? "—"}</div>
              {delta?.dxScore != null && <div style={{ fontSize: 10, color: delta.dxScore > 0 ? C.accent : delta.dxScore < 0 ? C.fail : C.textDim }}>
                {delta.dxScore > 0 ? "+" : ""}{delta.dxScore}
              </div>}
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 4 }}>{h.created_at ? new Date(h.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export function ReportSuccessPage({ onBack }) {
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    let cancelled = false;
    let timer = null;
    let attempts = 0;
    const check = () => {
      if (cancelled || attempts++ > 5) return;
      apiFetch(`/api/purchase/status?session_id=${encodeURIComponent(sessionId)}`).then(data => {
        if (cancelled) return;
        if (data.success && data.purchase) setPurchase(data.purchase);
        else timer = setTimeout(check, 2000);
      }).catch(() => {});
    };
    check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  const productLabels = { report: "Dx Report PDF", llm_visibility: "LLM Visibility Score", combo: "Report + LLM Visibility" };

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Icon name="check" size={32} color={C.accent} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>Payment received</h2>
      <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 24px", lineHeight: 1.6 }}>
        Your report is being generated and will arrive in your inbox within a few minutes.
        {purchase && <><br />Product: <strong style={{ color: C.text }}>{productLabels[purchase.product] || purchase.product}</strong></>}
      </p>
      {purchase?.product === "llm_visibility" || purchase?.product === "combo" ? (
        <p style={{ fontSize: 13, color: C.info, margin: "0 0 24px" }}>
          Your LLM Visibility deep scan (20 queries × 4 engines) is running now. Results will be emailed separately.
        </p>
      ) : null}
      <button onClick={onBack} style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: C.accent, color: C.bg, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Run another scan
      </button>
    </div>
  );
}

/* ═══ Monitor Success Page ═══ */
export function MonitorSuccessPage({ onBack }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Icon name="check" size={32} color={C.accent} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>Dx Monitor activated</h2>
      <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 12px", lineHeight: 1.6 }}>
        Your first monitoring scan will run within 24 hours. After that, you'll receive a weekly email with your score changes.
      </p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, maxWidth: 360, margin: "0 auto 24px", textAlign: "left" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Icon name="check" size={14} color={C.accent} />
            <span style={{ color: C.textMuted }}>Weekly re-scan of your domain</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Icon name="check" size={14} color={C.accent} />
            <span style={{ color: C.textMuted }}>Email with score deltas and changes</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Icon name="check" size={14} color={C.accent} />
            <span style={{ color: C.textMuted }}>Cancel anytime from your account</span>
          </div>
        </div>
      </div>
      <button onClick={onBack} style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: C.accent, color: C.bg, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Back to scanner
      </button>
    </div>
  );
}

/* ═══ Admin Panel ═══ */
export function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [tab, setTab] = useState("stats");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/stats"),
      apiFetch("/api/admin/users?limit=50"),
      apiFetch("/api/admin/testimonials"),
    ]).then(([s, u, t]) => {
      if (s.error) { setError(s.error); setLoading(false); return; }
      setStats(s.stats || null);
      setUsers(u.users || []);
      setTestimonials(t.testimonials || []);
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const approveTestimonial = async (id) => {
    const res = await apiFetch(`/api/admin/testimonials/${id}/approve`, { method: "POST" });
    if (!res.error) setTestimonials(t => t.filter(x => x.id !== id));
  };

  if (loading) return <p style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Loading admin data...</p>;
  if (error) return <p style={{ color: C.fail, textAlign: "center", padding: 40 }}>Admin error: {error}</p>;

  const tabs = [
    { id: "stats", label: "Stats" },
    { id: "users", label: "Users" },
    { id: "testimonials", label: `Reviews (${testimonials.length})` },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Admin Panel</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${tab === t.id ? C.accent : C.border}`,
            background: tab === t.id ? C.accentDim : C.card, color: tab === t.id ? C.accent : C.textMuted,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "Total Users", val: stats.total_users },
            { label: "Total Scans", val: stats.total_scans },
            { label: "Scans Today", val: stats.scans_today },
            { label: "Scans This Week", val: stats.scans_week },
            { label: "Total Purchases", val: stats.total_purchases },
            { label: "Revenue (EUR)", val: `€${parseFloat(stats.total_revenue_eur || 0).toFixed(2)}` },
            { label: "Active Subs", val: stats.active_subscriptions },
            { label: "Monitor Subs", val: stats.monitor_subs },
            { label: "Agency Subs", val: stats.agency_subs },
            { label: "Avg Score", val: stats.avg_score },
            { label: "Public Reports", val: stats.public_reports },
            { label: "Active Badges", val: stats.active_badges },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: C.text }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {users.map(u => (
            <div key={u.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600, flex: 1 }}>{u.email}</span>
              <span style={{ fontSize: 11, color: C.textDim }}>{u.scan_count} scans</span>
              <span style={{ fontSize: 11, color: C.textDim }}>{u.purchase_count} purchases</span>
              <span style={{ fontSize: 11, color: u.active_subs > 0 ? C.accent : C.textDim }}>{u.active_subs} subs</span>
            </div>
          ))}
        </div>
      )}

      {tab === "testimonials" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {testimonials.length === 0 && <p style={{ color: C.textMuted }}>No pending testimonials.</p>}
          {testimonials.map(t => (
            <div key={t.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.author_name} — {t.domain}</span>
                <button onClick={() => approveTestimonial(t.id)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: C.accent, color: C.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Approve</button>
              </div>
              <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{t.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

