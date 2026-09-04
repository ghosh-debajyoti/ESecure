'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, AlertTriangle, ChevronRight, FolderOpen, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/cases?limit=100");
      setCases(res.data);
    } catch (err) {
      console.warn("Failed to load cases", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => 
    c.case_number.toLowerCase().includes(search.toLowerCase()) ||
    (c.subject && c.subject.toLowerCase().includes(search.toLowerCase())) ||
    (c.sender && c.sender.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-slate-100">Case Management</h1>
          <p className="text-slate-500 mt-2 text-sm">Review and manage historical forensic investigations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search cases..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 w-64 transition-colors"
            />
          </div>
          <button className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-xs font-mono text-slate-500 uppercase">
                <th className="py-4 px-6 font-normal">Case ID</th>
                <th className="py-4 px-6 font-normal">Status</th>
                <th className="py-4 px-6 font-normal">Subject</th>
                <th className="py-4 px-6 font-normal">Threat Score</th>
                <th className="py-4 px-6 font-normal">Date</th>
                <th className="py-4 px-6 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="relative flex items-center justify-center w-8 h-8">
                        <div className="absolute inset-0 rounded-full border-2 border-slate-800"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                      </div>
                      <span className="text-xs font-mono uppercase tracking-widest">Loading Records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <FolderOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <span className="text-sm">No investigations found.</span>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isCritical = c.threat_score >= 80;
                  const isWarning = c.threat_score >= 40 && c.threat_score < 80;
                  
                  return (
                    <tr key={c.case_number} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-6">
                        <Link href={`/cases/${c.case_number}`} className="text-sm font-mono text-indigo-400 hover:underline">
                          {c.case_number}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-800 text-slate-400">
                          {c.status === 'open' ? 'Active' : c.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-slate-200 truncate max-w-[300px]">{c.subject || "(No Subject)"}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[300px]">{c.sender || "Unknown Sender"}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {isCritical ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className="text-sm font-mono text-slate-300">{Math.round(c.threat_score)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link href={`/cases/${c.case_number}`} className="inline-flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
