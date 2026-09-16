import React, { useState, useEffect, Suspense } from "react";
import { Search, Folder, Network, Hash, FileText, Home } from "lucide-react";

export function PrimaryButton({ onClick, children }: { onClick?: () => void; children: string }) {
  return (
    <button className="btn-primary" onClick={onClick}>
      {children}
    </button>
  );
}

export function IntelIndicator({ label, value, position, danger = false, success = false, docked = false }: { label: string, value: string, position?: React.CSSProperties, danger?: boolean, success?: boolean, docked?: boolean }) {
  let colorClass = '';
  if (danger) colorClass = 'text-critical';
  if (success) colorClass = 'text-safe';
  
  return (
    <div className={docked ? `glass-card flex-col` : `intel-indicator`} style={position}>
      <span className="intel-label">{label}</span>
      <strong className={`intel-value ${colorClass}`}>{value}</strong>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { fetchCase } from "./api";
import "./AtmosHomePage.css";

const ThreatSphere3D = React.lazy(() => import("./ThreatSphere3D"));
const AnalyzePanel = React.lazy(() => import("./Panels").then(m => ({ default: m.AnalyzePanel })));
const CasesPanel = React.lazy(() => import("./Panels").then(m => ({ default: m.CasesPanel })));
const AttackGraphPanel = React.lazy(() => import("./Panels").then(m => ({ default: m.AttackGraphPanel })));
const IOCsPanel = React.lazy(() => import("./Panels").then(m => ({ default: m.IOCsPanel })));
const ReportsPanel = React.lazy(() => import("./Panels").then(m => ({ default: m.ReportsPanel })));

const DashboardSidebar = React.memo(({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <aside className="dashboard-sidebar">
    <div className="sidebar-logo">ES</div>
    <nav className="sidebar-nav">
      {[
        { id: "ANALYZE", icon: Search },
        { id: "CASES", icon: Folder },
        { id: "ATTACK GRAPH", icon: Network },
        { id: "IOCs", icon: Hash },
        { id: "REPORTS", icon: FileText }
      ].map(item => (
        <button
          key={item.id}
          className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
          title={item.id}
          aria-label={item.id}
        >
          <item.icon size={20} strokeWidth={2.5} />
        </button>
      ))}
    </nav>
    <div className="sidebar-bottom">
      <button className="sidebar-btn" onClick={() => setActiveTab("HOME")} title="Home" aria-label="Home">
        <Home size={20} strokeWidth={2.5} />
      </button>
    </div>
  </aside>
));

export function AtmosHomePage() {
  const [activeTab, setActiveTab] = useState("HOME");
  const [activeCase, setActiveCase] = useState<string | null>(() => {
    return localStorage.getItem("activeCase");
  });
  const navigate = useNavigate();

  const [activeCaseDetail, setActiveCaseDetail] = useState<any>(null);

  useEffect(() => {
    if (activeCase) {
      localStorage.setItem("activeCase", activeCase);
      fetchCase(activeCase)
        .then(res => setActiveCaseDetail(res))
        .catch(err => console.error("Failed to fetch active case for indicator", err));
    } else {
      localStorage.removeItem("activeCase");
      setActiveCaseDetail(null);
    }
  }, [activeCase]);

  const sparks = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        delay: `${(i % 8) * 0.35}s`,
      })),
    []
  );

  const navItems = ["ANALYZE", "CASES", "ATTACK GRAPH", "IOCs", "REPORTS"];

  if (activeTab === "HOME") {
    return (
      <div className="atmos single-viewport">
        <header className="nav">
          <a className="wordmark" href="#top" onClick={(e) => { e.preventDefault(); setActiveTab("HOME"); }}>
            E-KAVACH
          </a>
          <div className="nav-center">
            {navItems.map(item => (
              <button 
                key={item} 
                className={`nav-btn ${activeTab === item ? 'active' : ''}`}
                onClick={() => setActiveTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="nav-right">
            <span className="status">
              <i />
              System active
            </span>
            <PrimaryButton onClick={() => setActiveTab("ANALYZE")}>NEW SCAN</PrimaryButton>
            <div className="flex-row" style={{ background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginLeft: '16px' }}>
              <button 
                style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', color: 'white', cursor: 'default', fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}
              >
                REGULAR MODE
              </button>
              <button 
                onClick={() => navigate("/business")} 
                style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}
              >
                BUSINESS MODE
              </button>
            </div>
          </div>
        </header>

        <section className="hero full-height" id="top">
          <Suspense fallback={null}>
          <ThreatSphere3D />
        </Suspense>
          
          <div className="hero-glow" />
          {sparks.map((spark, i) => (
            <span
              key={i}
              className="spark"
              style={{ left: spark.left, top: spark.top, animationDelay: spark.delay } as React.CSSProperties}
            />
          ))}

          <IntelIndicator label="THREAT SCORE" value="98/100" position={{ top: "22%", left: "6%" }} danger />
          <IntelIndicator label="AUTH PROTOCOLS" value="SPF/DKIM: FAIL" position={{ top: "35%", right: "6%" }} danger />
          <IntelIndicator label="IOC DETECTED" value="12" position={{ bottom: "28%", left: "8%" }} danger />
          <IntelIndicator label="CAMPAIGN CORRELATED" value="APT-29" position={{ bottom: "20%", right: "8%" }} />
          <IntelIndicator label="FORENSIC STATUS" value="READY" position={{ top: "12%", right: "12%" }} />

          <div className="hero-content">
            <p className="eyebrow">AI-POWERED CYBER FORENSICS</p>
            <h1 className="hero-logo">
              DETECT.<br />
              TRACE.<br />
              PROTECT.
            </h1>
            <p className="hero-supporting">AI-powered email threat detection, cyber forensics &amp; threat intelligence.</p>
            <div className="hero-ctas">
              <PrimaryButton onClick={() => setActiveTab("ANALYZE")}>ANALYZE AN EMAIL</PrimaryButton>
              <button className="btn-secondary" onClick={() => setActiveTab("CASES")}>EXPLORE PLATFORM</button>
            </div>
            <p className="hero-small-text">From suspicious email to actionable evidence.</p>
          </div>
        </section>
      </div>
    );
  }

  // Dashboard Shell
  return (
    <div className="atmos dashboard-layout">
      {/* Background Sphere fixed behind everything */}
      <div className="dashboard-bg-layer">
        <Suspense fallback={null}>
          <ThreatSphere3D isBackground />
        </Suspense>
      </div>

      <div style={{ position: 'absolute', top: '16px', right: '24px', zIndex: 100, display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="flex-row" style={{ background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', color: 'white', cursor: 'default', fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}
          >
            REGULAR MODE
          </button>
          <button 
            onClick={() => navigate("/business")} 
            style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}
          >
            BUSINESS MODE
          </button>
        </div>
      </div>

      {activeCase && activeCaseDetail && activeTab !== "HOME" && (
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 100 }}>
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--accent)', minWidth: '200px' }}>
            <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE CASE</span>
            <span style={{ fontSize: '14px', color: 'var(--white)', fontWeight: 600 }}>{activeCase}</span>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '4px', gap: '2px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                Email: {activeCaseDetail.trace?.headers?.Subject || 'Unknown Subject'}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                Threat Score: {activeCaseDetail.assertion?.threat_score || 0}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                Status: {activeCaseDetail.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </div>
      )}

      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="dashboard-main-content">
        <Suspense fallback={<div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--accent)' }}>Loading panel...</div>}>
          {activeTab === "ANALYZE" && <AnalyzePanel activeCase={activeCase} setActiveCase={setActiveCase} />}
          {activeTab === "CASES" && <CasesPanel activeCase={activeCase} setActiveCase={setActiveCase} />}
          {activeTab === "ATTACK GRAPH" && <AttackGraphPanel activeCase={activeCase} />}
          {activeTab === "IOCs" && <IOCsPanel activeCase={activeCase} />}
          {activeTab === "REPORTS" && <ReportsPanel activeCase={activeCase} />}
        </Suspense>
      </main>
    </div>
  );

}
