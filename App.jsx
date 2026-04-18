import { useState, useEffect, useRef, useReducer } from "react";

const initialState = {
  scanning: false, results: null, progress: "", scanMessage: null,
  citabilityData: null, unlocked: false,
  user: null, page: "scan", reportDomain: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "SCAN_START": return { ...state, scanning: true, results: null, progress: "Fetching your site...", scanMessage: null, citabilityData: null, page: "scan" };
    case "SCAN_PROGRESS": return { ...state, progress: action.progress };
    case "SCAN_DONE": return { ...state, scanning: false, results: action.results, scanMessage: action.scanMessage || null };
    case "SCAN_FAIL": return { ...state, scanning: false };
    case "SET_CITABILITY": return { ...state, citabilityData: action.data };
    case "AUTH": return { ...state, user: action.user, unlocked: !!action.user };
    case "LOGOUT": return { ...state, user: null, unlocked: false };
    case "NAV": return { ...state, page: action.page, reportDomain: action.reportDomain || state.reportDomain };
    default: return state;
  }
}
import { C } from "./shared/constants.js";
import { getDxScore, clampScore, sc, isValidEmail, normalizeAndValidateUrl } from "./shared/helpers.js";
import { apiFetch, getToken, setToken, clearToken, API_URL } from "./shared/api.js";
import { Icon, ScoreRing, SubScore } from "./ui.jsx";
import { CategoryCard, CheckRow, TopIssues, DiagnosticBridge, MaturityTimeline, ScanProgress, ResultCTAs, AuthorityBrief } from "./scan-results.jsx";
import { AiVisibilityCheck, PerModelDiagnostics, HallucinationDisplay } from "./ai-diagnostics.jsx";
import { EmailGate } from "./auth.jsx";
import { ScanHistoryPage, PublicReportPage, RadarPage, ReportSuccessPage, MonitorSuccessPage, AdminPage } from "./pages.jsx";

const DEMO_MODE = typeof window !== "undefined" && window.__DX_DEMO__ === true;

