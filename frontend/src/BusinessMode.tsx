import React, { useState, useEffect } from "react";
import { Network, Activity, Users, Home, ShieldAlert, FileText, UploadCloud, Search, Shield, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchCases, analyzeFile, fetchCase } from "./api";
import { AnalysisResultView } from "./Panels";
import { CurveChart } from "./components/CurveChart";
import { CircularProgress } from "./components/CircularProgress";
import "./AtmosHomePage.css"; 

const BusinessSidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const navigate = useNavigate();

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo">BM</div>
      <nav className="sidebar-nav">
        {[
          { id: "OVERVIEW", icon: Activity, title: "Overview" },
          { id: "ANALYZE_EMAIL", icon: UploadCloud, title: "Analyze Email" },
          { id: "ATTACK_PROGRESSION", icon: Network, title: "Attack Progression" },
          { id: "EMPLOYEE_RISK", icon: Users, title: "Employee Risk" },
          { id: "ANALYSIS_HISTORY", icon: FileText, title: "Analysis History" },
        ].map(item => (
          <button
            key={item.id}
            className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.title}
            aria-label={item.title}
          >
            <item.icon size={20} strokeWidth={2.5} />
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="sidebar-btn" onClick={() => navigate("/")} title="Back to Regular Mode" aria-label="Regular Mode">
          <Home size={20} strokeWidth={2.5} />
        </button>
      </div>
    </aside>
  );
};

export function BusinessMode() {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const navigate = useNavigate();

  return (
    <div className="atmos dashboard-layout">
      {/* Background Sphere replacement: keeping it flat for business mode */}
      <div className="dashboard-bg-layer" style={{ background: '#050a15', zIndex: -3, width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }} />
      
      <div style={{ position: 'absolute', top: '16px', right: '24px', zIndex: 100 }}>
        <div className="flex-row" style={{ background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => navigate("/")} 
            style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}
          >
            REGULAR MODE
          </button>
          <button 
            style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', color: 'white', cursor: 'default', fontSize: '12px', fontWeight: 600, borderRadius: '4px' }}
          >
            BUSINESS MODE
          </button>
        </div>
      </div>

      <BusinessSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="dashboard-main-content">
        {activeTab === "OVERVIEW" && <BusinessOverview />}
        {activeTab === "ANALYZE_EMAIL" && <BusinessAnalyze />}
        {activeTab === "ATTACK_PROGRESSION" && <AttackProgression />}
        {activeTab === "EMPLOYEE_RISK" && <EmployeeRisk />}
        {activeTab === "ANALYSIS_HISTORY" && <BusinessHistory />}
      </main>
    </div>
  );
}

