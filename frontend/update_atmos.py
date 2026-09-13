import re

with open('src/AtmosHomePage.tsx', 'r') as f:
    content = f.read()

# Make IntelIndicator exported
content = content.replace(
    "function IntelIndicator({ label, value, position, danger = false }: { label: string, value: string, position: CSSProperties, danger?: boolean }) {",
    "export function IntelIndicator({ label, value, position, danger = false, docked = false }: { label: string, value: string, position?: React.CSSProperties, danger?: boolean, docked?: boolean }) {"
)

content = content.replace(
    "<div className={`intel-indicator ${danger ? 'danger' : ''}`} style={position}>",
    "<div className={docked ? `glass-card flex-col ${danger ? 'danger-card' : ''}` : `intel-indicator ${danger ? 'danger' : ''}`} style={position}>"
)

# Replace the main return with conditional
main_render = """
  // Dashboard sidebar icons
  const DashboardSidebar = () => (
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
  );

  if (activeTab === "HOME") {
    return (
      <div className="atmos single-viewport">
        <header className="nav">
          <a className="wordmark" href="#top" onClick={(e) => { e.preventDefault(); setActiveTab("HOME"); }}>
            ESecure
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
          </div>
        </header>

        <section className="hero full-height" id="top">
          <ThreatSphere3D />
          
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
    <div className="dashboard-layout">
      {/* Background Sphere fixed behind everything */}
      <div className="dashboard-bg-layer">
        <ThreatSphere3D />
      </div>

      <DashboardSidebar />
      <main className="dashboard-main-content">
        {activeTab === "ANALYZE" && <AnalyzePanel />}
        {activeTab === "CASES" && <CasesPanel />}
        {activeTab === "ATTACK GRAPH" && <AttackGraphPanel />}
        {activeTab === "IOCs" && <IOCsPanel />}
        {activeTab === "REPORTS" && <ReportsPanel />}
      </main>
    </div>
  );
"""

# Replace the whole return
start_idx = content.find("return (\n    <div className=\"atmos single-viewport\">")
if start_idx != -1:
    content = content[:start_idx] + main_render + "\n}\n"

# Add Lucide imports at the top
lucide_imports = 'import { Search, Folder, Network, Hash, FileText, Home } from "lucide-react";\n'
content = lucide_imports + content

# Fix CSSProperties issue
content = content.replace("import { useMemo, useState, useRef, type CSSProperties } from \"react\";", "import React, { useMemo, useState, useRef } from \"react\";")

with open('src/AtmosHomePage.tsx', 'w') as f:
    f.write(content)
