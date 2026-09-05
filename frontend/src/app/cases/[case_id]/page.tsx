'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { api, getPdfExportUrl } from '@/lib/api';
import { AlertTriangle, ChevronLeft, Hexagon, Mail, Activity, ShieldAlert, Globe, Network, Database, ShieldCheck, CheckCircle2, Download, EyeOff, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';
import CaseTabs from '@/components/case/CaseTabs';
import { maskName, maskEmail } from '@/lib/privacy';
import { toast } from 'sonner';

export default function CaseInvestigationPage() {
  const params = useParams();
  const caseId = params?.case_id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [explanationMode, setExplanationMode] = useState<'technical' | 'layman' | 'auto'>('technical');
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aarohan_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.privacyMode === 'boolean') setPrivacyMode(parsed.privacyMode);
        if (parsed.explanationMode) setExplanationMode(parsed.explanationMode);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!caseId) return;
    const fetchCase = async () => {
      try {
        const res = await api.get(`/api/v1/cases/${caseId}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Analysis service unavailable or case not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  const handleDownloadPdf = async () => {
    if (!caseId) return;
    setDownloadingPdf(true);
    try {
      const url = getPdfExportUrl(caseId, explanationMode === 'layman', privacyMode);
      const response = await api.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `AAROHAN_Forensic_Report_${caseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Forensic PDF Report downloaded successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate PDF report.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative flex items-center justify-center w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
        </div>
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest animate-pulse">Loading Evidence...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-30 text-rose-500" />
        <h2 className="text-xl text-slate-300">Investigation Not Found</h2>
        <p className="mt-2 text-sm">{error}</p>
        <Link href="/" className="mt-6 text-indigo-400 text-sm hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Return to Command Center
        </Link>
      </div>
    );
  }

  const { assertion, trace, property, evidence_custody } = data;
  const score = assertion?.threat_score || 0;
  const severity = assertion?.severity || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MODERATE' : score >= 20 ? 'GUARDED' : 'LOW');
  
  const getSeverityStyle = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'GUARDED':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const rawSender = trace?.headers?.From || "Unknown";
  const rawReplyTo = trace?.headers?.['Reply-To'] || "None";
  const displaySender = privacyMode ? maskName(rawSender) : rawSender;
  const displayReplyTo = privacyMode ? maskName(rawReplyTo) : rawReplyTo;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-300">
      {/* Decorative vertical lines */}
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden z-0">
        <div className="w-px h-full bg-slate-800/20 max-w-7xl mx-auto flex justify-between px-4 sm:px-6 lg:px-8 relative shadow-[0_0_10px_rgba(56,189,248,0.05)]">
          <div className="w-px h-full bg-slate-800/30"></div>
          <div className="w-px h-full bg-slate-800/30 hidden md:block"></div>
          <div className="w-px h-full bg-slate-800/30 hidden lg:block"></div>
          <div className="w-px h-full bg-slate-800/30"></div>
        </div>
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50 py-2 border-b border-slate-800/50">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Command Center</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {privacyMode && (
              <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-mono font-bold tracking-widest flex items-center gap-2 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                <EyeOff className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PRIVACY MODE ACTIVE</span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-slate-400 text-[10px] sm:text-xs font-mono tracking-widest flex items-center gap-2 uppercase shadow-[0_0_8px_rgba(255,255,255,0.05)]">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> <span className="hidden sm:inline">Mode:</span> <strong className="text-slate-200">{explanationMode}</strong>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="p-2 sm:px-4 sm:py-2 rounded-full bg-cyan-600/20 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] disabled:bg-slate-800 border border-cyan-500/30 text-cyan-100 text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2"
              title="Download Forensic PDF Report"
            >
              <Download className="w-4 h-4 text-cyan-400" /> <span className="hidden sm:inline">{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Investigation Spine */}
        <div className="mb-8 border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between px-4 sm:px-8 overflow-x-auto shadow-xl">
          {[
            { label: 'EMAIL', icon: Mail },
            { label: 'FORENSICS', icon: Activity },
            { label: 'AUTH', icon: ShieldCheck },
            { label: 'THREAT', icon: ShieldAlert },
            { label: 'NETWORK', icon: Globe },
            { label: 'INTEL', icon: Globe },
            { label: 'CAMPAIGN', icon: Network },
            { label: 'GRAPH', icon: Network },
            { label: 'EVIDENCE', icon: Database }
          ].map((step, idx, arr) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-2 min-w-[50px] sm:min-w-[60px] group">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-slate-400 group-hover:text-emerald-300 transition-colors">{step.label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="h-px bg-white/10 flex-1 mx-2 sm:mx-4 min-w-[15px] sm:min-w-[20px]"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Case Header */}
        <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden mb-8 shadow-xl">
          <div className="absolute -top-12 -right-12 p-8 opacity-5 text-cyan-500 rotate-12">
            <Hexagon className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-4 border-b border-white/10 pb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-white/10 text-slate-300 border border-white/5">
                  {data.status === 'open' ? 'Active Case' : 'Closed'}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_8px_rgba(56,189,248,0.15)]">
                  {caseId}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-widest border shadow-[0_0_8px_currentColor] ${getSeverityStyle(severity)}`}>
                  SEVERITY: {severity} ({Math.round(score)}/100)
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-500 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                  Created: {new Date(data.created_at).toLocaleString()}
                </span>
              </div>
              
              <h1 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold tracking-[0.05em] text-slate-100 mb-6 break-words uppercase">
                {trace?.headers?.Subject || "(No Subject)"}
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Sender</div>
                  <div className="text-slate-200 font-mono text-xs break-all">{displaySender}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Reply-To</div>
                  <div className="text-slate-200 font-mono text-xs break-all">{displayReplyTo}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Email Date</div>
                  <div className="text-slate-200 font-mono text-xs">{trace?.headers?.Date || "Unknown"}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Evidence Hash (SHA-256)</div>
                  <div className="text-slate-400 font-mono text-[10px] break-all">{evidence_custody?.sha256_hash || "Not available"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Case Tabs Workspace */}
        <CaseTabs data={data} privacyMode={privacyMode} explanationMode={explanationMode} />
        
      </div>
    </div>
  );
}
