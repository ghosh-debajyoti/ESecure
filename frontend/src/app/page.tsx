'use client';

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Upload, ChevronRight, AlertTriangle, ShieldCheck, Clock, FolderOpen, Mail, ShieldAlert, Globe, Activity, Network, Database } from 'lucide-react';
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

  useEffect(() => {
    fetchRecentCases();
  }, []);

  const fetchRecentCases = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/cases");
      setRecentCases(res.data);
    } catch (err: any) {
      console.warn("Failed to load cases: Backend unreachable or returned an error.");
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
    }, 400); // Fast simulation for visual feedback
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
      const res = await axios.post("http://127.0.0.1:8000/api/v1/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      clearInterval(progressInterval);
      setProgressStep(9);
      setAnalysisResult(res.data);
      setAnalysisStatus('complete');
      toast.success("Investigation created successfully.");
      fetchRecentCases();
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      let errorMessage = "An unexpected error occurred during analysis.";
      if (err.code === "ERR_NETWORK") {
        errorMessage = "Backend server is unreachable. Please ensure the API is running.";
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-slate-100">Investigation Command Center</h1>
        <p className="text-slate-500 mt-2 text-sm">Upload email evidence to trace infrastructure, correlate campaigns, and build attack graphs.</p>
      </div>

      {/* Primary Investigation Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Upload Flow */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-slate-800/60 bg-slate-900 flex justify-between items-center">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Start Investigation</span>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {analysisStatus === 'idle' && (
                <>
                  <div 
                    className={`relative border border-dashed rounded-lg p-10 transition-all duration-300 flex flex-col items-center justify-center text-center flex-1
                      ${isDragActive ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'}
                    `}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`w-10 h-10 mb-4 ${file ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <h3 className="text-sm font-medium text-slate-200 mb-1">
                      {file ? file.name : "Drop email evidence here"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse (.eml)"}
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

                  <p className="text-xs text-slate-500 text-center mt-6">
                    Analyze headers, authentication, infrastructure, indicators, campaign similarity and attack relationships.
                  </p>

                  {file && (
                    <div className="mt-6 flex flex-col gap-3">
                      <button 
                        onClick={handleUpload}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        Initiate Analysis
                      </button>
                    </div>
                  )}
                </>
              )}

              {analysisStatus === 'analyzing' && (
                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="relative flex items-center justify-center w-16 h-16 mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                  <div className="w-full max-w-xs space-y-3">
                    {progressStepsList.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-3 text-sm font-mono transition-opacity duration-300 ${idx < progressStep ? 'text-indigo-400 opacity-100' : idx === progressStep ? 'text-slate-200 opacity-100' : 'text-slate-600 opacity-40'}`}>
                        <div className="w-4 flex justify-center">
                          {idx < progressStep ? (
                            <span className="text-indigo-500">✓</span>
                          ) : idx === progressStep ? (
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                          ) : (
                            <span className="text-slate-700">-</span>
                          )}
                        </div>
                        <span className="text-xs">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisStatus === 'complete' && analysisResult && (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-medium text-slate-100 mb-2">Investigation Complete</h2>
                  <p className="text-sm text-slate-400 mb-8 font-mono">Case: {analysisResult.case_number}</p>
                  
                  <Link 
                    href={`/cases/${analysisResult.case_number}`}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Open Investigation Workspace <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => { setFile(null); setAnalysisStatus('idle'); setProgressStep(0); setAnalysisResult(null); }}
                    className="w-full py-3 mt-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-sm font-medium transition-colors"
                  >
                    Analyze Another
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Investigation Pipeline */}
        <div className="lg:col-span-7">
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden shadow-sm h-full">
            <div className="p-4 border-b border-slate-800/60 bg-slate-900 flex justify-between items-center">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Investigation Pipeline</span>
            </div>
            <div className="p-8">
              
              <div className="relative border-l border-slate-800 ml-4 space-y-8">
                
                {/* 1. Email Evidence */}
                <div className="relative pl-8">
                  <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-950 ${analysisStatus !== 'idle' ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-600'}`}>
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${analysisStatus !== 'idle' ? 'text-indigo-400' : 'text-slate-500'}`}>Email Evidence</h3>
                    <div className="mt-2 text-sm text-slate-400">
                      {analysisStatus === 'idle' ? 'Awaiting evidence' : analysisStatus === 'analyzing' ? 'Processing...' : '1 Message Preserved'}
                    </div>
                  </div>
                </div>

                {/* 2. Forensic Analysis */}
                <div className="relative pl-8">
                  <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-950 ${analysisStatus === 'complete' ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-600'}`}>
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${analysisStatus === 'complete' ? 'text-slate-200' : 'text-slate-500'}`}>Forensic Analysis</h3>
                    <div className="mt-2 text-sm text-slate-400">
                      {analysisStatus === 'complete' ? (
                        <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded">Headers • MIME • Auth • Indicators</span>
                      ) : 'Not analyzed'}
                    </div>
                  </div>
                </div>

                {/* 3. Threat Assessment */}
                <div className="relative pl-8">
                  <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-950 ${analysisStatus === 'complete' ? (analysisResult?.assertion?.threat_score >= 80 ? 'border-rose-500 text-rose-500' : 'border-amber-500 text-amber-500') : 'border-slate-700 text-slate-600'}`}>
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${analysisStatus === 'complete' ? 'text-slate-200' : 'text-slate-500'}`}>Threat Assessment</h3>
                    <div className="mt-2 text-sm text-slate-400">
                      {analysisStatus === 'complete' ? (
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-xl font-bold ${analysisResult?.assertion?.threat_score >= 80 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {Math.round(analysisResult?.assertion?.threat_score)} / 100
                          </span>
                        </div>
                      ) : 'Not available'}
                    </div>
                  </div>
                </div>

                {/* 4. Infrastructure Intelligence */}
                <div className="relative pl-8">
                  <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-950 ${analysisStatus === 'complete' ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-600'}`}>
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${analysisStatus === 'complete' ? 'text-slate-200' : 'text-slate-500'}`}>Infrastructure Intelligence</h3>
                    <div className="mt-2 text-sm text-slate-400">
                      {analysisStatus === 'complete' ? (
                        <span className="font-mono text-xs text-indigo-300">
                          {analysisResult?.property?.indicators?.filter((i: any) => i.type === 'URL').length || 0} URLs • {analysisResult?.property?.indicators?.filter((i: any) => i.type === 'IP').length || 0} IPs
                        </span>
                      ) : 'Not available'}
                    </div>
                  </div>
                </div>

                {/* 5. Campaign DNA */}
                <div className="relative pl-8">
                  <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-950 ${analysisStatus === 'complete' ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-600'}`}>
                    <Network className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${analysisStatus === 'complete' ? 'text-slate-200' : 'text-slate-500'}`}>Campaign DNA</h3>
                    <div className="mt-2 text-sm text-slate-400">
                      {analysisStatus === 'complete' ? (
                        analysisResult?.assertion?.is_coordinated_campaign 
                          ? <span className="text-amber-400 text-xs font-mono">Similarity match detected</span>
                          : <span className="text-slate-500 text-xs font-mono">No historical correlation</span>
                      ) : 'No correlation'}
                    </div>
                  </div>
                </div>

                {/* 6. Case / Evidence */}
                <div className="relative pl-8">
                  <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-950 ${analysisStatus === 'complete' ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-600'}`}>
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${analysisStatus === 'complete' ? 'text-slate-200' : 'text-slate-500'}`}>Case / Evidence</h3>
                    <div className="mt-2 text-sm text-slate-400">
                      {analysisStatus === 'complete' ? (
                        <span className="font-mono text-xs text-slate-500 break-all">{analysisResult?.evidence_custody?.sha256_hash}</span>
                      ) : 'Awaiting evidence generation'}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-200">Recent Investigations</h2>
          <button onClick={fetchRecentCases} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Refresh Data
          </button>
        </div>
        
        <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {casesLoading ? (
              <div className="flex items-center justify-center h-48">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Loading Records...</span>
              </div>
            ) : recentCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <FolderOpen className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm">No investigations found.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-mono text-slate-500 bg-slate-900">
                    <th className="py-3 px-4 font-normal">Case ID</th>
                    <th className="py-3 px-4 font-normal">Status</th>
                    <th className="py-3 px-4 font-normal">Subject</th>
                    <th className="py-3 px-4 font-normal">Threat Score</th>
                    <th className="py-3 px-4 font-normal">Date</th>
                    <th className="py-3 px-4 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.slice(0, 5).map((c) => (
                    <tr key={c.case_number} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3 px-4">
                        <Link href={`/cases/${c.case_number}`} className="text-sm font-mono text-indigo-400 hover:underline">
                          {c.case_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-800 text-slate-400">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-200 truncate max-w-[200px]">{c.subject || "(No Subject)"}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{c.sender || "Unknown Sender"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {c.threat_score >= 80 ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          ) : c.threat_score >= 40 ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className="text-sm font-mono text-slate-300">{Math.round(c.threat_score)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/cases/${c.case_number}`} className="inline-flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
