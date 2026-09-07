'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Upload, ChevronRight, AlertTriangle, ShieldCheck, Clock, FolderOpen, Mail, ShieldAlert, Globe, Activity, Network, Database, RefreshCw, Hexagon } from 'lucide-react';
import Link from 'next/link';

export default function CommandCenter() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  
  // Analysis State
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle');
  const [progressStep, setProgressStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const [isDragActive, setIsDragActive] = useState(false);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  useEffect(() => {
    fetchRecentCases();
  }, []);

  const fetchRecentCases = async () => {
    setCasesLoading(true);
    try {
      const res = await api.get("/api/v1/cases");
      setRecentCases(res.data);
      setBackendUnavailable(false);
    } catch (err: any) {
      console.warn("Failed to load cases: Backend unreachable or returned an error.");
      setBackendUnavailable(true);
    } finally {
      setCasesLoading(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const simulateProgress = () => {
    setProgressStep(1);
    let step = 1;
    const interval = setInterval(() => {
      if (step >= 8) {
        clearInterval(interval);
      } else {
        step++;
        setProgressStep(step);
      }
    }, 400);
    return interval;
  };

  const handleUpload = async () => {
    if (!file) return;
    setAnalysisStatus('analyzing');
    setAnalysisResult(null);
    
    const progressInterval = simulateProgress();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/v1/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      clearInterval(progressInterval);
      setProgressStep(9);
      setAnalysisResult(res.data);
      setAnalysisStatus('complete');
      setBackendUnavailable(false);
      toast.success("Investigation created successfully.");
      fetchRecentCases();
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      let errorMessage = "An unexpected error occurred during analysis.";
      if (err.code === "ERR_NETWORK" || !err.response) {
        errorMessage = "Analysis service unavailable. Please click Retry Connection when service is restored.";
        setBackendUnavailable(true);
      } else if (err.response?.status >= 500) {
        errorMessage = `Server Error (${err.response.status}): The threat engine failed to process the file.`;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      toast.error(errorMessage);
      setAnalysisStatus('idle');
      setProgressStep(0);
    }
  };

  const progressStepsList = [
    "Evidence received",
    "Parsing email structure",
    "Inspecting authentication",
    "Calculating threat score",
    "Extracting indicators",
    "Resolving infrastructure intelligence",
    "Correlating campaign DNA",
    "Building attack graph",
    "Creating forensic case"
  ];

  const handleLoadSample = (type: 'phishing' | 'benign') => {
    let content = "";
    let filename = "";
    if (type === 'phishing') {
      filename = "sample_phishing.eml";
      content = `From: Security Team <admin@paypal-security.com>\nReply-To: attacker@evil-phish-domain.com\nTo: victim@company.com\nSubject: URGENT: Account Security Verification Required\nDate: Thu, 03 Sep 2026 10:15:00 +0000\nMessage-ID: <suspicious-999@paypal-security.com>\nAuthentication-Results: mx.company.com; dmarc=fail; spf=fail; dkim=fail\nReceived: from gateway.company.com ([142.250.190.46]) by mx.company.com; Thu, 03 Sep 2026 10:15:00 +0000\nReceived: from unknown-attacker.net ([45.33.32.156]) by gateway.company.com; Thu, 03 Sep 2026 10:14:50 +0000\n\nDear Customer,\n\nWe detected unauthorized access attempts on your account. Click below to verify identity:\nhttp://paypal-security-update.com/login-verify\n\nRegards,\nSecurity Operations`;
    } else {
      filename = "sample_benign.eml";
      content = `From: Alice Smith <alice@acmecorp.com>\nReply-To: alice@acmecorp.com\nTo: Bob Jones <bob@acmecorp.com>\nSubject: Q4 Project Roadmap Discussion\nDate: Thu, 03 Sep 2026 11:00:00 +0000\nMessage-ID: <valid-msg-777@acmecorp.com>\nAuthentication-Results: mx.company.com; dmarc=pass; spf=pass; dkim=pass\nReceived: from mail.acmecorp.com ([198.51.100.12]) by mx.company.com; Thu, 03 Sep 2026 11:00:00 +0000\n\nHi Bob,\n\nHere is the quarterly project roadmap review. Everything is progressing according to schedule.\n\nBest regards,\nAlice`;
    }
    const sampleFile = new File([content], filename, { type: "text/plain" });
    setFile(sampleFile);
    toast.info(`Loaded ${type} sample email evidence.`);
  };

  const getSeverityBadge = (score: number) => {
    if (score >= 80) return { label: 'CRITICAL', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]' };
    if (score >= 60) return { label: 'HIGH', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.3)]' };
    if (score >= 40) return { label: 'MODERATE', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]' };
    if (score >= 20) return { label: 'GUARDED', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_8px_rgba(14,165,233,0.3)]' };
    return { label: 'LOW', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]' };
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-8 max-w-7xl mx-auto flex flex-col items-center animate-in fade-in duration-1000 z-10">
      
      {/* Decorative Atmos Background Globe/Particles */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] opacity-30 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent blur-[100px]"></div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] border border-white/5 rounded-full pointer-events-none -z-10 shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] border-dashed opacity-20"></div>
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] border border-primary/20 rounded-full pointer-events-none -z-10 shadow-[0_0_80px_rgba(59,130,246,0.1)] border-dotted opacity-40"></div>

      {backendUnavailable && (
        <div className="w-full max-w-3xl mb-8 border border-rose-500/30 bg-rose-500/10 rounded-xl p-4 flex items-center justify-between animate-in fade-in duration-300 shadow-[0_0_20px_rgba(244,63,94,0.1)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 glow-text" />
            <div>
              <h4 className="text-sm font-medium text-rose-200">Analysis service unavailable</h4>
              <p className="text-xs text-rose-300/80">The forensic backend engine is currently offline or unreachable.</p>
            </div>
          </div>
          <button 
            onClick={fetchRecentCases} 
            className="px-4 py-2 text-xs font-medium bg-rose-500/20 text-rose-200 border border-rose-500/40 rounded-full hover:bg-rose-500/30 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center mt-12 mb-16 space-y-6 w-full max-w-4xl relative">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-sm pb-2">
          Manage threat data<br/>from source to insights
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl font-light">
          Collect evidence, process it through advanced analysis, and surface key indicators to track attacks in real-time.
        </p>
      </div>

      {/* Main Action Zone (Upload + Pipeline) */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20 relative z-20">
        
        {/* Left: Upload Flow */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <span className="text-xs font-medium text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Data Collection
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleLoadSample('phishing')} className="px-3 py-1.5 text-[10px] font-mono bg-white/5 text-muted-foreground border border-white/10 rounded-full hover:text-white hover:border-white/30 transition-colors">
                  Phishing Sample
                </button>
                <button onClick={() => handleLoadSample('benign')} className="px-3 py-1.5 text-[10px] font-mono bg-white/5 text-muted-foreground border border-white/10 rounded-full hover:text-white hover:border-white/30 transition-colors">
                  Benign Sample
                </button>
              </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col relative">
              {analysisStatus === 'idle' && (
                <>
                  <div 
                    className={`relative border border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center flex-1 z-10
                      ${isDragActive ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
                    `}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`w-10 h-10 mb-5 transition-colors ${file ? 'text-primary glow-primary' : 'text-muted-foreground'}`} />
                    <h3 className="text-base font-medium text-white mb-2">
                      {file ? file.name : "Upload Email Evidence"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : "Drag and drop or click to browse (.eml)"}
                    </p>
                    {!file && (
                      <input 
                        type="file" 
                        accept=".eml" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={(e) => e.target.files && setFile(e.target.files[0])} 
                      />
                    )}
                  </div>

                  {file && (
                    <div className="mt-6 flex flex-col z-20">
                      <button 
                        onClick={handleUpload}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                      >
                        Initiate Threat Forensics
                      </button>
                    </div>
                  )}
                </>
              )}

              {analysisStatus === 'analyzing' && (
                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="relative flex items-center justify-center w-20 h-20 mb-10">
                    <div className="absolute inset-0 rounded-full border border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border border-primary border-t-transparent animate-spin glow-primary"></div>
                    <Activity className="w-6 h-6 text-primary glow-primary animate-pulse" />
                  </div>
                  <div className="w-full max-w-xs space-y-4">
                    {progressStepsList.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-3 text-sm transition-all duration-300 ${idx < progressStep ? 'text-primary' : idx === progressStep ? 'text-white font-medium' : 'text-muted-foreground opacity-50'}`}>
                        <div className="w-4 flex justify-center">
                          {idx < progressStep ? (
                            <span className="text-primary glow-primary">✓</span>
                          ) : idx === progressStep ? (
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]"></span>
                          ) : (
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                          )}
                        </div>
                        <span className="tracking-wide text-xs">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisStatus === 'complete' && analysisResult && (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] relative">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-20"></div>
                    <ShieldCheck className="w-10 h-10 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Investigation Complete</h2>
                  <p className="text-sm text-muted-foreground mb-8">Case ID: <span className="font-mono text-white/80">{analysisResult.case_number}</span></p>
                  
                  <Link 
                    href={`/cases/${analysisResult.case_number}`}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
                  >
                    View Insights <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => { setFile(null); setAnalysisStatus('idle'); setProgressStep(0); setAnalysisResult(null); }}
                    className="w-full py-4 mt-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Analyze Another
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Feature Highlights / Investigation Pipeline */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="glass-panel rounded-2xl p-8 flex flex-col h-[400px] justify-between relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex gap-6 border-b border-white/5 pb-8">
                 <div className="mt-1">
                   <Network className="w-5 h-5 text-primary glow-primary" />
                 </div>
                 <div>
                   <h3 className="text-white font-medium mb-2">System Analysis</h3>
                   <p className="text-sm text-muted-foreground leading-relaxed">Analyze environmental performance, detect patterns, and monitor system behavior continuously.</p>
                 </div>
              </div>
              
              <div className="flex gap-6">
                 <div className="mt-1">
                   <Activity className="w-5 h-5 text-primary glow-primary" />
                 </div>
                 <div className="w-full">
                   <h3 className="text-white font-medium mb-4">Live Metrics</h3>
                   <div className="grid grid-cols-2 gap-3 w-full">
                      <div className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10 transition-colors cursor-default text-center">Threat Output</div>
                      <div className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10 transition-colors cursor-default text-center">Severity Usage</div>
                      <div className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10 transition-colors cursor-default text-center">Campaign Trends</div>
                      <div className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10 transition-colors cursor-default text-center">Network Signals</div>
                   </div>
                 </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Recent Cases Data Table */}
      <div className="w-full max-w-5xl mt-12 mb-20 relative z-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Recent Insights</h2>
            <p className="text-muted-foreground">Monitor system activity in real time across regions</p>
          </div>
          <button onClick={fetchRecentCases} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            {casesLoading ? (
              <div className="flex items-center justify-center h-48">
                <span className="text-sm font-medium text-muted-foreground">Loading Records...</span>
              </div>
            ) : recentCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <FolderOpen className="w-8 h-8 mb-3 opacity-30" />
                <span className="text-sm">No investigations found.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-muted-foreground bg-white/[0.02]">
                    <th className="py-4 px-6 font-medium tracking-wide">Case ID</th>
                    <th className="py-4 px-6 font-medium tracking-wide">Status</th>
                    <th className="py-4 px-6 font-medium tracking-wide">Subject</th>
                    <th className="py-4 px-6 font-medium tracking-wide">Threat Score</th>
                    <th className="py-4 px-6 font-medium tracking-wide">Date</th>
                    <th className="py-4 px-6 font-medium tracking-wide text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.slice(0, 8).map((c) => {
                    const badge = getSeverityBadge(c.threat_score || 0);
                    return (
                      <tr key={c.case_number} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                        <td className="py-4 px-6">
                          <Link href={`/cases/${c.case_number}`} className="text-sm font-mono text-white group-hover:text-primary transition-colors">
                            {c.case_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-white truncate max-w-[200px] mb-1">{c.subject || "(No Subject)"}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.sender || "Unknown Sender"}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}>
                            {badge.label} ({Math.round(c.threat_score)})
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href={`/cases/${c.case_number}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-white/10 hover:border-primary/30 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
