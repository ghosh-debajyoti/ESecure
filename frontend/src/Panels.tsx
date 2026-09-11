import React, { useState, useEffect, useMemo } from 'react';
import { fetchCases, fetchCase, analyzeFile, fetchIOCs, fetchAllIOCs, getExportUrl } from './api';
import './Dashboard.css';

export function AnalysisResultView({ result, onNewScan }: { result: any, onNewScan?: () => void }) {
  const getScoreClass = (score: number) => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const threatScore = result?.assertion?.threat_score || 0;
  const scoreClass = getScoreClass(threatScore);

  const getHeader = (key: string) => {
    return result?.trace?.headers?.[key] || 'Unknown';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="dashboard-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--white)' }}>Analysis Complete</h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Case: {result?.case_number} | {new Date(result?.created_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="nav-btn active" onClick={() => window.open(getExportUrl(result.case_number), '_blank')} style={{ padding: '8px 16px', fontSize: '12px' }}>EXPORT REPORT</button>
          {onNewScan && <button className="nav-btn" onClick={onNewScan} style={{ padding: '8px 16px', fontSize: '12px' }}>NEW SCAN</button>}
        </div>
      </div>

      <div className="analyze-grid">
        {/* Left Column - Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px' }}>
            <div className={`metric-value ${scoreClass}`}>{Math.round(threatScore)}</div>
            <div className="metric-label">THREAT SCORE</div>
          </div>
          
          <div className="glass-card">
            <h4>Quick Status</h4>
            <div className="data-row">
              <span className="data-label">Status</span>
              <span className="data-value" style={{ textTransform: 'uppercase' }}>{result?.status || 'Processed'}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Severity</span>
              <span className="data-value" style={{ textTransform: 'uppercase', color: `var(--${scoreClass})` }}>{result?.assertion?.severity || 'Unknown'}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Classification</span>
              <span className="data-value" style={{ textTransform: 'uppercase', color: result?.assertion?.sender_classification === 'POSSIBLY_COMPROMISED' ? 'var(--danger)' : 'var(--text)' }}>
                {result?.assertion?.sender_classification?.replace('_', ' ') || 'UNVERIFIED'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="grid-2-col">
            <div className="glass-card">
              <h4>Email Metadata</h4>
              <div className="data-row"><span className="data-label">Sender:</span> <span className="data-value">{getHeader('From')}</span></div>
              <div className="data-row"><span className="data-label">Subject:</span> <span className="data-value">{getHeader('Subject')}</span></div>
              <div className="data-row"><span className="data-label">Date:</span> <span className="data-value">{getHeader('Date')}</span></div>
              <div className="data-row"><span className="data-label">Hash:</span> <span className="data-value" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{result?.evidence_custody?.sha256_hash?.substring(0,20) || 'N/A'}...</span></div>
            </div>

            <div className="glass-card">
              <h4>AI Threat Analysis</h4>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', marginBottom: '16px' }}>
                {result?.assertion?.threat_score_breakdown?.ai_reasoning || 'No AI reasoning provided.'}
              </div>
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>AI Content Model</div>
                  <div style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 600 }}>{(result?.assertion?.threat_score_breakdown?.ai_model_score * 100)?.toFixed(1) || 0}%</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Phishing Heuristics</div>
                  <div style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 600 }}>{(result?.assertion?.threat_score_breakdown?.model_score * 100)?.toFixed(1) || 0}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h4>Explainable Threat Scoring</h4>
            {(!result?.assertion?.risk_increasers?.length && !result?.assertion?.risk_reducers?.length) ? (
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>No significant threat factors found.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result?.assertion?.risk_increasers?.map((r: any, i: number) => (
                    <div key={`inc-${i}`} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,95,84,0.1)', border: '1px solid rgba(255,95,84,0.2)', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--white)' }}>[{r.category}] {r.factor}</span>
                      <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>+{r.score}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result?.assertion?.risk_reducers?.map((r: any, i: number) => (
                    <div key={`dec-${i}`} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(47,201,65,0.1)', border: '1px solid rgba(47,201,65,0.2)', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--white)' }}>[{r.category}] {r.factor}</span>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{r.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result?.property?.indicators && result.property.indicators.length > 0 && (
            <div className="glass-card">
              <h4>Extracted Indicators ({result.property.indicators.length})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {result.property.indicators.map((ioc: any, i: number) => (
                  <span key={i} style={{ background: 'rgba(125,160,255,0.1)', border: '1px solid rgba(125,160,255,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
                    {ioc.value || ioc.indicator}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="dashboard-container dashboard-panel">
      {!result ? (
        <>
          <h2 className="dashboard-header">Analyze Email (.eml)</h2>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input type="file" accept=".eml" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button className="btn-primary" onClick={handleAnalyze} disabled={!file || loading}>
              {loading ? 'ANALYZING...' : 'START ANALYSIS'}
            </button>
          </div>
          {error && <div style={{ color: 'var(--danger)', marginTop: '16px', fontSize: '14px' }}>{error}</div>}
        </>
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

  return (
    <div className="dashboard-container dashboard-panel">
      <div className="dashboard-header">
        Platform Cases
        {selectedCase && (
          <button className="btn-secondary" onClick={() => setSelectedCase(null)} style={{ padding: '6px 12px', fontSize: '12px' }}>
            ← BACK TO LIST
          </button>
        )}
      </div>
      
      {error && <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}
      
      {loading ? <p>Loading cases...</p> : (
        <div className="split-pane">
          <div className="pane-left">
            {cases.length === 0 && !error ? (
              <div className="glass-card" style={{ textAlign: 'center' }}>
                 <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No Cases Found</h4>
                 <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>Upload an email to generate a new case.</p>
              </div>
            ) : cases.map((c: any, i) => (
              <div key={i} className="compact-card" onClick={() => handleSelectCase(c.case_number || c.id)} style={{ borderColor: selectedCase?.case_number === (c.case_number || c.id) ? 'var(--accent)' : '' }}>
                <div className="compact-header">
                  <span className="compact-title">{c.case_number || c.id}</span>
                  <span className={`badge-solid ${c.threat_score >= 80 ? 'badge-danger' : c.threat_score >= 40 ? 'badge-warning' : 'badge-success'}`}>SCORE: {Number(c.threat_score || 0).toFixed(0)}</span>
                </div>
                <div className="compact-meta">{c.subject || 'No Subject'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  <span>{String(c.status || 'UNKNOWN').toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pane-right">
            {caseDetailLoading ? (
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                Loading case details...
              </div>
            ) : selectedCase ? (
              <div className="glass-card" style={{ overflowY: 'auto' }}>
                <AnalysisResultView result={selectedCase} />
              </div>
            ) : (
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                Select a case from the list to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { ErrorBoundary } from './ErrorBoundary';
import { AttackGraph } from './AttackGraph';

export function AttackGraphPanel() {
  return (
    <div className="dashboard-container dashboard-panel">
      <div className="dashboard-header">Attack Graph</div>
      <div className="attack-graph-dashboard">
        <ErrorBoundary fallbackMessage="The Attack Graph encountered an error during layout physics simulation. Please try again.">
          <AttackGraph />
        </ErrorBoundary>
      </div>
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

  return (
    <div className="dashboard-container dashboard-panel">
      <h2 className="dashboard-header">Threat Intelligence Data Grid</h2>
      {error && <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}
      {loading ? <p>Loading IOCs...</p> : iocs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center' }}>
           <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No IOCs Found</h4>
           <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>Upload an email to generate indicators.</p>
        </div>
      ) : (
        <div className="ioc-grid">
          {iocs.map((ioc: any) => {
            const isDanger = ioc.severity?.toLowerCase() === 'critical' || ioc.severity?.toLowerCase() === 'high';
            return (
              <div key={ioc.id} className="ioc-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className={`badge-solid ${ioc.type === 'domain' ? 'badge-warning' : ioc.type === 'ipv4-addr' ? 'badge-info' : 'badge-danger'}`}>
                    {ioc.type?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  <span className={`badge-solid ${isDanger ? 'badge-danger' : 'badge-info'}`}>
                    {ioc.severity?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                <div className="ioc-value">{ioc.value}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: 'auto' }}>
                  <span>{new Date(ioc.timestamp || ioc.created_at).toLocaleString()}</span>
                </div>
                {ioc.description && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    {ioc.description}
                  </div>
                )}
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

  const handleExport = (caseNumber: string) => {
    window.open(getExportUrl(caseNumber), '_blank');
  };

  return (
    <div className="dashboard-container dashboard-panel">
      <h2 className="dashboard-header">Forensic Report Workspace</h2>
      {error && <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}
      
      {loading ? <p>Loading available cases for export...</p> : (
        <div className="split-pane">
          <div className="pane-left">
            {cases.length === 0 && !error ? (
              <div className="glass-card" style={{ textAlign: 'center' }}>
                 <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No Cases Available</h4>
                 <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>Upload an email to generate a forensic report.</p>
              </div>
            ) : cases.map((c: any, i) => (
              <div key={i} className="compact-card" onClick={() => setSelectedCase(c)} style={{ borderColor: selectedCase?.id === c.id ? 'var(--accent)' : '' }}>
                <div className="compact-header">
                  <span className="compact-title">{c.case_number}</span>
                  <span className={`badge-solid ${c.threat_score >= 80 ? 'badge-danger' : c.threat_score >= 40 ? 'badge-warning' : 'badge-success'}`}>SCORE: {c.threat_score}</span>
                </div>
                <div className="compact-meta">{c.subject || 'Unknown Subject'}</div>
              </div>
            ))}
          </div>

          <div className="pane-right">
            {selectedCase ? (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--white)' }}>{selectedCase.case_number}</h3>
                  <p style={{ margin: 0, color: 'var(--secondary)' }}>{selectedCase.subject || 'No Subject'}</p>
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '13px' }}>Created: {new Date(selectedCase.created_at).toLocaleString()}</p>
                </div>
                <button className="nav-btn active" onClick={() => handleExport(selectedCase.case_number)} style={{ padding: '12px 32px', fontSize: '16px', marginTop: '16px' }}>
                  EXPORT FORENSIC PDF
                </button>
              </div>
            ) : (
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                Select a case from the list to preview export options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
