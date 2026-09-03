"use client";

import React, { useState, useCallback } from "react";
import axios from "axios";
import { UploadCloud, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SafeUserMode from "@/components/SafeUserMode";
import InvestigatorMode from "@/components/InvestigatorMode";
import StixGraph from "@/components/StixGraph";
import AnalysisDashboard from "@/components/AnalysisDashboard";


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isDragActive, setIsDragActive] = useState(false);

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

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/v1/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
      toast.success("Threat analysis completed successfully");
    } catch (err: any) {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center space-x-3 mb-12">
          <ShieldAlert className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Aarohan Threat Engine
          </h1>
        </div>

        {!result && (
          <div 
            className={`rounded-3xl p-20 transition-all duration-300 flex flex-col items-center justify-center space-y-6 bg-white/5 border backdrop-blur-md
              ${isDragActive ? 'border-blue-400/50 bg-white/10 scale-[1.02]' : 'border-white/10 hover:bg-white/10 hover:border-white/20'}`}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {loading ? (
              <div className="relative flex items-center justify-center w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
              </div>
            ) : (
              <UploadCloud className={`w-20 h-20 transition-colors ${file ? 'text-emerald-400' : 'text-slate-500'}`} />
            )}
            
            <div className="text-center">
              <h3 className="text-2xl font-bold tracking-tight text-slate-100">{file ? file.name : "Drag & Drop .eml File"}</h3>
              <p className="text-slate-400 mt-2 text-sm font-medium">or click to browse local files</p>
            </div>
            
            {!file && (
              <input 
                type="file" 
                accept=".eml" 
                className="hidden" 
                id="file-upload" 
                onChange={(e) => e.target.files && setFile(e.target.files[0])} 
              />
            )}
            {!file && (
              <label htmlFor="file-upload" className="cursor-pointer px-8 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full font-bold hover:bg-blue-500/20 transition-colors">
                Select File
              </label>
            )}

            {file && !loading && (
              <div className="flex space-x-4 mt-4">
                <button 
                  onClick={handleUpload}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white rounded-full font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                >
                  Analyze Threat
                </button>
                <button 
                  onClick={() => setFile(null)}
                  className="px-8 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 rounded-full font-bold transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {loading && (
              <div className="text-blue-400 text-sm font-mono tracking-widest uppercase animate-pulse mt-4">
                Extracting Telemetry...
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Analysis Complete</h2>
                <p className="text-slate-500 font-mono text-sm mt-1">Case: {result.case_number}</p>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={`http://127.0.0.1:8000/api/v1/export/${result.case_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-slate-200 rounded-full font-semibold transition-colors text-sm"
                >
                  <UploadCloud className="w-4 h-4 rotate-180" />
                  Download Forensic Report
                </a>
                <button 
                  onClick={() => { setResult(null); setFile(null); }}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full font-semibold transition-colors text-sm"
                >
                  New Analysis
                </button>
              </div>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6 rounded-xl inline-flex backdrop-blur-sm">
                <TabsTrigger value="dashboard" className="rounded-lg px-6 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Forensics Dashboard</TabsTrigger>
                <TabsTrigger value="safe" className="rounded-lg px-6 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Safe User</TabsTrigger>
                <TabsTrigger value="investigator" className="rounded-lg px-6 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Investigator</TabsTrigger>
                <TabsTrigger value="stix" className="rounded-lg px-6 data-[state=active]:bg-slate-800 data-[state=active]:text-white">STIX Graph</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="mt-0 outline-none">
                <AnalysisDashboard data={result} />
              </TabsContent>

              <TabsContent value="safe" className="mt-0 outline-none">
                <SafeUserMode assertion={result.assertion} />
              </TabsContent>
              
              <TabsContent value="investigator" className="mt-0 outline-none">
                <InvestigatorMode data={result} />
              </TabsContent>
              
              <TabsContent value="stix" className="mt-0 outline-none">
                <StixGraph data={result.graph} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
}