function BusinessOverview() {
  const [riskData, setRiskData] = useState<any[]>([]);
  const [progressionData, setProgressionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/v1/business/risk').then(r => r.json()),
      fetch('http://localhost:8000/api/v1/business/progression').then(r => r.json())
    ])
    .then(([risk, progression]) => {
      setRiskData(risk);
      setProgressionData(progression);
    })
    .finally(() => setLoading(false));
  }, []);

  const totalTargets = riskData.length;
  const criticalThreats = riskData.reduce((acc, curr) => acc + curr.critical_threats, 0);
  const totalRisk = riskData.reduce((acc, curr) => acc + curr.aggregate_risk, 0);
  const avgRisk = totalTargets > 0 ? (totalRisk / totalTargets).toFixed(1) : 0;
  const threatCount = riskData.reduce((acc, curr) => acc + curr.threat_count, 0);
  
  // Fake timeline data based on total threat count for the visual representation
  const curveData = progressionData.length > 0 
    ? progressionData.slice(-5).map(p => p.threat_score || 20) 
    : [20, 30, 40, 25, 50];

  return (
    <div className="dashboard-container dashboard-panel" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
        
        <div className="flex-between">
          <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600, letterSpacing: '-0.5px' }}>Organization Security Overview</h2>
        </div>
        
        {loading ? <div className="text-muted">Loading metrics...</div> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Threats Detected</span>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--white)' }}>{threatCount}</span>
              </div>
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Critical Threats</span>
                <span style={{ fontSize: '32px', fontWeight: 700, color: criticalThreats > 0 ? 'var(--danger)' : 'var(--white)' }}>{criticalThreats}</span>
              </div>
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Targets Identified</span>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--white)' }}>{totalTargets}</span>
              </div>
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Total Cases Processed</span>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--white)' }}>{progressionData.length}</span>
              </div>
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Overall Avg Risk</span>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--warning)' }}>{avgRisk}</span>
              </div>
            </div>

            <div className="card-grid" style={{ marginTop: '8px' }}>
              <div className="glass-card card-grid-span2 flex-col" style={{ padding: '24px', gap: '16px' }}>
                <h3 className="card-title text-muted">Threat Activity Over Time</h3>
                <div style={{ flex: 1, minHeight: '200px', display: 'flex', alignItems: 'center' }}>
                  <CurveChart dataPoints={curveData} labels={['T-4', 'T-3', 'T-2', 'T-1', 'Now']} color="#7da0ff" height={150} />
                </div>
              </div>

              <div className="glass-card flex-col" style={{ padding: '24px', gap: '16px' }}>
                <h3 className="card-title text-muted">Top Targets</h3>
                <div className="flex-col" style={{ gap: '12px' }}>
                  {riskData.slice().sort((a,b) => b.aggregate_risk - a.aggregate_risk).slice(0, 5).map((r, i) => (
                    <div key={i} className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--white)', fontSize: '14px', maxWidth: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{r.target}</span>
                      <span className="text-warning" style={{ fontSize: '14px', fontWeight: 600 }}>Risk: {r.aggregate_risk}</span>
                    </div>
                  ))}
                  {riskData.length === 0 && <span className="text-muted">No targets identified.</span>}
                </div>
              </div>

              <div className="glass-card flex-col" style={{ padding: '24px', gap: '16px' }}>
                <h3 className="card-title text-muted">Recent Threats</h3>
                <div className="flex-col" style={{ gap: '12px' }}>
                  {progressionData.slice().reverse().slice(0, 5).map((p, i) => (
                    <div key={i} className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <div className="flex-col">
                        <span style={{ color: 'var(--white)', fontSize: '14px' }}>{p.id}</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(p.timestamp).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-${p.severity === 'CRITICAL' || p.severity === 'HIGH' ? 'critical' : p.severity === 'MODERATE' ? 'warning' : 'safe'}`} style={{ fontSize: '12px', fontWeight: 600 }}>
                        {p.severity}
                      </span>
                    </div>
                  ))}
                  {progressionData.length === 0 && <span className="text-muted">No recent threats.</span>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BusinessAnalyze() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeFile(file);
      setResult(res);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Analysis failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container dashboard-panel flex-col" style={{ gap: '24px', padding: '24px', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600, letterSpacing: '-0.5px' }}>Analyze Email</h2>
      
      {!result ? (
        <div className="glass-card flex-col" style={{ gap: '24px', padding: '32px', maxWidth: '600px' }}>
          <div className="flex-col" style={{ gap: '8px', alignItems: 'center', textAlign: 'center' }}>
            <UploadCloud size={48} className="text-muted" style={{ marginBottom: '8px' }} />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--white)' }}>DROP .EML FILE HERE</h3>
            <span className="text-muted">or</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              BROWSE FILE
              <input type="file" accept=".eml" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </label>
            
            {file && (
              <div className="flex-col" style={{ alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 24px', borderRadius: '8px', width: '100%' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{file.name}</span>
                <span className="text-muted" style={{ fontSize: '12px' }}>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
            
            <button 
              className="btn-primary" 
              onClick={handleAnalyze} 
              disabled={!file || loading}
              style={{ width: '100%', marginTop: '16px' }}
            >
              {loading ? 'ANALYZING...' : 'ANALYZE EMAIL'}
            </button>
          </div>
          {error && <div style={{ color: 'var(--danger)', marginTop: '8px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        </div>
      ) : (
        <AnalysisResultView result={result} onNewScan={() => { setFile(null); setResult(null); }} />
      )}
    </div>
  );
}

function AttackProgression() {
  const [progression, setProgression] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/business/progression')
      .then(r => r.json())
      .then(setProgression)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container dashboard-panel" style={{ padding: '24px', background: 'transparent', border: 'none', boxShadow: 'none', overflowY: 'auto' }}>
       <h2 style={{ fontSize: '24px', margin: 0, marginBottom: '24px', fontWeight: 600 }}>Organizational Attack Progression</h2>
       {loading ? (
         <div className="glass-card flex-col" style={{ alignItems: 'center', padding: '48px', color: 'var(--muted)' }}>
           Loading progression data...
         </div>
       ) : (
         <div className="flex-col" style={{ gap: '16px', position: 'relative' }}>
           {/* Timeline connector line */}
           <div style={{ position: 'absolute', left: '24px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(125,160,255,0.2)' }} />
           
           {progression.map((p, idx) => (
             <div key={idx} className="glass-card flex-col" style={{ padding: '20px', gap: '16px', marginLeft: '48px', position: 'relative' }}>
               {/* Timeline node */}
               <div style={{ position: 'absolute', left: '-33px', top: '24px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent)', border: '3px solid #050a15' }} />
               
               <div className="flex-between">
                 <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
                   <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '16px' }}>{p.id}</span>
                   <span className={`text-${p.severity === 'CRITICAL' || p.severity === 'HIGH' ? 'critical' : p.severity === 'MODERATE' ? 'warning' : 'safe'}`} style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                     {p.severity}
                   </span>
                 </div>
                 <span className="text-muted" style={{ fontSize: '12px' }}>{new Date(p.timestamp).toLocaleString()}</span>
               </div>
               
               <div className="flex-row" style={{ alignItems: 'center', gap: '24px', fontSize: '14px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                 <div className="flex-col">
                   <span className="text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>ATTACK / CAMPAIGN</span>
                   <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.threat_type || 'Unknown'}</span>
                 </div>
                 <Network size={16} className="text-muted" />
                 <div className="flex-col">
                   <span className="text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>TARGET</span>
                   <span style={{ color: 'var(--white)' }}>{p.target}</span>
                 </div>
                 <Network size={16} className="text-muted" />
                 <div className="flex-col">
                   <span className="text-muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>RELATIONSHIP EVIDENCE</span>
                   <span>
                     {p.relationship === "Initial Target" ? (
                       <span className="text-safe" style={{ fontWeight: 500 }}>{p.relationship}</span>
                     ) : (
                       <span className="text-warning" style={{ fontWeight: 500 }}>
                         Potential Relationship: {p.relationship} 
                         {p.evidence && ` (${p.evidence})`}
                       </span>
                     )}
                   </span>
                 </div>
               </div>
             </div>
           ))}
           {progression.length === 0 && <div className="text-muted" style={{ marginLeft: '48px' }}>No attacks recorded yet.</div>}
         </div>
       )}
    </div>
  );
}

function EmployeeRisk() {
  const [riskData, setRiskData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/business/risk')
      .then(r => r.json())
      .then(data => {
        // Sort by risk descending
        setRiskData(data.sort((a: any, b: any) => b.aggregate_risk - a.aggregate_risk));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container dashboard-panel" style={{ padding: '24px', background: 'transparent', border: 'none', boxShadow: 'none', overflowY: 'auto' }}>
       <h2 style={{ fontSize: '24px', margin: 0, marginBottom: '24px', fontWeight: 600 }}>Employee & Department Exposure</h2>
       
       {loading ? <div className="text-muted">Loading risk data...</div> : (
         <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <thead>
               <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>TARGET</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>TARGET TYPE</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>LIKELY DEPARTMENT</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>THREATS</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>COMMON THREAT</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>RISK SCORE</th>
               </tr>
             </thead>
             <tbody>
               {riskData.map((row, idx) => (
                 <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <td style={{ padding: '16px 24px', color: 'var(--white)', fontWeight: 500 }}>{row.target}</td>
                   <td style={{ padding: '16px 24px' }}>
                     <span style={{ 
                       background: row.target_type === 'Likely Department' ? 'rgba(125,160,255,0.1)' : 'rgba(255,255,255,0.05)', 
                       color: row.target_type === 'Likely Department' ? 'var(--accent)' : 'var(--secondary)',
                       padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                     }}>
                       {row.target_type}
                     </span>
                   </td>
                   <td style={{ padding: '16px 24px', color: 'var(--muted)' }}>{row.likely_department || '-'}</td>
                   <td style={{ padding: '16px 24px', color: 'var(--white)' }}>{row.threat_count}</td>
                   <td style={{ padding: '16px 24px', color: 'var(--secondary)', fontSize: '13px' }}>{row.common_attack_type}</td>
                   <td style={{ padding: '16px 24px' }}>
                     <span className={`text-${row.aggregate_risk >= 80 ? 'critical' : row.aggregate_risk >= 40 ? 'warning' : 'safe'}`} style={{ fontWeight: 700, fontSize: '16px' }}>
                       {row.aggregate_risk}
                     </span>
                   </td>
                 </tr>
               ))}
               {riskData.length === 0 && (
                 <tr>
                   <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>No target exposure recorded.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       )}
    </div>
  );
}

function BusinessHistory() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch((e) => setError(e.message || 'Failed to fetch cases.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectCase = async (caseNumber: string) => {
    setError(null);
    try {
      const detail = await fetchCase(caseNumber);
      setSelectedCase(detail);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch case details.');
    }
  };

  if (selectedCase) {
    return (
      <div className="dashboard-container dashboard-panel flex-col" style={{ gap: '16px', padding: '24px', overflowY: 'auto' }}>
        <button className="btn-secondary" onClick={() => setSelectedCase(null)} style={{ alignSelf: 'flex-start' }}>
          &larr; BACK TO HISTORY
        </button>
        <AnalysisResultView result={selectedCase} />
      </div>
    );
  }

  return (
    <div className="dashboard-container dashboard-panel" style={{ padding: '24px', background: 'transparent', border: 'none', boxShadow: 'none', overflowY: 'auto' }}>
       <h2 style={{ fontSize: '24px', margin: 0, marginBottom: '24px', fontWeight: 600 }}>Analysis History</h2>
       
       {error && <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</div>}
       
       {loading ? <div className="text-muted">Loading cases...</div> : (
         <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <thead>
               <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>CASE NUMBER</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>TARGET / SUBJECT</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>SEVERITY</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>SCORE</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>STATUS</th>
                 <th style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>DATE</th>
               </tr>
             </thead>
             <tbody>
               {cases.map((c, idx) => {
                 const isHigh = c.threat_score >= 80;
                 const isMed = c.threat_score >= 40 && c.threat_score < 80;
                 return (
                   <tr key={idx} onClick={() => handleSelectCase(c.case_number)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-row">
                     <td style={{ padding: '16px 24px', color: 'var(--white)', fontWeight: 500 }}>{c.case_number}</td>
                     <td style={{ padding: '16px 24px', color: 'var(--secondary)' }}>
                       <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                         {c.subject || 'Unknown Target'}
                       </div>
                     </td>
                     <td style={{ padding: '16px 24px' }}>
                       <span className={`text-${isHigh ? 'critical' : isMed ? 'warning' : 'safe'}`} style={{ fontWeight: 600, fontSize: '13px' }}>
                         {c.severity || (isHigh ? 'HIGH' : isMed ? 'MODERATE' : 'LOW')}
                       </span>
                     </td>
                     <td style={{ padding: '16px 24px', color: 'var(--white)', fontWeight: 600 }}>{c.threat_score}</td>
                     <td style={{ padding: '16px 24px' }}>
                       <span style={{ 
                         background: c.status === 'open' ? 'rgba(125,160,255,0.1)' : 'rgba(255,255,255,0.05)', 
                         color: c.status === 'open' ? 'var(--accent)' : 'var(--muted)',
                         padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
                       }}>
                         {c.status || 'PROCESSED'}
                       </span>
                     </td>
                     <td style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '13px' }}>{new Date(c.created_at).toLocaleString()}</td>
                   </tr>
                 );
               })}
               {cases.length === 0 && (
                 <tr>
                   <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>No case history available.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       )}
    </div>
  );
}