export default function AuthorityDxApp() {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [archetype, setArchetype] = useState("");
  const [geolocation, setGeolocation] = useState("");
  const [state, dispatch] = useReducer(reducer, initialState);
  const { scanning, results, progress, scanMessage, citabilityData, unlocked, user, page, reportDomain } = state;
  const inputRef = useRef(null);
  const scanAbortRef = useRef(null);

  // Check for auth token on mount + Google callback
  useEffect(() => {
    // Google OAuth callback — token in fragment (not query string, for security)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const callbackToken = hashParams.get("token");
    if (callbackToken) {
      setToken(callbackToken);
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Check for report URL pattern
    const path = window.location.pathname;
    const reportMatch = path.match(/^\/report\/(.+)$/);
    if (reportMatch) {
      dispatch({ type: "NAV", page: "report", reportDomain: reportMatch[1] });
    }

    // Check for post-payment success pages
    if (path === "/report-success") dispatch({ type: "NAV", page: "report-success" });
    if (path === "/monitor-success") dispatch({ type: "NAV", page: "monitor-success" });

    const token = getToken();
    if (token) {
      apiFetch("/api/auth/me").then(d => {
        if (d.user) dispatch({ type: "AUTH", user: d.user });
        else clearToken();
      }).catch(() => clearToken());
    }

    inputRef.current?.focus();
  }, []);

  const handleScan = async () => {
    if (!url) return;
    const u = normalizeAndValidateUrl(url);
    if (!u) { alert("Please enter a valid URL (e.g. example.com)"); return; }

    // Cancel previous scan
    if (scanAbortRef.current) scanAbortRef.current.abort();
    const abort = new AbortController();
    scanAbortRef.current = abort;

    const scanArchetype = archetype || "SaaS";
    const scanGeo = geolocation;
    setArchetype(scanArchetype);
    dispatch({ type: "SCAN_START" });

    if (DEMO_MODE) {
      setTimeout(() => dispatch({ type: "SCAN_PROGRESS", progress: "Running Technical SEO checks..." }), 1500);
      setTimeout(() => dispatch({ type: "SCAN_PROGRESS", progress: "Analyzing E-E-A-T signals..." }), 3000);
      setTimeout(() => dispatch({ type: "SCAN_PROGRESS", progress: "Checking AI engine visibility..." }), 4500);
      await new Promise(r => setTimeout(r, 5500));
      dispatch({ type: "SCAN_DONE", results: demoData(u) });
      dispatch({ type: "SET_CITABILITY", data: {
        perModelDiagnostics: [
          { engine: "ChatGPT", found: true, primaryFactor: "Review signals and brand recognition", checkConnections: [
            { checkId: "review-schema", label: "Review Schema", impact: "high" },
            { checkId: "review-signals", label: "Third-Party Reviews", impact: "high" },
            { checkId: "comparison-content", label: "Comparison Content", impact: "medium" },
          ]},
          { engine: "Claude", found: false, primaryFactor: "Documentation depth and technical accuracy", checkConnections: [
            { checkId: "doc-depth", label: "Documentation Depth", impact: "high" },
            { checkId: "citability", label: "Citability Score", impact: "high" },
            { checkId: "semantic-html", label: "Semantic HTML", impact: "medium" },
          ]},
          { engine: "Perplexity", found: false, primaryFactor: "Content freshness and source authority", checkConnections: [
            { checkId: "content-freshness", label: "Content Freshness", impact: "critical" },
            { checkId: "ai-citation-ready", label: "Citation Readiness", impact: "high" },
            { checkId: "ai-bots", label: "AI Bot Access", impact: "high" },
          ]},
          { engine: "Google AI Overview", found: true, primaryFactor: "Location signals and structured data", checkConnections: [
            { checkId: "schema", label: "Schema Markup", impact: "high" },
            { checkId: "faq-schema", label: "FAQ Schema", impact: "high" },
          ]},
        ],
        hallucinations: { count: 1, hallucinations: [
          { engine: "ChatGPT", claim: "Offers a 14-day free trial with no credit card required", reality: "Site does not mention any free trial on pricing or homepage" },
        ]},
      }});
      return;
    }

    try {
      dispatch({ type: "SCAN_PROGRESS", progress: "Running 8-module diagnosis..." });
      const data = await apiFetch("/api/scan", {
        method: "POST", signal: abort.signal,
        body: JSON.stringify({ url: u, keyword: keyword.trim() || undefined, archetype: scanArchetype, geolocation: scanGeo, email: user?.email, newsletter: true }),
      });
      if (abort.signal.aborted) return;
      if (!data.success) { alert(data.error || "Scan failed"); dispatch({ type: "SCAN_FAIL" }); return; }
      dispatch({ type: "SCAN_DONE", results: { ...data, url: u }, scanMessage: data.scanMessage });

      // Background: AI Citability
      try {
        const domain = new URL(u).hostname.replace("www.", "");
        apiFetch("/api/ai-citability", {
          method: "POST", signal: abort.signal,
          body: JSON.stringify({ url: u, brand: domain.split(".")[0] }),
        }).then(cd => {
          if (!abort.signal.aborted && cd?.success) dispatch({ type: "SET_CITABILITY", data: cd });
        }).catch(() => {});
      } catch { /* non-critical */ }
    } catch (err) {
      if (err.name !== "AbortError") alert(`Scan failed: ${err.message || "Network error"}`);
      dispatch({ type: "SCAN_FAIL" });
    }
  };

  const handleEmailSubmit = async (email, password) => {
    if (DEMO_MODE) { dispatch({ type: "AUTH", user: { email, role: "user" } }); return; }
    if (!isValidEmail(email)) { alert("Please enter a valid email address."); return; }

    if (password) {
      if (password.length < 6) { alert("Password must be at least 6 characters."); return; }
      const data = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      if (data.token) {
        setToken(data.token); dispatch({ type: "AUTH", user: data.user });
      } else {
        const loginData = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        if (loginData.token) { setToken(loginData.token); dispatch({ type: "AUTH", user: loginData.user }); }
        else { alert(loginData.error || data.error || "Authentication failed"); }
      }
    } else {
      dispatch({ type: "AUTH", user: { email, role: "guest" } });
    }
  };

  const handleLogout = () => { clearToken(); dispatch({ type: "LOGOUT" }); dispatch({ type: "NAV", page: "scan" }); };

  const isAdmin = user?.role === "admin";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Geist','Inter','Segoe UI',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => dispatch({ type: "NAV", page: "scan" })}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="globe" size={16} color={C.accent} />
          </div>
          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 15 }}>
            <span style={{ color: C.accent }}>Authority</span>Dx
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <>
              <button onClick={() => dispatch({ type: "NAV", page: "history" })} style={{ background: "none", border: "none", color: page === "history" ? C.accent : C.textDim, cursor: "pointer", fontSize: 11 }}>
                <Icon name="clock" size={16} color={page === "history" ? C.accent : C.textDim} />
              </button>
              <button onClick={() => dispatch({ type: "NAV", page: "radar" })} style={{ background: "none", border: "none", color: page === "radar" ? C.accent : C.textDim, cursor: "pointer", fontSize: 11 }}>
                <Icon name="barChart" size={16} color={page === "radar" ? C.accent : C.textDim} />
              </button>
              {isAdmin && (
                <button onClick={() => dispatch({ type: "NAV", page: "admin" })} style={{ background: "none", border: "none", color: page === "admin" ? C.accent : C.textDim, cursor: "pointer" }}>
                  <Icon name="settings" size={16} color={page === "admin" ? C.accent : C.textDim} />
                </button>
              )}
              <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="logout" size={16} color={C.textDim} />
              </button>
            </>
          )}
          {!user && <span style={{ fontSize: 11, color: C.textDim }}>Diagnose. Fix. Rank.</span>}
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Page routing */}
        {page === "history" && user && <ScanHistoryPage user={user} />}
        {page === "radar" && user && <RadarPage user={user} />}
        {page === "admin" && isAdmin && <AdminPage />}
        {page === "report" && reportDomain && <PublicReportPage domain={reportDomain} />}
        {page === "report-success" && <ReportSuccessPage onBack={() => dispatch({ type: "NAV", page: "scan" })} />}
        {page === "monitor-success" && <MonitorSuccessPage onBack={() => dispatch({ type: "NAV", page: "scan" })} />}

        {page === "scan" && (
          <>
            {/* Hero */}
            {!results && !scanning && (
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                  Diagnose your website's<br /><span style={{ color: C.accent }}>authority gap</span>
                </h1>
                <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>8 modules. 100+ checks. One score.</p>
              </div>
            )}

            {/* URL Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: results ? 24 : 0 }}>
              <div style={{ display: "flex", gap: 8, background: C.card, padding: 8, borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, paddingLeft: 12 }}>
                  <Icon name="globe" size={18} color={C.textDim} />
                  <input ref={inputRef} type="text" value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleScan()} placeholder="Enter website URL"
                    style={{ flex: 1, padding: "12px 0", background: "transparent", border: "none", color: C.text, fontSize: 15, outline: "none" }} />
                </div>
                <button onClick={handleScan} disabled={scanning || !url}
                  style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: scanning ? C.textDim : C.accent, color: C.bg, fontWeight: 700, fontSize: 14, cursor: scanning ? "not-allowed" : "pointer" }}>
                  {scanning ? "Diagnosing..." : results ? "Re-scan" : "Get Dx Score"}
                </button>
              </div>
              {!results && !scanning && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 20 }}>
                  <Icon name="target" size={14} color={C.textDim} />
                  <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Optional: main keyword for QFO analysis"
                    style={{ flex: 1, padding: "8px 0", background: "transparent", border: "none", color: C.textMuted, fontSize: 13, outline: "none" }} />
                </div>
              )}
            </div>

            {/* Scanning */}
            {scanning && <ScanProgress progress={progress} archetype={archetype} onArchetype={setArchetype} geolocation={geolocation} onGeolocation={setGeolocation} />}

            {/* Results */}
            {results && (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, marginTop: 24 }}>
                  <ScoreRing score={getDxScore(results) ?? 0} grade={results.grade || "?"} size={160} />
                  <div style={{ marginTop: 12, padding: "4px 12px", borderRadius: 6, background: C.accentDim, fontSize: 11, color: C.accent, fontWeight: 600, letterSpacing: "0.08em" }}>
                    Authority Dx Score
                  </div>
                  <p style={{ color: C.textDim, fontSize: 12, margin: "8px 0 0", fontFamily: "monospace" }}>{results.totalChecks} checks · {results.passedChecks} passed · {results.duration || ""}</p>
                </div>

                {results.scores && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 24, background: C.card, borderRadius: 12, padding: "20px 16px", border: `1px solid ${C.border}` }}>
                    <SubScore label="Technical Health" score={results.scores.technicalHealth} />
                    <div style={{ width: 1, background: C.border }} />
                    <SubScore label="Trust Score" score={results.scores.trust} />
                    <div style={{ width: 1, background: C.border }} />
                    <SubScore label="AI Readiness" score={results.scores.aiReadiness} />
                    {results.scores.architecture != null && <>
                      <div style={{ width: 1, background: C.border }} />
                      <SubScore label="Architecture" score={results.scores.architecture} />
                    </>}
                  </div>
                )}

                {results.aiVisibility && <div style={{ marginBottom: 24 }}><AiVisibilityCheck data={results.aiVisibility} /></div>}
                {results.maturity && <div style={{ marginBottom: 24 }}><MaturityTimeline maturity={results.maturity} /></div>}
                {results.topIssues?.length > 0 && <div style={{ marginBottom: 24 }}><TopIssues issues={results.topIssues} /></div>}

                {scanMessage && <div style={{ padding: 16, borderRadius: 10, background: C.warnDim, color: C.warn, fontSize: 13, marginBottom: 24 }}>{scanMessage}</div>}

                {!unlocked && <div style={{ marginBottom: 24 }}><EmailGate onSubmit={handleEmailSubmit} /></div>}

                {unlocked && (
                  <>
                    <AuthorityBrief results={results} />
                    {results.diagnosticBridge && <DiagnosticBridge bridge={results.diagnosticBridge} />}
                    {citabilityData?.perModelDiagnostics && (
                      <PerModelDiagnostics diagnostics={citabilityData.perModelDiagnostics} scanCategories={results.categories} />
                    )}
                    {citabilityData?.hallucinations?.count > 0 && (
                      <HallucinationDisplay data={citabilityData.hallucinations} />
                    )}
                    {/* #5 — guard categories */}
                    {results.categories && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                      {Object.entries(results.categories).map(([id, data]) => (
                        data?.checks ? <CategoryCard key={id} id={id} data={data} unlocked={true} /> : null
                      ))}
                    </div>
                    )}
                    <ResultCTAs scanId={results.scanId} user={user} />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, textAlign: "center", fontSize: 12, color: C.textDim }}>
        AuthorityDx — 100+ checks, 8 modules, your Authority Dx Score. Diagnose. Fix. Rank.
      </footer>
    </div>
  );
}

