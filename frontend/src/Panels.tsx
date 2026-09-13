import React, { useState, useEffect } from 'react';
import { getSeverityColorClass, getClassificationColorClass, getStatusColorClass } from './utils/colors';
import { Shield, Mail, Zap, Activity, Globe, Network, Hash, Clock, Download, Search, Filter, Copy } from 'lucide-react';
import { fetchCases, fetchCase, analyzeFile, fetchIOCs, fetchAllIOCs, getExportUrl } from './api';
import { CircularProgress } from './components/CircularProgress';
import { CurveChart } from './components/CurveChart';
import { ThreatGradientBorder } from './components/ThreatGradientBorder';
import { ErrorBoundary } from './ErrorBoundary';
import { AttackGraph } from './AttackGraph';
import './Dashboard.css';

export function AnalysisResultView({ result, onNewScan }: { result: any, onNewScan?: () => void }) {
  const threatScore = result?.assertion?.threat_score || 0;
  const scoreClass = getSeverityColorClass(threatScore);

  const getHeader = (key: string) => {
    return result?.trace?.headers?.[key] || 'Unknown';
  };

  const aiModelScore = (result?.assertion?.threat_score_breakdown?.ai_model_score * 100) || 0;
  const heuristicScore = (result?.assertion?.threat_score_breakdown?.model_score * 100) || 0;
  
  // Mock data for curve chart based on threat score to show some visual trend
  const curveData = [Math.max(0, threatScore - 20), threatScore - 10, threatScore, Math.max(0, threatScore - 5), threatScore];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div className="dashboard-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--white)' }}>Analysis Complete</h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--secondary)' }}>
            Case: {result?.case_number} | {new Date(result?.created_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary flex-row" onClick={() => window.open(getExportUrl(result.case_number), '_blank')}>
            <Download size={16} /> EXPORT REPORT
          </button>
          {onNewScan && <button className="btn-icon" onClick={onNewScan} style={{ width: 'auto', padding: '0 16px' }}>NEW SCAN</button>}
        </div>
      </div>

      <div className="card-grid">
        {/* Row 1: Threat Score + Quick Status */}
        <div className="glass-card card-grid-span2 delay-1" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <ThreatGradientBorder threatLevel={threatScore} />
          <div className="card-header">
            <h4 className="card-title">Threat Assessment</h4>
            <Shield className="card-icon" />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress 
              value={threatScore} 
              size="lg" 
              variant="threat" 
              label={`${result?.assertion?.severity || 'UNKNOWN'} SEVERITY`}
            />
          </div>
        </div>

        <div className="glass-card card-grid-span2 delay-2" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div className="card-header">
            <h4 className="card-title">Quick Status</h4>
            <Activity className="card-icon" />
          </div>
          <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-muted" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>Status</span>
              <span className={`text-${getStatusColorClass(result?.status)}`} style={{ fontSize: '18px', fontWeight: 600 }}>{result?.status || 'PROCESSED'}</span>
            </div>
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-muted" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>Severity</span>
              <span className={`text-${scoreClass}`} style={{ fontSize: '18px', fontWeight: 600 }}>{result?.assertion?.severity || 'UNKNOWN'}</span>
            </div>
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-muted" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>Classification</span>
              <span className={`text-${getClassificationColorClass(result?.assertion?.sender_classification)}`} style={{ fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
                {result?.assertion?.sender_classification?.replace('_', ' ') || 'UNVERIFIED'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Email Metadata + AI Analysis */}
        <div className="glass-card card-grid-span2 delay-3" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h4 className="card-title">Message Details</h4>
            <Mail className="card-icon" />
          </div>
          <div className="flex-col" style={{ gap: '16px', flex: 1, justifyContent: 'center' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span className="text-muted">From</span>
              <span className="text-secondary">{getHeader('From')}</span>
            </div>
            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span className="text-muted">Subject</span>
              <span className="text-secondary" style={{ maxWidth: '60%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getHeader('Subject')}</span>
            </div>
            <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span className="text-muted">Date</span>
              <span className="text-secondary">{getHeader('Date')}</span>
            </div>
            {result?.assertion?.fraud_type && (
              <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span className="text-muted">Fraud Type</span>
                <span className={`text-${getClassificationColorClass(result?.assertion?.fraud_type)}`} style={{ fontWeight: 600 }}>{result?.assertion?.fraud_type}</span>
              </div>
            )}
            <div className="flex-col" style={{ marginTop: '8px' }}>
              <span className="text-muted">SHA256 Hash</span>
              <div className="flex-row" style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                <span className="mono" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{result?.evidence_custody?.sha256_hash || 'N/A'}</span>
                {result?.evidence_custody?.sha256_hash && <Copy size={14} className="card-icon card-selectable" />}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card card-grid-span2 delay-4" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h4 className="card-title">AI Threat Confidence</h4>
            <Zap className="card-icon" />
          </div>
          <p className="text-secondary" style={{ lineHeight: 1.5, marginBottom: '16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {result?.assertion?.threat_score_breakdown?.ai_reasoning || 'No AI reasoning provided for this analysis.'}
          </p>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
               <CurveChart dataPoints={curveData} labels={['T-4', 'T-3', 'T-2', 'T-1', 'Now']} color={threatScore >= 60 ? '#ff5f54' : '#7da0ff'} height={80} />
            </div>
            <div style={{ display: 'flex', gap: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px' }}>
              <CircularProgress value={Math.round(aiModelScore)} size="sm" variant="threat" label="AI Model" />
              <CircularProgress value={Math.round(heuristicScore)} size="sm" variant="threat" label="Heuristics" />
            </div>
          </div>
        </div>

        {/* Row 3: Increasers / Reducers */}
        <div className="glass-card card-grid-span2 delay-5" style={{ minHeight: '240px', maxHeight: '300px', overflowY: 'auto' }}>
          <h4 className="card-title" style={{ marginBottom: '16px' }}>Risk Factors — Increased</h4>
          <div className="flex-col">
            {(!result?.assertion?.risk_increasers?.length) ? (
               <p className="text-muted">No significant increasing factors.</p>
            ) : result.assertion.risk_increasers.map((r: any, i: number) => (
              <div key={i} className="flex-between" style={{ background: 'rgba(255,95,84,0.05)', border: '1px solid rgba(255,95,84,0.1)', padding: '12px', borderRadius: '6px' }}>
                <div className="flex-row">
                  <span className="mono text-muted" style={{ fontSize: '11px' }}>[{r.category}]</span>
                  <span className="text-secondary">{r.factor}</span>
                </div>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>+{r.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card card-grid-span2 delay-6" style={{ minHeight: '240px', maxHeight: '300px', overflowY: 'auto' }}>
          <h4 className="card-title" style={{ marginBottom: '16px' }}>Risk Factors — Decreased</h4>
          <div className="flex-col">
            {(!result?.assertion?.risk_reducers?.length) ? (
               <p className="text-muted">No significant reducing factors.</p>
            ) : result.assertion.risk_reducers.map((r: any, i: number) => (
              <div key={i} className="flex-between" style={{ background: 'rgba(47,201,65,0.05)', border: '1px solid rgba(47,201,65,0.1)', padding: '12px', borderRadius: '6px' }}>
                <div className="flex-row">
                  <span className="mono text-muted" style={{ fontSize: '11px' }}>[{r.category}]</span>
                  <span className="text-secondary">{r.factor}</span>
                </div>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Extracted Indicators */}
        {result?.property?.indicators && result.property.indicators.length > 0 && (
          <div className="glass-card card-grid-full delay-7">
            <h4 className="card-title" style={{ marginBottom: '16px' }}>Detected Indicators ({result.property.indicators.length})</h4>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {result.property.indicators.map((ioc: any, i: number) => (
                <div key={i} className="flex-row card-selectable" style={{ background: 'rgba(125,160,255,0.1)', border: '1px solid rgba(125,160,255,0.3)', padding: '8px 12px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  <span className="mono text-secondary" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ioc.value || ioc.indicator}</span>
                  <Copy size={12} className="text-muted" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { IntelIndicator } from './AtmosHomePage';

export function AnalyzePanel() {
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
    <div className="dashboard-container dashboard-panel flex-col" style={{ gap: '24px' }}>
      {!result && (
        <div className="card-grid" style={{ marginBottom: '16px' }}>
          <IntelIndicator docked label="THREAT SCORE" value="98/100" danger />
          <IntelIndicator docked label="AUTH PROTOCOLS" value="SPF/DKIM: FAIL" danger />
          <IntelIndicator docked label="IOC DETECTED" value="12" danger />
          <IntelIndicator docked label="CAMPAIGN CORRELATED" value="APT-29" />
          <IntelIndicator docked label="FORENSIC STATUS" value="READY" />
        </div>
      )}

      {!result ? (
        <div className="glass-card flex-col" style={{ gap: '16px' }}>
          <h2 className="dashboard-header" style={{ margin: 0, border: 'none' }}>Analyze Email (.eml)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input type="file" accept=".eml" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: 'var(--white)' }} />
            <button className="btn-primary" onClick={handleAnalyze} disabled={!file || loading}>
              {loading ? 'ANALYZING...' : 'START ANALYSIS'}
            </button>
          </div>
          {error && <div style={{ color: 'var(--danger)', marginTop: '8px', fontSize: '14px' }}>{error}</div>}
        </div>
      ) : (
        <AnalysisResultView result={result} onNewScan={() => { setFile(null); setResult(null); }} />
      )}
    </div>
  );
}

export function CasesPanel() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch((e) => setError(e.message || 'Failed to fetch cases.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectCase = async (caseNumber: string) => {
    setCaseDetailLoading(true);
    setError(null);
    try {
      const detail = await fetchCase(caseNumber);
      setSelectedCase(detail);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch case details.');
    }
    setCaseDetailLoading(false);
  };

  const filteredCases = cases.filter(c => 
    (c.case_number || c.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container dashboard-panel" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="split-pane" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="pane-left flex-col" style={{ overflowY: 'auto', gap: '16px' }}>
          <div className="glass-card flex-col" style={{ position: 'sticky', top: 0, zIndex: 2, padding: '16px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
               <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--white)' }}>Active Cases</h3>
               <Filter size={16} className="text-muted" />
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--muted)' }} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search cases..." 
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-col" style={{ gap: '12px' }}>
            {filteredCases.map((c: any, i) => {
              const scoreColor = c.threat_score >= 80 ? 'var(--danger)' : c.threat_score >= 40 ? 'var(--warning)' : 'var(--success)';
              return (
                <div key={i} className={`glass-card case-item ${selectedCase?.case_number === (c.case_number || c.id) ? 'selected' : ''}`} onClick={() => handleSelectCase(c.case_number || c.id)} style={{ cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', padding: '16px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: scoreColor, flexShrink: 0, boxShadow: `0 0 8px ${scoreColor}` }} />
                  <div className="flex-col" style={{ gap: '4px', overflow: 'hidden' }}>
                    <div className="flex-between">
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)' }}>{c.case_number || c.id}</span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="text-secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject || 'No Subject'}</span>
                    {c.fraud_type && (
                      <span className={`text-${getClassificationColorClass(c.fraud_type)}`} style={{ fontSize: '11px', fontWeight: 500 }}>
                        {c.fraud_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pane-right" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {caseDetailLoading ? (
             <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Activity className="card-icon" style={{ animation: 'spin 2s linear infinite' }} />
             </div>
          ) : selectedCase ? (
            <AnalysisResultView result={selectedCase} />
          ) : (
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <Shield size={64} className="text-muted" style={{ margin: '0 auto 24px', opacity: 0.15 }} />
               <h3 style={{ color: 'var(--white)', margin: '0 0 12px', fontSize: '20px' }}>Select a Case</h3>
               <p className="text-muted" style={{ maxWidth: '300px', textAlign: 'center', lineHeight: 1.5 }}>Choose a case from the active list to view its forensic analysis and evidence grid.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AttackGraphPanel() {
  return (
    <div className="dashboard-container">
      <ErrorBoundary fallbackMessage="The Attack Graph encountered an error.">
        <AttackGraph />
      </ErrorBoundary>
    </div>
  );
}

export function IOCsPanel() {
  const [iocs, setIocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllIOCs()
      .then(setIocs)
      .catch((e) => setError(e.message || 'Failed to fetch IOCs'))
      .finally(() => setLoading(false));
  }, []);

  const getIocIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('domain') || t.includes('url')) return <Globe className="icon-top-right" />;
    if (t.includes('ip')) return <Network className="icon-top-right" />;
    return <Hash className="icon-top-right" />;
  };

  const getThreatScore = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === 'critical') return 100;
    if (s === 'high') return 70;
    if (s === 'medium') return 50;
    return 20;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>Threat Intelligence Data Grid</div>
      {error && <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}
      {loading ? <p>Loading IOCs...</p> : (
        <div className="card-grid">
          {iocs.map((ioc: any, i: number) => {
            const threatScore = getThreatScore(ioc.severity);
            const isDanger = threatScore >= 60;
            return (
              <div key={ioc.id} className={`glass-card delay-${(i % 9) + 1}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '160px' }}>
                <ThreatGradientBorder threatLevel={threatScore} />
                {getIocIcon(ioc.type)}
                <div className="flex-row" style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 600 }}>{ioc.type || 'UNKNOWN'}</span>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: isDanger ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>{ioc.severity || 'UNKNOWN'}</span>
                </div>
                
                <div className="mono card-selectable" style={{ fontSize: '13px', color: 'var(--white)', wordBreak: 'break-all', marginBottom: 'auto', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {ioc.value}
                </div>
                
                <div className="flex-between" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                   <div className="flex-row text-muted" style={{ fontSize: '11px' }}>
                     <Clock size={12} />
                     <span>{new Date(ioc.timestamp || ioc.created_at).toLocaleString()}</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReportsPanel() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch((e) => setError(e.message || 'Failed to fetch cases'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container dashboard-panel" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="split-pane">
        <div className="pane-left glass-card" style={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="flex-col" style={{ position: 'sticky', top: 0, background: 'rgba(10,15,26,0.9)', zIndex: 2, paddingBottom: '16px', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--white)' }}>Select Report</h3>
          </div>
          <div className="flex-col">
            {cases.map((c: any, i) => (
              <div key={i} className={`case-item ${selectedCase?.case_number === c.case_number ? 'selected' : ''}`} onClick={() => setSelectedCase(c)}>
                <div className="flex-col" style={{ gap: '4px' }}>
                  <div className="flex-between">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)' }}>{c.case_number}</span>
                    <span style={{ fontSize: '11px', color: c.threat_score >= 60 ? 'var(--danger)' : 'var(--success)' }}>SCORE: {c.threat_score}</span>
                  </div>
                  <span className="text-secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject || 'Unknown Subject'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pane-right">
          {selectedCase ? (
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
               <div className="dashboard-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
                 Export Workspace
               </div>
               
               <div className="flex-col" style={{ gap: '16px', flex: 1 }}>
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h4 className="text-secondary" style={{ margin: '0 0 8px' }}>Case Details</h4>
                    <h2 style={{ color: 'var(--white)', margin: '0 0 8px' }}>{selectedCase.case_number}</h2>
                    <p className="text-muted" style={{ margin: 0 }}>Subject: {selectedCase.subject || 'Unknown'}</p>
                    <p className="text-muted" style={{ margin: '4px 0 0' }}>Created: {new Date(selectedCase.created_at).toLocaleString()}</p>
                  </div>
                  
                  <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-secondary">Include Threat Matrix</span>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-secondary">Include Attack Graph Elements</span>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-secondary">Include Raw IOC Appendix</span>
                    <input type="checkbox" defaultChecked />
                  </div>
               </div>

               <div style={{ marginTop: '32px', textAlign: 'right' }}>
                 <button className="btn-primary flex-row" style={{ display: 'inline-flex' }} onClick={() => window.open(getExportUrl(selectedCase.case_number), '_blank')}>
                   <Download size={18} /> EXPORT FORENSIC PDF
                 </button>
               </div>
            </div>
          ) : (
            <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ textAlign: 'center' }}>
                 <Download size={48} className="text-muted" style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                 <h3 style={{ color: 'var(--white)', margin: '0 0 8px' }}>Export Center</h3>
                 <p className="text-muted">Select a case to customize and generate a forensic report PDF.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
