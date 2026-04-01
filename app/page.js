"use client";
import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://authoritydx-backend-production.up.railway.app";
const DEMO_MODE = false;

const COLORS = {
  bg: "#0B0E11",
  card: "#12161C",
  border: "#1E2530",
  text: "#E8ECF1",
  textMuted: "#7A8599",
  textDim: "#4A5568",
  accent: "#00D67E",
  accentDim: "rgba(0,214,126,0.12)",
  warn: "#F0A030",
  warnDim: "rgba(240,160,48,0.12)",
  fail: "#E84057",
  failDim: "rgba(232,64,87,0.12)",
  info: "#4A9EF5",
  infoDim: "rgba(74,158,245,0.12)",
};

const GRADE_COLORS = { A: "#00D67E", B: "#4ADE80", C: "#F0A030", D: "#F07030", F: "#E84057" };

const CATEGORY_META = {
  seo: { icon: "search", label: "Technical SEO" },
  performance: { icon: "zap", label: "Performance" },
  security: { icon: "shield", label: "Security" },
  accessibility: { icon: "eye", label: "Accessibility" },
  aiVisibility: { icon: "cpu", label: "AI Visibility" },
  eeat: { icon: "award", label: "E-E-A-T" },
  qfo: { icon: "target", label: "Query Fan-Out" },
};

function Icon({ name, size = 18, color = COLORS.textMuted }) {
  const icons = {
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
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

function ScoreRing({ score, grade, size = 180 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = GRADE_COLORS[grade] || COLORS.accent;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={COLORS.border} strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
        <span style={{ fontSize: size * 0.11, color: COLORS.textMuted, marginTop: 2 }}>Dx SCORE</span>
      </div>
    </div>
  );
}

function CheckRow({ check }) {
  const [open, setOpen] = useState(false);
  const statusConfig = {
    pass: { icon: "check", color: COLORS.accent, bg: COLORS.accentDim },
    fail: { icon: "x", color: COLORS.fail, bg: COLORS.failDim },
    warn: { icon: "alertTriangle", color: COLORS.warn, bg: COLORS.warnDim },
    info: { icon: "minus", color: COLORS.info, bg: COLORS.infoDim },
  };
  const cfg = statusConfig[check.status] || statusConfig.info;
  const hasFix = check.fix || check.message;
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <div onClick={() => hasFix && setOpen(!open)} style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, cursor: hasFix ? "pointer" : "default" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={cfg.icon} size={13} color={cfg.color} />
        </div>
        <span style={{ flex: 1, fontSize: 13.5, color: COLORS.text }}>{check.title}</span>
      </div>
      {open && hasFix && (
        <div style={{ padding: "0 24px 16px 62px", fontSize: 13, color: COLORS.textMuted }}>
          {check.message && <p style={{ margin: "0 0 8px 0" }}>{check.message}</p>}
          {check.fix && <div style={{ padding: "10px 14px", background: COLORS.accentDim, borderRadius: 8 }}><strong style={{ color: COLORS.accent }}>Fix: </strong>{check.fix}</div>}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ id, data, unlocked }) {
  const meta = CATEGORY_META[id] || { icon: "globe", label: id };
  const passed = data.checks.filter((c) => c.status === "pass" || c.status === "info").length;
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${COLORS.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={meta.icon} size={20} color={COLORS.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 15 }}>{meta.label}</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: COLORS.accent }}>{data.score}</span>
          </div>
          <div style={{ height: 4, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${data.score}%`, height: "100%", background: COLORS.accent }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: COLORS.textMuted }}>{passed}/{data.checks.length} passed</div>
        </div>
      </div>
      {unlocked && <div style={{ borderTop: `1px solid ${COLORS.border}` }}>{data.checks.map((check, i) => <CheckRow key={check.id || i} check={check} />)}</div>}
    </div>
  );
}

function EmailGate({ onSubmit }) {
  const [email, setEmail] = useState("");
  return (
    <div style={{ background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.bg})`, border: `1px solid ${COLORS.accent}40`, borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: COLORS.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon name="mail" size={22} color={COLORS.accent} /></div>
      <h3 style={{ color: COLORS.text, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Enter your email to receive the full Dx Report</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text }} />
        <button onClick={() => email && onSubmit(email)} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: COLORS.accent, color: COLORS.bg, fontWeight: 700, opacity: email ? 1 : 0.5 }}>Unlock</button>
      </div>
    </div>
  );
}