/* ═══ Demo Data ═══ */
function demoData(url) {
  const mk = (id, title, sev, status, msg, fix) => ({ id, title, severity: sev, status, message: msg, fix });
  const seoChecks = [
    mk("title-tag","Title Tag","critical","pass","Title tag found (54 chars)"),
    mk("meta-desc","Meta Description","high","warn","Meta description is 38 chars.","Write 120-160 chars."),
    mk("schema","Schema Markup","high","fail","No structured data found.","Add JSON-LD schema."),
    mk("sitemap","XML Sitemap","high","fail","No sitemap.xml found.","Create and submit sitemap."),
  ];
  const aiChecks = [
    mk("llms-txt","llms.txt File","medium","warn","No /llms.txt found.","Create /llms.txt."),
    mk("ai-bots","AI Bot Access","high","warn","2 AI bots blocked.","Allow AI crawlers."),
    mk("waf-block","WAF Silent Block","info","pass","No silent WAF blocking."),
    mk("content-freshness","Content Freshness","high","warn","Content 95 days old.","Update within 30 days."),
    mk("review-schema","Review Schema","medium","warn","No review schema.","Add AggregateRating."),
    mk("comparison-content","Comparison Content","medium","warn","No comparison content.","Add vs pages."),
    mk("ai-citation-ready","AI Citation Readiness","medium","warn","33% citation readiness.","Improve all signals."),
  ];
  const categories = {
    seo: { name:"Technical SEO", score: 62, checks: seoChecks },
    performance: { name:"Performance", score: 71, checks: [mk("ttfb","TTFB","high","pass","180ms")] },
    security: { name:"Security", score: 45, checks: [mk("ssl","SSL","critical","pass","Valid SSL"),mk("hsts","HSTS","high","fail","No HSTS.","Add header.")] },
    accessibility: { name:"Accessibility", score: 68, checks: [mk("alt-text","Alt Text","high","warn","3 images missing alt.","Add alt text.")] },
    aiVisibility: { name:"AI Visibility", score: 38, checks: aiChecks },
    eeat: { name:"E-E-A-T", score: 35, checks: [mk("author-bio","Author Bio","high","fail","No author bio.","Add bio.")], pillars: { experience: 30, expertise: 40, authoritativeness: 25, trust: 45 } },
    qfo: { name:"Query Fan-Out", score: 55, checks: [mk("qfo-global","Global Coverage","medium","warn","40% coverage.","Add more angles.")] },
    linkQuality: { name:"Link Quality", score: 72, checks: [mk("outbound-ratio","Outbound Ratio","medium","pass","32% external.")] },
  };
  const scores = { technicalHealth: 62, trust: 42, aiReadiness: 44 };
  const dxScore = Math.round(scores.technicalHealth * 0.25 + scores.trust * 0.35 + scores.aiReadiness * 0.40);
  return {
    globalScore: dxScore, dxScore, grade: dxScore >= 90 ? "A" : dxScore >= 80 ? "B" : dxScore >= 70 ? "C" : dxScore >= 50 ? "D" : "F",
    scores, categories, duration: "5.2s",
    maturity: { categories: { seo: { year: 2024, label: "Post-HCU" }, security: { year: 2020, label: "Basic HTTPS" }, aiVisibility: { year: 2024, label: "Emerging" }, eeat: { year: 2021, label: "Pre-EEAT" }, linkQuality: { year: 2024, label: "Aware Linking" } }, summary: { averageYear: 2022, gap: 4, oldestDimension: { category: "security", year: 2020 }, newestDimension: { category: "seo", year: 2024 } } },
    topIssues: [
      mk("schema","Schema Markup","high","fail","No structured data.","Add JSON-LD."),
      mk("hsts","HSTS Header","high","fail","No HSTS.","Add header."),
      mk("author-bio","Author Bio","high","fail","No author bio.","Add bio with credentials."),
    ],
    diagnosticBridge: [
      { checkId: "schema", title: "Schema Markup", severity: "high", message: "No structured data.", bridge: { checklist: ["Add JSON-LD to <head>", "Validate at schema.org"], codeSnippet: '<script type="application/ld+json">{"@type":"WebSite"}</script>' } },
      { checkId: "hsts", title: "HSTS Header", severity: "high", message: "No HSTS.", bridge: { checklist: ["Add Strict-Transport-Security header"], codeSnippet: 'add_header Strict-Transport-Security "max-age=31536000"' } },
    ],
    archetypeContext: "As a SaaS product, your AI discoverability directly impacts trial signups.",
    aiVisibility: { mentioned: 2, total: 6, totalMentions: 5, totalQueries: 24, engines: [
      { name: "ChatGPT", provider: "OpenAI", found: true, mentionedIn: 3, totalAngles: 4, angles: [{ type: "direct", found: true },{ type: "problem", found: true },{ type: "alternative", found: true },{ type: "recommendation", found: false }] },
      { name: "Claude", provider: "Anthropic", found: false, mentionedIn: 0, totalAngles: 4, angles: [{ type: "direct", found: false },{ type: "problem", found: false },{ type: "alternative", found: false },{ type: "recommendation", found: false }] },
      { name: "Gemini", provider: "Google", found: true, mentionedIn: 2, totalAngles: 4, angles: [{ type: "direct", found: true },{ type: "problem", found: false },{ type: "alternative", found: true },{ type: "recommendation", found: false }] },
      { name: "Perplexity", provider: "Perplexity", found: false, mentionedIn: 0, totalAngles: 4, angles: [{ type: "direct", found: false },{ type: "problem", found: false },{ type: "alternative", found: false },{ type: "recommendation", found: false }] },
    ]},
    totalChecks: 19, passedChecks: 7, scanId: 1, archetype: "SaaS",
  };
}
