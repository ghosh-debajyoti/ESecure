"use client";

import React, { useState, useCallback } from "react";
import axios from "axios";
import { UploadCloud, Loader2, Bug, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SafeUserMode from "@/components/SafeUserMode";
import InvestigatorMode from "@/components/InvestigatorMode";
import StixGraph from "@/components/StixGraph";

const mockData = {
  id: 1,
  case_number: "CAS-MOCK123",
  status: "open",
  created_at: new Date().toISOString(),
  trace: {
    headers: { "From": "attacker@evil.com", "Subject": "URGENT ACTION" },
    relay_route: [
      { hop_number: 1, ip: "1.2.3.4", timestamp: "Today" },
      { hop_number: 2, ip: "8.8.8.8", timestamp: "Today" }
    ]
  },
  property: {
    indicators: [],
    attachments: [],
    mime_boundaries: [],
    tlsh_hash: "T1234567890ABCDEF"
  },
  assertion: {
    threat_score: 95.5,
    is_coordinated_campaign: true,
    lookalikes: [],
    technical_flags: { dkim_pass: false, spf_pass: false, dmarc_pass: false, technical_flag_score: 80 }
  },
  graph: {
    nodes: [
      { id: "email-1", type: "observable-email", data: { label: "Suspicious Email" } },
      { id: "ip-1.2.3.4", type: "observable-ip", data: { label: "1.2.3.4" } },
      { id: "camp-1", type: "campaign-cluster", data: { label: "Coordinated Campaign" } }
    ],
    edges: [
      { id: "e1", source: "email-1", target: "ip-1.2.3.4" },
      { id: "e2", source: "camp-1", target: "email-1" }
    ]
  },
  evidence_custody: {
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/v1/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
    } catch (err: any) {
      console.warn("Backend unavailable or error occurred, using mock data.", err);
      setError("Backend unreachable. Falling back to mock data demonstration.");
      setResult(mockData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans selection:bg-red-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center space-x-3 mb-12">
          <ShieldAlert className="w-10 h-10 text-red-500" />
          <h1 className="text-4xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
            Aarohan Threat Engine
          </h1>
        </div>

        {!result && (
          <div 
            className={`border-2 border-dashed rounded-3xl p-20 transition-all duration-300 flex flex-col items-center justify-center space-y-6
              ${file ? 'border-red-500 bg-red-500/5' : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {loading ? (
              <Loader2 className="w-16 h-16 text-red-500 animate-spin" />
            ) : (
              <UploadCloud className={`w-16 h-16 ${file ? 'text-red-500' : 'text-zinc-600'}`} />
            )}
            
            <div className="text-center">
              <h3 className="text-2xl font-bold">{file ? file.name : "Drag & Drop .eml File"}</h3>
              <p className="text-zinc-500 mt-2">or click to browse local files</p>
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
              <label htmlFor="file-upload" className="cursor-pointer px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors">
                Select File
              </label>
            )}

            {file && !loading && (
              <div className="flex space-x-4">
                <button 
                  onClick={handleUpload}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                >
                  Analyze Threat
                </button>
                <button 
                  onClick={() => setFile(null)}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {error && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 font-medium flex items-center space-x-2">
                <Bug className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Analysis Complete</h2>
                <p className="text-zinc-500 font-mono text-sm mt-1">Case: {result.case_number}</p>
              </div>
              <button 
                onClick={() => { setResult(null); setFile(null); }}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-semibold transition-colors text-sm"
              >
                New Analysis
              </button>
            </div>

            <Tabs defaultValue="safe" className="w-full">
              <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6 rounded-xl inline-flex">
                <TabsTrigger value="safe" className="rounded-lg px-6 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Safe User</TabsTrigger>
                <TabsTrigger value="investigator" className="rounded-lg px-6 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Investigator</TabsTrigger>
                <TabsTrigger value="stix" className="rounded-lg px-6 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">STIX Graph</TabsTrigger>
              </TabsList>
              
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