function TopIssues({ issues }) {
  if (!issues?.length) return null;
  return <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>{issues.slice(0, 5).map((issue, i) => <CheckRow key={issue.id || i} check={issue} />)}</div>;
}

function ScanLoader() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto 24px", border: `3px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.accent}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: COLORS.text, fontSize: 18, fontWeight: 600 }}>Diagnosing...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function generateDemoData(url) {
  const makeCheck = (id, title, severity, status, message, fix) => ({ id, title, severity, status, message, ...(fix ? { fix } : {}) });
  const categories = {
    seo: { score: 78, checks: [makeCheck("title", "Title tag", "high", "pass", "Title found"), makeCheck("schema", "Schema", "high", "fail", "Schema missing", "Add JSON-LD")] },
    performance: { score: 65, checks: [makeCheck("img", "Images", "medium", "warn", "Large images", "Compress images")] },
    security: { score: 72, checks: [makeCheck("ssl", "SSL", "critical", "pass", "SSL valid")] },
    accessibility: { score: 68, checks: [makeCheck("alt", "Alt text", "medium", "warn", "Missing alt")] },
    aiVisibility: { score: 55, checks: [makeCheck("llms", "llms.txt", "high", "fail", "No llms.txt", "Create /llms.txt")] },
    eeat: { score: 60, checks: [makeCheck("author", "Author Bio", "high", "fail", "No author bio", "Add bio")] },
    qfo: { score: 62, checks: [makeCheck("coverage", "QFO coverage", "medium", "warn", "Partial coverage", "Expand content")] },
  };
  const globalScore = 66;
  const grade = "D";
  const topIssues = Object.values(categories).flatMap((c) => c.checks.filter((x) => x.status !== "pass"));
  return { globalScore, grade, categories, topIssues, totalChecks: 8, passedChecks: 2, url };
}

export default function AuthorityDxApp() {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleScan = async () => {
    if (!url) return;
    let cleanUrl = url.trim();
    if (!/^https?:\/\//.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
    setScanning(true);
    setResults(null);
    setUnlocked(false);
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 1500));
      setResults(generateDemoData(cleanUrl));
      setScanning(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/scan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: cleanUrl, keyword: keyword.trim() || undefined }) });
      if (!res.ok) {
        throw new Error(`Scan failed (${res.status})`);
      }
      const data = await res.json();
      setResults({ ...data, url: cleanUrl });
    } catch {
      alert("Scan failed. Please try again.");
    }
    setScanning(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Geist', -apple-system, sans-serif" }}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ display: "flex", gap: 8, background: COLORS.card, padding: 8, borderRadius: 14, border: `1px solid ${COLORS.border}`, marginBottom: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, paddingLeft: 12 }}>
            <Icon name="globe" size={18} color={COLORS.textDim} />
            <input ref={inputRef} type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleScan()} placeholder="Enter website URL..." style={{ flex: 1, padding: "12px 0", background: "transparent", border: "none", color: COLORS.text, outline: "none" }} />
          </div>
          <button onClick={handleScan} disabled={scanning || !url} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: scanning ? COLORS.border : COLORS.accent, color: scanning ? COLORS.textMuted : COLORS.bg, fontWeight: 700 }}>
            {scanning ? "Diagnosing..." : "Get Dx Score"}
          </button>
        </div>
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Target keyword for Query Fan-Out (optional)" style={{ width: "100%", padding: "8px 12px", background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 10, marginBottom: 24 }} />
        {scanning && <ScanLoader />}
        {results && (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
              <ScoreRing score={results.globalScore} grade={results.grade} />
            </div>
            <div style={{ marginBottom: 16 }}><TopIssues issues={results.topIssues} /></div>
            {!unlocked && <div style={{ marginBottom: 16 }}><EmailGate onSubmit={() => setUnlocked(true)} /></div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(results.categories).map(([id, data]) => <CategoryCard key={id} id={id} data={data} unlocked={unlocked} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
