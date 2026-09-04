'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { AlertTriangle, ChevronLeft, Hexagon, Mail, Activity, ShieldAlert, Globe, Network, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import CaseTabs from '@/components/case/CaseTabs';

export default function CaseInvestigationPage() {
  const params = useParams();
  const caseId = params?.case_id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    const fetchCase = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/cases/${caseId}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load case data");
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

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
  
  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Back Navigation */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors mb-6 uppercase tracking-widest">
        <ChevronLeft className="w-4 h-4" /> Command Center
      </Link>

      {/* Investigation Spine */}
      <div className="mb-8 border border-slate-800 bg-slate-900/40 rounded-xl p-4 flex items-center justify-between px-8 overflow-x-auto">
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
            <div className="flex flex-col items-center gap-2 min-w-[60px]">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">{step.label}</span>
            </div>
            {idx < arr.length - 1 && (
              <div className="h-px bg-slate-800 flex-1 mx-4 min-w-[20px]"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Case Header */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Hexagon className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-800/60 pb-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-800 text-slate-400">
                {data.status === 'open' ? 'Active Case' : 'Closed'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-800 text-slate-400">
                CASE-{caseId.split('-')[0]}
              </span>
              <span className="text-xs font-mono text-slate-500 ml-auto">
                Created: {new Date(data.created_at).toLocaleString()}
              </span>
            </div>
            
            <h1 className="text-2xl font-semibold text-slate-100 mb-6 tracking-tight break-words">
              {trace?.headers?.Subject || "(No Subject)"}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Sender</div>
                <div className="text-slate-300 font-mono text-xs break-all">{trace?.headers?.From || "Unknown"}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Reply-To</div>
                <div className="text-slate-300 font-mono text-xs break-all">{trace?.headers?.['Reply-To'] || "None"}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Email Date</div>
                <div className="text-slate-300 font-mono text-xs">{trace?.headers?.Date || "Unknown"}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Evidence Hash (SHA-256)</div>
                <div className="text-slate-500 font-mono text-xs break-all">{evidence_custody?.sha256_hash || "Not available"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Tabs Workspace */}
      <CaseTabs data={data} />
      
    </div>
  );
}
