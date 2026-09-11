import React, { useState, useEffect, useMemo } from 'react';
import { fetchCases, fetchCase, analyzeFile, fetchIOCs, fetchAllIOCs, getExportUrl } from './api';

// Styles for panels inside the hero-content
const panelStyle: React.CSSProperties = {
  background: 'rgba(10, 10, 15, 0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(125, 160, 255, 0.2)',
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  maxWidth: '800px',
  color: 'white',
  pointerEvents: 'auto',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  textAlign: 'left'
};

const headerStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '600',
  marginBottom: '16px',
  color: 'var(--accent)'
};



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
    <div className="analyze-result-container">
      <div className="analyze-result-header">
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--white)' }}>Analysis Complete</h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            Case: {result?.case_number} | {new Date(result?.created_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="nav-btn active" onClick={() => window.open(getExportUrl(result.case_number), '_blank')} style={{ padding: '8px 16px', fontSize: '12px' }}>EXPORT REPORT</button>
          {onNewScan && <button className="nav-btn" onClick={onNewScan} style={{ padding: '8px 16px', fontSize: '12px' }}>NEW SCAN</button>}
        </div>
      </div>

      <div className="analyze-score-section">
        <div className={`score-circle ${scoreClass}`}>
          <div className="score-value">{Math.round(threatScore)}</div>
          <div className="score-label">THREAT SCORE</div>
        </div>
        <div className="score-details">
          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className="detail-value" style={{ textTransform: 'uppercase' }}>{result?.status || 'Processed'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Severity</span>
            <span className="detail-value" style={{ textTransform: 'uppercase', color: `var(--${scoreClass})` }}>{result?.assertion?.severity || 'Unknown'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Classification</span>
            <span className="detail-value" style={{ textTransform: 'uppercase', color: result?.assertion?.sender_classification === 'POSSIBLY_COMPROMISED' ? 'var(--danger)' : 'var(--text)' }}>
              {result?.assertion?.sender_classification?.replace('_', ' ') || 'UNVERIFIED'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
        <div className="analyze-section">
          <h4>Metadata</h4>
          <div className="meta-list">
            <div className="meta-row"><span>Sender:</span> <span>{getHeader('From')}</span></div>
            <div className="meta-row"><span>Subject:</span> <span>{getHeader('Subject')}</span></div>
            <div className="meta-row"><span>Date:</span> <span>{getHeader('Date')}</span></div>
            <div className="meta-row"><span>Hash:</span> <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{result?.evidence_custody?.sha256_hash?.substring(0,20) || 'N/A'}...</span></div>
          </div>
        </div>

        <div className="analyze-section">
          <h4>AI Threat Analysis</h4>
          <div className="meta-list">
            <div className="meta-row"><span>AI Reasoning:</span></div>
            {result?.assertion?.threat_score_breakdown?.ai_reasoning ? (
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                {result.assertion.threat_score_breakdown.ai_reasoning}
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>No AI reasoning provided.</span>
            )}
            
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>AI Content Model</div>
                <div style={{ fontSize: '14px', color: 'var(--white)' }}>{(result?.assertion?.threat_score_breakdown?.ai_model_score * 100)?.toFixed(1) || 0}%</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Phishing Heuristics</div>
                <div style={{ fontSize: '14px', color: 'var(--white)' }}>{(result?.assertion?.threat_score_breakdown?.model_score * 100)?.toFixed(1) || 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="analyze-section" style={{ marginTop: '16px' }}>
        <h4>Explainable Threat Scoring</h4>
        {(!result?.assertion?.risk_increasers?.length && !result?.assertion?.risk_reducers?.length) ? (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>No significant threat factors found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {result?.assertion?.risk_increasers?.map((r: any, i: number) => (
              <div key={`inc-${i}`} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--white)' }}>[{r.category}] {r.factor}</span>
                <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>+{r.score}</span>
              </div>
            ))}
            {result?.assertion?.risk_reducers?.map((r: any, i: number) => (
              <div key={`dec-${i}`} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.2)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--white)' }}>[{r.category}] {r.factor}</span>
                <span style={{ color: 'var(--success, #34c759)', fontWeight: 'bold' }}>{r.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {result?.property?.indicators && result.property.indicators.length > 0 && (
        <div className="analyze-section" style={{ marginTop: '16px' }}>
          <h4>Extracted Indicators ({result.property.indicators.length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {result.property.indicators.map((ioc: any, i: number) => (
              <span key={i} style={{ background: 'rgba(125,160,255,0.1)', border: '1px solid rgba(125,160,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                {ioc.value || ioc.indicator}
              </span>
            ))}
          </div>
        </div>
      )}
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
    <div style={panelStyle}>
      <h2 style={headerStyle}>Analyze Email (.eml)</h2>
      
      {!result && (
        <div className="file-upload-container" style={{ marginBottom: '16px' }}>
          <input type="file" accept=".eml" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="btn-primary" onClick={handleAnalyze} disabled={!file || loading}>
            {loading ? 'ANALYZING...' : 'START ANALYSIS'}
          </button>
        </div>
      )}

      {error && <div style={{ color: 'var(--danger)', marginTop: '16px', fontSize: '14px' }}>{error}</div>}

      {result && <AnalysisResultView result={result} onNewScan={() => { setFile(null); setResult(null); }} />}
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

  if (selectedCase) {
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button className="btn-secondary" onClick={() => setSelectedCase(null)} style={{ padding: '6px 12px', fontSize: '12px' }}>
            ← BACK TO CASES
          </button>
        </div>
        <AnalysisResultView result={selectedCase} />
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <h2 style={headerStyle}>Platform Cases</h2>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
      
      {loading ? <p>Loading cases...</p> : (
        <div className="cases-list">
          {cases.length === 0 && !error ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', textAlign: 'center', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
               <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No Cases Found</h4>
               <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>Upload an email in the Analyze tab to generate a new case.</p>
            </div>
          ) : cases.map((c: any, i) => (
            <div key={i} className="case-list-item" onClick={() => handleSelectCase(c.case_number || c.id)}>
              <div className="case-main">
                <span className="case-id">{c.case_number || c.id}</span>
                <span className="case-subject">{c.subject || 'No Subject'}</span>
              </div>
              <div className="case-meta">
                <span className="case-sender">{c.sender}</span>
                <span className="case-date">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <div className="case-status">
                <span className={`badge ${c.threat_score >= 80 ? 'danger' : ''}`}>SCORE: {Number(c.threat_score || 0).toFixed(0)}</span>
                <span className="badge">{String(c.status || 'UNKNOWN').toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {caseDetailLoading && <div style={{ marginTop: '16px', color: 'var(--accent)' }}>Loading case details...</div>}
    </div>
  );
}

import { ErrorBoundary } from './ErrorBoundary';
import { AttackGraph } from './AttackGraph';

export function AttackGraphPanel() {
  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ ...headerStyle, marginBottom: 0 }}>Attack Graph</h2>
      </div>
      <ErrorBoundary fallbackMessage="The Attack Graph encountered an error during layout physics simulation. Please try again.">
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

  return (
    <div style={panelStyle}>
      <h2 style={headerStyle}>Indicators of Compromise</h2>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
      {loading ? <p>Loading IOCs...</p> : iocs.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', textAlign: 'center', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
           <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No IOCs Found</h4>
           <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>Upload an email in the Analyze tab to generate indicators.</p>
        </div>
      ) : (
        <div className="cases-list">
          {iocs.map((ioc: any) => (
            <div key={ioc.id} className="case-list-item">
              <div className="case-main">
                <span className="case-id" style={{ fontFamily: 'monospace' }}>{ioc.value}</span>
                <span className="case-subject" style={{ color: (ioc.severity?.toLowerCase() === 'critical' || ioc.severity?.toLowerCase() === 'high') ? 'var(--danger)' : 'var(--accent)' }}>
                  {ioc.severity?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="case-meta">
                <span>{ioc.type?.toUpperCase() || 'UNKNOWN'}</span>
                <span>{new Date(ioc.timestamp || ioc.created_at).toLocaleString()}</span>
              </div>
              {ioc.description && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                  {ioc.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportsPanel() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div style={panelStyle}>
      <h2 style={headerStyle}>Forensic Reports</h2>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
      {loading ? <p>Loading available cases for export...</p> : cases.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', textAlign: 'center', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
           <h4 style={{ color: 'var(--white)', margin: '0 0 8px 0' }}>No Cases Available</h4>
           <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>Upload an email in the Analyze tab to generate a forensic report.</p>
        </div>
      ) : (
        <div className="cases-list">
          {cases.map((c: any) => (
            <div key={c.id} className="case-list-item" onClick={() => handleExport(c.case_number)}>
              <div className="case-main">
                <span className="case-id">{c.case_number}</span>
                <span className="case-subject">{c.subject || 'Unknown Subject'}</span>
              </div>
              <div className="case-meta">
                <span>{c.sender || 'Unknown Sender'}</span>
                <span>{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <div className="case-status">
                <span style={{ color: c.threat_score >= 80 ? 'var(--danger)' : c.threat_score >= 40 ? '#ff9f0a' : 'var(--accent)' }}>
                  Score: {c.threat_score}
                </span>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  Export PDF
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
