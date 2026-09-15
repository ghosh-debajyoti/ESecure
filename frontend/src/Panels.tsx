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
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <CircularProgress value={Math.round(aiModelScore)} size="sm" variant="threat" label="AI Model" />
            <CircularProgress value={Math.round(heuristicScore)} size="sm" variant="threat" label="Heuristics" />
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

export function AnalyzePanel({ activeCase, setActiveCase }: { activeCase: string | null, setActiveCase: (case_num: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (activeCase && result?.case_number !== activeCase) {
      setLoading(true);
      fetchCase(activeCase)
        .then(setResult)
        .catch(e => setError(e.message || 'Failed to fetch active case details.'))
        .finally(() => setLoading(false));
    } else if (!activeCase && result) {
      setResult(null);
    }
  }, [activeCase, result?.case_number]);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeFile(file);
      setResult(res);
      if (res.case_number) {
        setActiveCase(res.case_number);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Analysis failed. Please try again.');
    }
    setLoading(false);
  };

  const getHeader = (key: string) => {
    return result?.trace?.headers?.[key] || 'Not available';
  };

  const getIndicators = (type: string) => {
    if (!result?.property?.indicators) return [];
    return result.property.indicators.filter((i: any) => i.type === type);
  };

  const aiScore = result?.assertion?.threat_score_breakdown?.ai_model_score * 100 || null;

  return (
    <div className="dashboard-container dashboard-panel flex-col" style={{ gap: '24px' }}>
      
      {/* 1. TOP: Compact real-time analysis summary */}
      <div className="card-grid" style={{ marginBottom: '8px' }}>
        <IntelIndicator docked label="THREAT SCORE" 
          value={result ? `${result.assertion?.threat_score || 0}/100` : "—"} 
          danger={result?.assertion?.threat_score >= 60} 
        />
        <IntelIndicator docked label="AUTHENTICATION" 
          value={result ? (result.property?.authentication_status || "Not available") : "—"} 
        />
        <IntelIndicator docked label="IOCs DETECTED" 
          value={result ? (result.property?.indicators?.length || 0).toString() : "—"} 
          danger={result && result.property?.indicators?.length > 0} 
        />
        <IntelIndicator docked label="CAMPAIGN" 
          value={result ? (result.assertion?.campaign || "Not available") : "—"} 
        />
        <IntelIndicator docked label="FORENSIC STATUS" 
          value={result ? (result.status || "PROCESSED") : "READY / WAITING FOR EMAIL"} 
        />
      </div>

      {/* 2. BELOW: Large primary EMAIL ANALYSIS / UPLOAD panel */}
      <div className="glass-card flex-col" style={{ gap: '16px', border: '1px solid var(--accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)' }}>
            <Mail size={18} className="text-accent" />
            Email Analysis & Upload
          </h2>
          {result && (
            <button className="btn-secondary" onClick={() => { setFile(null); setResult(null); }} style={{ padding: '6px 12px', fontSize: '12px' }}>
              NEW SCAN
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input 
            type="file" 
            accept=".eml" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(125,160,255,0.4)', borderRadius: '8px', color: 'var(--white)', outline: 'none' }} 
          />
          <button className="btn-primary" onClick={handleAnalyze} disabled={!file || loading} style={{ minWidth: '160px' }}>
            {loading ? 'ANALYZING...' : 'START ANALYSIS'}
          </button>
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}
      </div>

      {/* Grid of empty/populated panels */}
      <div className="card-grid">
        
        {/* EMAIL OVERVIEW */}
        <div className="glass-card card-grid-span2 flex-col" style={{ gap: '12px' }}>
          <h4 className="card-title text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16}/> Email Overview</h4>
          {!result ? (
            <div className="text-muted" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              Upload an .eml file to begin forensic analysis.
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Sender</span><span className="text-white mono" style={{ fontSize: '14px' }}>{getHeader('From')}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Recipient</span><span className="text-white mono" style={{ fontSize: '14px' }}>{getHeader('To')}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Subject</span><span className="text-white" style={{ fontSize: '14px', maxWidth: '60%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getHeader('Subject')}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Timestamp</span><span className="text-white mono" style={{ fontSize: '14px' }}>{getHeader('Date')}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Message-ID</span><span className="text-white mono" style={{ fontSize: '14px', maxWidth: '60%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getHeader('Message-ID')}</span></div>
            </div>
          )}
        </div>

        {/* AUTHENTICATION */}
        <div className="glass-card flex-col" style={{ gap: '12px' }}>
          <h4 className="card-title text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16}/> Authentication</h4>
          {!result ? (
            <div className="text-muted" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              Waiting for analysis data.
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>SPF</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>DKIM</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>DMARC</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Alignment</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
            </div>
          )}
        </div>

        {/* THREAT INTELLIGENCE */}
        <div className="glass-card flex-col" style={{ gap: '12px' }}>
          <h4 className="card-title text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16}/> Threat Intelligence</h4>
          {!result ? (
            <div className="text-muted" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              No email analyzed.
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>IPs</span><span className="text-white mono" style={{ fontSize: '14px' }}>{getIndicators('ip').length || 'None'}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Domains</span><span className="text-white mono" style={{ fontSize: '14px' }}>{getIndicators('domain').length || 'None'}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>URLs</span><span className="text-white mono" style={{ fontSize: '14px' }}>{getIndicators('url').length || 'None'}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Geo/IP info</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
            </div>
          )}
        </div>

        {/* AI ANALYSIS */}
        <div className="glass-card card-grid-span2 flex-col" style={{ gap: '12px' }}>
          <h4 className="card-title text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={16}/> AI Analysis</h4>
          {!result ? (
            <div className="text-muted" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              Upload an .eml file to begin AI forensic analysis.
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Phishing Assessment</span><span className="text-white" style={{ fontSize: '14px' }}>{aiScore ? `${aiScore}% Confidence` : 'Not available'}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>AI Content Assessment</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Classification</span><span className={`text-${getClassificationColorClass(result.assertion?.sender_classification)}`} style={{ fontSize: '14px', fontWeight: 600 }}>{result.assertion?.sender_classification?.replace('_', ' ') || 'UNVERIFIED'}</span></div>
              <div className="flex-col" style={{ marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <span className="text-muted uppercase" style={{ marginBottom: '4px', fontSize: '12px', letterSpacing: '0.05em' }}>Reasoning</span>
                <span className="text-secondary" style={{ lineHeight: 1.5, fontSize: '14px' }}>{result.assertion?.threat_score_breakdown?.ai_reasoning || 'Not available'}</span>
              </div>
            </div>
          )}
        </div>

        {/* FORENSIC ANALYSIS */}
        <div className="glass-card flex-col" style={{ gap: '12px' }}>
          <h4 className="card-title text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Hash size={16}/> Forensic Analysis</h4>
          {!result ? (
            <div className="text-muted" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              Waiting for analysis data.
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Relay path</span><span className="text-white mono" style={{ fontSize: '14px', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getHeader('Received')}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Thread continuity</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Attachments</span><span className="text-white" style={{ fontSize: '14px' }}>Not available</span></div>
              <div className="flex-col" style={{ marginTop: '4px' }}>
                <span className="text-muted uppercase" style={{ fontSize: '12px' }}>SHA-256</span>
                <span className="text-white mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{result.evidence_custody?.sha256_hash || 'Not available'}</span>
              </div>
              <div className="flex-col" style={{ marginTop: '4px' }}>
                <span className="text-muted uppercase" style={{ fontSize: '12px' }}>TLSH</span>
                <span className="text-white mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>Not available</span>
              </div>
            </div>
          )}
        </div>

        {/* THREAT SCORE BREAKDOWN */}
        <div className="glass-card flex-col" style={{ gap: '12px' }}>
          <h4 className="card-title text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16}/> Threat Score Breakdown</h4>
          {!result ? (
            <div className="text-muted" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              No email analyzed.
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Final Score</span><span className={`text-${getSeverityColorClass(result.assertion?.threat_score)}`} style={{ fontSize: '18px', fontWeight: 'bold' }}>{result.assertion?.threat_score || 0}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Severity</span><span className={`text-${getSeverityColorClass(result.assertion?.threat_score)}`} style={{ fontSize: '14px', fontWeight: 'bold' }}>{result.assertion?.severity || 'UNKNOWN'}</span></div>
              
              <div className="text-muted uppercase" style={{ fontSize: '12px', marginTop: '8px' }}>Risk Increasers</div>
              {result.assertion?.risk_increasers?.length ? result.assertion.risk_increasers.slice(0,2).map((r: any, i: number) => (
                <div key={i} className="flex-between"><span className="text-secondary" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{r.factor}</span><span className="text-danger" style={{ fontSize: '12px' }}>+{r.score}</span></div>
              )) : <div className="text-secondary" style={{ fontSize: '12px' }}>None identified</div>}
              
              <div className="text-muted uppercase" style={{ fontSize: '12px', marginTop: '8px' }}>Risk Reducers</div>
              {result.assertion?.risk_reducers?.length ? result.assertion.risk_reducers.slice(0,2).map((r: any, i: number) => (
                <div key={i} className="flex-between"><span className="text-secondary" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{r.factor}</span><span className="text-success" style={{ fontSize: '12px' }}>{r.score}</span></div>
              )) : <div className="text-secondary" style={{ fontSize: '12px' }}>None identified</div>}
            </div>
          )}
        </div>
        
        {/* CASE INFORMATION */}
        <div className="glass-card card-grid-span2 flex-col" style={{ gap: '12px' }}>
          <h4 className="card-title text-muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={16}/> Case Information</h4>
          {!result ? (
            <div className="text-muted" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              Case details will populate after analysis.
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '8px' }}>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Case Number</span><span className="text-white mono" style={{ fontSize: '14px' }}>{result.case_number || 'Not available'}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Status</span><span className={`text-${getStatusColorClass(result.status)}`} style={{ fontSize: '14px', fontWeight: 'bold' }}>{result.status || 'PROCESSED'}</span></div>
              <div className="flex-between"><span className="text-muted" style={{ fontSize: '14px' }}>Campaign</span><span className="text-white" style={{ fontSize: '14px' }}>{result.assertion?.campaign || 'Not available'}</span></div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export function CasesPanel({ activeCase, setActiveCase }: { activeCase: string | null, setActiveCase: (case_num: string | null) => void }) {
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

  useEffect(() => {
    if (activeCase) {
      handleSelectCase(activeCase);
    } else {
      setSelectedCase(null);
    }
  }, [activeCase]);

  const handleSelectCase = async (caseNumber: string) => {
    setCaseDetailLoading(true);
    setError(null);
    try {
      const detail = await fetchCase(caseNumber);
      setSelectedCase(detail);
      setActiveCase(caseNumber);
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
               <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--white)' }}>Application Cases</h3>
               {activeCase ? (
                 <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setActiveCase(null)}>Clear Active</button>
               ) : (
                 <Filter size={16} className="text-muted" />
               )}
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

export function AttackGraphPanel({ activeCase }: { activeCase: string | null }) {
  if (!activeCase) {
    return (
      <div className="dashboard-container dashboard-panel flex-col" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '600px' }}>
         <Shield size={64} className="text-muted" style={{ margin: '0 auto 24px', opacity: 0.15 }} />
         <h3 style={{ color: 'var(--white)', margin: '0 0 12px', fontSize: '20px' }}>No Active Analysis</h3>
         <p className="text-muted" style={{ maxWidth: '300px', textAlign: 'center', lineHeight: 1.5 }}>Upload an email or select a case to view the attack graph.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ErrorBoundary fallbackMessage="The Attack Graph encountered an error.">
        <AttackGraph activeCase={activeCase} />
      </ErrorBoundary>
    </div>
  );
}

export function IOCsPanel({ activeCase }: { activeCase: string | null }) {
  const [iocs, setIocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCase) {
      setIocs([]);
      return;
    }
    setLoading(true);
    // Since IOCs are currently fetched globally or tied to campaigns, 
    // for this MVP we filter them on the frontend based on the case details if possible, 
    // or just fetch all and assume the backend will return the right ones.
    // Ideally, we'd fetch the specific case and use its indicators.
    fetchCase(activeCase).then(res => {
      if (res && res.property && res.property.indicators) {
        setIocs(res.property.indicators);
      } else {
        setIocs([]);
      }
    }).catch(e => {
      setError(e.message || 'Failed to fetch IOCs');
    }).finally(() => setLoading(false));
  }, [activeCase]);

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
      {!activeCase ? (
         <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
             <Shield size={64} className="text-muted" style={{ margin: '0 auto 24px', opacity: 0.15 }} />
             <h3 style={{ color: 'var(--white)', margin: '0 0 12px', fontSize: '20px' }}>No Active Analysis</h3>
             <p className="text-muted" style={{ maxWidth: '300px', textAlign: 'center', lineHeight: 1.5 }}>Upload an email or select a case to view threat intelligence data.</p>
         </div>
      ) : error ? <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div> :
      loading ? <p>Loading IOCs...</p> : (
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

export function ReportsPanel({ activeCase }: { activeCase: string | null }) {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeCase) {
      setLoading(true);
      fetchCase(activeCase)
        .then(setSelectedCase)
        .catch(e => setError(e.message || 'Failed to fetch case details'))
        .finally(() => setLoading(false));
    } else {
      setSelectedCase(null);
    }
  }, [activeCase]);

  if (!activeCase) {
    return (
      <div className="dashboard-container dashboard-panel flex-col" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '600px' }}>
         <Shield size={64} className="text-muted" style={{ margin: '0 auto 24px', opacity: 0.15 }} />
         <h3 style={{ color: 'var(--white)', margin: '0 0 12px', fontSize: '20px' }}>No Active Analysis</h3>
         <p className="text-muted" style={{ maxWidth: '300px', textAlign: 'center', lineHeight: 1.5 }}>Upload an email or select a case to export a forensic report.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container dashboard-panel" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="split-pane">
        <div className="pane-right" style={{ flex: 1 }}>
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
