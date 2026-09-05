'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const NetworkMap = dynamic(() => import('@/components/case/NetworkMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-mono">Loading map...</span>
      </div>
    </div>
  ),
});
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ShieldCheck, Zap, Globe, FileWarning, Search, Key, Network, Activity, Database, Mail, MapPin, Target, Eye, ChevronRight, Share2, EyeOff, BookOpen } from 'lucide-react';

import StixGraph from '@/components/StixGraph';
import Link from 'next/link';

import { maskName, maskEmail } from '@/lib/privacy';
import { LAYMAN_EXPLANATIONS } from '@/lib/laymanExplanations';
import ThreatFindings from '@/components/case/ThreatFindings';
import RecommendedPrecautions from '@/components/case/RecommendedPrecautions';

export default function CaseTabs({ 
  data, 
  privacyMode = false, 
  explanationMode = 'technical' 
}: { 
  data: any; 
  privacyMode?: boolean; 
  explanationMode?: string; 
}) {
  const { trace, property, assertion, evidence_custody, graph } = data;
  
  // Helpers
  const flags = assertion?.technical_flags || {};
  const lookalikes = assertion?.lookalikes || [];
  const scoreBreakdown = assertion?.threat_score_breakdown || {};
  
  // Risk factors & reducers from backend (or fallback)
  const riskIncreasers = assertion?.risk_increasers || [];
  const riskReducers = assertion?.risk_reducers || [];

  const numHops = trace?.relay_route?.length || 0;
  const numIndicators = property?.indicators?.length || 0;
  const numAttachments = property?.attachments?.length || 0;
  const numMime = property?.mime_boundaries?.length || 0;

  const getIndicatorCounts = () => {
    let ips = 0, domains = 0, urls = 0;
    property?.indicators?.forEach((i: any) => {
      const type = typeof i === 'object' ? i.type : 'UNKNOWN';
      if (type === 'IP') ips++;
      if (type === 'DOMAIN') domains++;
      if (type === 'URL') urls++;
    });
    return { ips, domains, urls };
  };
  const indCounts = getIndicatorCounts();

  const rawSender = trace?.headers?.From || "Unknown";
  const rawReplyTo = trace?.headers?.['Reply-To'] || "None";
  const rawTo = trace?.headers?.To || "Undisclosed";

  const displayFrom = privacyMode ? maskName(rawSender) : rawSender;
  const displayReplyTo = privacyMode ? maskName(rawReplyTo) : rawReplyTo;
  const displayTo = privacyMode ? maskEmail(rawTo) : rawTo;

  const senderDomain = rawSender.split('@').pop()?.replace('>', '') || "Unknown";
  const replyDomain = rawReplyTo === "None" ? "None" : (rawReplyTo.split('@').pop()?.replace('>', '') || "None");
  const hasLookalike = lookalikes.length > 0;
  const relayHops = trace?.relay_route || [];
  const originHops = relayHops.filter((hop: any) => hop.ip_address || hop.ip);
  const originIps = Array.from(new Set(originHops.map((hop: any) => hop.ip_address || hop.ip))) as string[];
  const originRecords = originIps.map((ip) => originHops.find((hop: any) => (hop.ip_address || hop.ip) === ip));
  const enrichedHops = originRecords.filter((hop: any) => hop?.enrichment_status === 'available' || hop?.asn || hop?.isp || hop?.country || hop?.region);
  const selectedOriginIp = originIps[0] || null;
  const [selectedIp, setSelectedIp] = useState<string | null>(selectedOriginIp);
  const selectedHop = originRecords.find((hop: any) => (hop?.ip_address || hop?.ip) === (selectedIp || selectedOriginIp));

  const threatScore = assertion?.threat_score || 0;
  const effectiveMode = explanationMode === 'auto'
    ? (threatScore > 75 ? 'layman' : 'technical')
    : explanationMode;

  const isLaymanEffective = effectiveMode === 'layman';
  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6 rounded-xl flex w-full backdrop-blur-sm shadow-sm">
        <TabsTrigger value="overview" className="flex-1 rounded-lg py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">OVERVIEW</TabsTrigger>
        <TabsTrigger value="forensics" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">FORENSICS</TabsTrigger>
        <TabsTrigger value="authentication" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">AUTHENTICATION</TabsTrigger>
        <TabsTrigger value="network" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">NETWORK</TabsTrigger>
        <TabsTrigger value="indicators" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">INDICATORS</TabsTrigger>
        <TabsTrigger value="intelligence" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">INTELLIGENCE</TabsTrigger>
        <TabsTrigger value="attachments" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">ATTACHMENTS</TabsTrigger>
        <TabsTrigger value="campaign" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">CAMPAIGN DNA</TabsTrigger>
        <TabsTrigger value="graph" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">ATTACK GRAPH</TabsTrigger>
        <TabsTrigger value="evidence" className="flex-1 rounded-lg py-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 text-[10px] xl:text-xs font-medium tracking-wider transition-all">EVIDENCE</TabsTrigger>
      </TabsList>
      
      {/* 1. OVERVIEW TAB */}
      <TabsContent value="overview" className="mt-0 outline-none space-y-6">
        
        {/* LAYMAN / AUTO (>75) MODE: Render Threat Findings & Recommended Precautions at Top */}
        {isLaymanEffective && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <ThreatFindings data={data} />
            <RecommendedPrecautions data={data} />
          </div>
        )}

        {/* Threat Assessment */}
        <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
          <div className="border-b border-white/10 p-4 bg-white/5 flex justify-between items-center">
            <h2 className="text-[clamp(1rem,2vw,1.25rem)] font-bold tracking-[0.1em] text-slate-100 uppercase">Threat Risk Assessment</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest shadow-[0_0_8px_currentColor] ${assertion?.threat_score >= 80 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : assertion?.threat_score >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
              SCORE: {Math.round(assertion?.threat_score || 0)} / 100 ({assertion?.severity || 'LOW'})
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Risk Increasers */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-rose-400 uppercase tracking-widest mb-2 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> RISK INCREASERS (+ Risk Factors)
              </h3>
              {riskIncreasers.length > 0 ? (
                <div className="space-y-2">
                  {riskIncreasers.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/80 rounded border border-rose-500/20 text-xs">
                      <span className="text-slate-300">{f.factor}</span>
                      <span className="font-mono text-rose-400 font-bold ml-2">+{f.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded border border-slate-800">
                  No risk-increasing factors identified.
                </div>
              )}
            </div>

            {/* Risk Reducers */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> RISK REDUCERS (- Mitigating Evidence)
              </h3>
              {riskReducers.length > 0 ? (
                <div className="space-y-2">
                  {riskReducers.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/80 rounded border border-emerald-500/20 text-xs">
                      <span className="text-slate-300">{f.factor}</span>
                      <span className="font-mono text-emerald-400 font-bold ml-2">{f.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded border border-slate-800">
                  No risk-reducing evidence identified.
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Forensic Snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Mail className="w-5 h-5 text-indigo-500 mb-2" />
            <div className="text-2xl font-semibold text-slate-200">{1}</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Email</div>
          </div>
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Network className="w-5 h-5 text-indigo-500 mb-2" />
            <div className="text-2xl font-semibold text-slate-200">{numHops}</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Relay Hops</div>
          </div>
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Target className="w-5 h-5 text-indigo-500 mb-2" />
            <div className="text-2xl font-semibold text-slate-200">{numIndicators}</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Indicators</div>
          </div>
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <FileWarning className="w-5 h-5 text-indigo-500 mb-2" />
            <div className="text-2xl font-semibold text-slate-200">{numAttachments}</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Attachments</div>
          </div>
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Activity className="w-5 h-5 text-indigo-500 mb-2" />
            <div className="text-2xl font-semibold text-slate-200">{numMime}</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">MIME Parts</div>
          </div>
        </div>

        {/* Email Identity & Auth Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
            <div className="border-b border-white/10 p-4 bg-white/5">
              <h2 className="text-[clamp(1rem,2vw,1.25rem)] font-bold tracking-[0.1em] text-slate-100 uppercase">Email Identity</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-full bg-slate-800/50 border border-slate-800 rounded p-3 mb-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">From Domain</div>
                  <div className="font-mono text-sm text-slate-200">{senderDomain}</div>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <div className="w-full bg-slate-800/50 border border-slate-800 rounded p-3 mt-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Reply-To Domain</div>
                  <div className="font-mono text-sm text-slate-200">{replyDomain === "None" ? "Not specified" : replyDomain}</div>
                </div>
              </div>
              
              {flags.reply_to_mismatch && (
                <div className="mt-4 p-3 border border-rose-500/30 bg-rose-500/10 rounded flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-widest">REPLY-TO MISMATCH</span>
                </div>
              )}
              {hasLookalike && (
                <div className="mt-4 p-3 border border-rose-500/30 bg-rose-500/10 rounded flex flex-col items-center text-center gap-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-widest">LOOKALIKE DETECTED</span>
                  </div>
                  <div className="text-xs text-rose-300 mt-1">Sender domain is visually similar to a legitimate domain (Distance: {lookalikes[0]?.distance})</div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
            <div className="border-b border-white/10 p-4 bg-white/5">
              <h2 className="text-[clamp(1rem,2vw,1.25rem)] font-bold tracking-[0.1em] text-slate-100 uppercase">Email Authentication</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                <span className="text-sm font-mono text-slate-400">SPF</span>
                {flags.spf_pass ? <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold tracking-widest">PASS</span> : <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-mono font-bold tracking-widest">FAIL</span>}
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                <span className="text-sm font-mono text-slate-400">DKIM</span>
                {flags.dkim_pass ? <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold tracking-widest">PASS</span> : <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-mono font-bold tracking-widest">FAIL</span>}
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                <span className="text-sm font-mono text-slate-400">DMARC</span>
                {flags.dmarc_pass ? <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold tracking-widest">PASS</span> : <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-mono font-bold tracking-widest">FAIL</span>}
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="text-sm font-mono text-slate-400">ALIGNMENT</span>
                {!flags.reply_to_mismatch ? <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold tracking-widest">ALIGNED</span> : <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-mono font-bold tracking-widest">MISMATCH</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Campaign DNA Preview */}
        <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
          <div className="border-b border-white/10 p-4 bg-white/5 flex justify-between items-center">
            <h2 className="text-[clamp(1rem,2vw,1.25rem)] font-bold tracking-[0.1em] text-slate-100 uppercase">Campaign DNA Correlation</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Evidence TLSH</div>
                <div className="font-mono text-xs bg-slate-950 border border-slate-800 rounded p-3 text-indigo-400 break-all">
                  {property?.tlsh_hash || "NO HASH GENERATED"}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Historical Correlation</div>
                {assertion?.is_coordinated_campaign ? (
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded bg-rose-500/10 text-rose-500 text-xs font-mono font-bold tracking-widest border border-rose-500/30">MATCH DETECTED</span>
                    <span className="text-sm text-slate-300">Similarity implies coordinated campaign</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs font-mono font-bold tracking-widest">NO HISTORICAL CORRELATION</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TECHNICAL MODE (or AUTO <=75): Render Threat Findings & Precautions in Collapsed Accordion at Bottom */}
        {!isLaymanEffective && (
          <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden mt-6 shadow-xl">
            <button 
              type="button"
              onClick={() => setAccordionOpen(!accordionOpen)}
              className="w-full p-4 bg-white/5 flex justify-between items-center text-left hover:bg-white/10 transition-colors border-b border-white/5"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-slate-200">Threat Findings & Recommended Precautions (Non-Technical Summary)</h3>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${accordionOpen ? 'rotate-90' : ''}`} />
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${accordionOpen ? 'max-h-[2000px] opacity-100 border-t border-white/10' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950/50">
                <ThreatFindings data={data} />
                <RecommendedPrecautions data={data} />
              </div>
            </div>
          </div>
        )}

      </TabsContent>

      {/* 2. FORENSICS TAB */}
      <TabsContent value="forensics" className="mt-0 outline-none space-y-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800 p-4 bg-slate-900">
            <h3 className="text-sm font-medium text-slate-200">Parsed Email Headers</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">From:</span> <span className="text-sm font-mono text-slate-300 break-all">{displayFrom}</span></div>
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">Reply-To:</span> <span className="text-sm font-mono text-slate-300 break-all">{displayReplyTo}</span></div>
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">To:</span> <span className="text-sm font-mono text-slate-300 break-all">{displayTo}</span></div>

            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">Subject:</span> <span className="text-sm font-mono text-slate-300 break-all">{trace?.headers?.Subject}</span></div>
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">Date:</span> <span className="text-sm font-mono text-slate-300 break-all">{trace?.headers?.Date}</span></div>
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">Message-ID:</span> <span className="text-sm font-mono text-slate-300 break-all">{trace?.headers?.['Message-ID']}</span></div>
            <div className="space-y-1 col-span-1 md:col-span-2"><span className="text-xs font-mono text-slate-500">Auth-Results:</span> <span className="text-sm font-mono text-slate-300 break-all">{trace?.headers?.['Authentication-Results']}</span></div>
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800 p-4 bg-slate-900">
            <h3 className="text-sm font-medium text-slate-200">Raw Body (Untrusted Content)</h3>
          </div>
          <div className="p-4 bg-[#0a0a0a] overflow-auto max-h-[600px]">
            <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap break-words">
              {trace?.body || "No body content extracted."}
            </pre>
          </div>
        </div>
      </TabsContent>

      {/* 3. AUTHENTICATION TAB */}
      <TabsContent value="authentication" className="mt-0 outline-none space-y-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-xs font-mono text-slate-500 uppercase">
                <th className="py-3 px-6 font-normal w-1/4">Protocol</th>
                <th className="py-3 px-6 font-normal w-1/4">Result</th>
                <th className="py-3 px-6 font-normal w-1/2">Technical Rationale</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="py-4 px-6 text-slate-300 font-medium">SPF Alignment</td>
                <td className="py-4 px-6">
                  {flags.spf_pass ? (
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20">PASS</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 font-mono text-xs border border-rose-500/20">FAIL</span>
                  )}
                </td>
                <td className="py-4 px-6 text-slate-400 text-xs">Sender Policy Framework validation of the sending IP address against the domain's authorized hosts.</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="py-4 px-6 text-slate-300 font-medium">DKIM Signature</td>
                <td className="py-4 px-6">
                  {flags.dkim_pass ? (
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20">PASS</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 font-mono text-xs border border-rose-500/20">FAIL</span>
                  )}
                </td>
                <td className="py-4 px-6 text-slate-400 text-xs">DomainKeys Identified Mail cryptographic signature validation to ensure content integrity in transit.</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="py-4 px-6 text-slate-300 font-medium">DMARC Policy</td>
                <td className="py-4 px-6">
                  {flags.dmarc_pass ? (
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20">PASS</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 font-mono text-xs border border-rose-500/20">FAIL</span>
                  )}
                </td>
                <td className="py-4 px-6 text-slate-400 text-xs">Domain-based Message Authentication alignment enforcement. Requires valid SPF or DKIM alignment.</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="py-4 px-6 text-slate-300 font-medium">Reply-To Consistency</td>
                <td className="py-4 px-6">
                  {!flags.reply_to_mismatch ? (
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20">ALIGNED</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 font-mono text-xs border border-rose-500/20">MISMATCH</span>
                  )}
                </td>
                <td className="py-4 px-6 text-slate-400 text-xs">Sender domain ({senderDomain}) differs from Reply-To domain ({replyDomain}). Often indicates spoofing intent.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabsContent>

      {/* 4. NETWORK TAB */}
      <TabsContent value="network" className="mt-0 outline-none space-y-8">
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* ── Interactive Geo-Map ── */}
          <div className="flex flex-col h-[300px] xl:h-auto min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold tracking-[0.1em] text-slate-100 uppercase">Network Trace</h2>
              {(trace?.relay_route || []).filter((h: any) => h.latitude != null && h.longitude != null).length > 0 && (
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold tracking-widest border border-cyan-500/30 shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                  {(trace?.relay_route || []).filter((h: any) => h.latitude != null && h.longitude != null).length} HOPS MAPPED
                </span>
              )}
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-white/5 backdrop-blur-md">
              <NetworkMap hops={trace?.relay_route || []} />
            </div>
          </div>

          {/* ── Relay Route Timeline ── */}
          <div className="flex flex-col h-full max-h-[800px]">
            <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold tracking-[0.1em] text-slate-100 uppercase mb-4">Relay Route Timeline</h2>
            <div className="relative pl-6 border-l border-white/10 space-y-12 overflow-y-auto pr-4 pb-12 pt-4 hide-scrollbar">
          {(trace?.relay_route || []).map((hop: any, i: number, arr: any[]) => {
            const hopNum = hop.hop_number || i + 1;
            const isOrigin = i === 0;
            const isFinal = i === arr.length - 1;
            const dotColor = isOrigin ? 'bg-rose-500' : isFinal ? 'bg-emerald-500' : 'bg-indigo-500';
            const dotGlow = isOrigin ? 'shadow-rose-500/40' : isFinal ? 'shadow-emerald-500/40' : 'shadow-indigo-500/40';
            const labelColor = isOrigin ? 'text-rose-400' : isFinal ? 'text-emerald-400' : 'text-slate-300';
            const label = isOrigin ? 'ORIGIN' : isFinal ? 'DESTINATION' : `RELAY`;

            return (
              <div key={i} className="relative group">
                {/* Delay badge between hops */}
                {i > 0 && hop.delay_seconds != null && hop.delay_seconds > 0 && (
                  <div className="absolute -top-6 left-0 ml-8">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${hop.delay_seconds > 30 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800/60 text-slate-500 border-slate-700'}`}>
                      +{hop.delay_seconds.toFixed(1)}s delay
                    </span>
                  </div>
                )}
                {/* Timeline dot */}
                <div className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-slate-900 ${dotColor} shadow-lg ${dotGlow} transition-colors group-hover:brightness-125`}></div>
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 ml-4 transition-colors hover:border-slate-700">
                  <div className="flex justify-between items-start mb-4 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold uppercase tracking-widest ${labelColor}`}>HOP {hopNum}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-widest ${isOrigin ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : isFinal ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>{label}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{hop.timestamp || "Time Unavailable"}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">IP Address</div>
                      <div className="text-sm font-mono text-indigo-300">{hop.ip_address || hop.ip || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Server / HELO</div>
                      <div className="text-sm font-mono text-slate-300">{hop.server_name || hop.helo_domain || "Unknown"}</div>
                    </div>
                    {(hop.country || hop.city) && (
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Location</div>
                        <div className="text-sm text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {[hop.city, hop.region, hop.country].filter(Boolean).join(', ')}</div>
                      </div>
                    )}
                    {hop.isp && (
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">ISP / ASN</div>
                        <div className="text-sm text-slate-400">{hop.isp}{hop.asn ? ` · ${hop.asn}` : ''}</div>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded text-xs font-mono text-slate-500 truncate" title={hop.raw_header || hop.raw}>
                    {hop.raw_header || hop.raw || "No raw header available"}
                  </div>
                </div>
              </div>
            );
          })}
          {(!trace?.relay_route || trace.relay_route.length === 0) && (
            <div className="text-sm text-slate-500 italic ml-4">No relay route extracted from headers.</div>
          )}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* 5. INDICATORS TAB */}
      <TabsContent value="indicators" className="mt-0 outline-none space-y-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl text-center">
            <div className="text-2xl font-mono text-indigo-400 mb-1">{indCounts.ips}</div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">IP Addresses</div>
          </div>
          <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl text-center">
            <div className="text-2xl font-mono text-indigo-400 mb-1">{indCounts.domains}</div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">Domains</div>
          </div>
          <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl text-center">
            <div className="text-2xl font-mono text-indigo-400 mb-1">{indCounts.urls}</div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">URLs</div>
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-xs font-mono text-slate-500 uppercase">
                <th className="py-3 px-6 font-normal w-1/6">Type</th>
                <th className="py-3 px-6 font-normal w-1/2">Value</th>
                <th className="py-3 px-6 font-normal">Reputation</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(property?.indicators || []).map((ind: any, i: number) => {
                const val = typeof ind === 'object' ? ind.value : ind;
                const type = typeof ind === 'object' ? ind.type : 'UNKNOWN';
                const flagged = ind?.reputation?.is_flagged;
                return (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 px-6">
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{type}</span>
                    </td>
                    <td className="py-3 px-6 text-slate-200 font-mono break-all">{val}</td>
                    <td className="py-3 px-6">
                      {flagged ? (
                        <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono text-xs font-bold tracking-widest">MALICIOUS</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono text-xs tracking-widest">UNKNOWN</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!property?.indicators || property.indicators.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">No indicators extracted from email content.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      {/* 6. INTELLIGENCE TAB */}
      <TabsContent value="intelligence" className="mt-0 outline-none space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden md:col-span-2">
            <div className="border-b border-slate-800 p-4 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-slate-200 uppercase tracking-wider">Origin Infrastructure</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Received-header evidence and enrichment</p>
              </div>
              {originIps.length > 0 && (
                <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-slate-400">Extracted IPs <strong className="text-indigo-300">{originIps.length}</strong></span>
                  <span className="text-emerald-400">Enriched <strong>{enrichedHops.length}</strong></span>
                  <span className="text-amber-400">Unenriched <strong>{originIps.length - enrichedHops.length}</strong></span>
                </div>
              )}
            </div>
            <div className="p-4">
              {originIps.length === 0 ? (
                <div className="py-2">
                  <div className="text-xs font-mono uppercase tracking-widest text-slate-300">No origin IP address was extracted from the available email evidence.</div>
                  <div className="text-xs text-slate-500 mt-2">Origin IP intelligence cannot be determined from this evidence.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)] gap-5">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Relay Path</div>
                    <div className="space-y-1">
                      {relayHops.map((hop: any, index: number) => {
                        const ip = hop.ip_address || hop.ip;
                        const isSelected = ip && selectedIp === ip;
                        return (
                          <React.Fragment key={`${ip || 'no-ip'}-${hop.hop_number || index}`}>
                            <button type="button" disabled={!ip} onClick={() => ip && setSelectedIp(ip)} className={`w-full text-left border p-3 transition-colors ${isSelected ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/50'} ${ip ? 'hover:border-slate-700' : 'cursor-default opacity-70'}`}>
                              <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">Hop {hop.hop_number || index + 1}</span>
                              <span className={`block mt-1 text-sm font-mono break-all ${ip ? 'text-indigo-300' : 'text-slate-500'}`}>{ip || 'IP not extracted'}</span>
                              {hop.server_name && <span className="block mt-1 text-[10px] font-mono text-slate-500 truncate">HELO {hop.server_name}</span>}
                            </button>
                            {index < relayHops.length - 1 && <div className="text-center text-slate-600 text-xs">↓</div>}
                          </React.Fragment>
                        );
                      })}
                      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-600 pt-1">Final received-header hop</div>
                    </div>
                  </div>
                  <div className="border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Selected Origin IP</div>
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${selectedHop?.enrichment_status === 'available' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedHop?.enrichment_status === 'available' ? 'Enrichment available' : selectedHop?.enrichment_status === 'no_data' ? 'No enrichment data returned' : 'Enrichment unavailable'}
                      </span>
                    </div>
                    <div className="text-lg font-mono text-indigo-300 mb-4">{selectedIp}</div>
                    {selectedHop?.enrichment_status !== 'available' && !selectedHop?.asn && !selectedHop?.isp && !selectedHop?.country && !selectedHop?.region && (
                      <p className="text-xs text-slate-400 border-l-2 border-amber-500/50 pl-3">{selectedHop?.enrichment_reason || (selectedHop?.enrichment_status === 'no_data' ? 'No enrichment data was returned for this address.' : 'The enrichment lookup could not be completed for this address.')}</p>
                    )}
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4 mt-4">
                      {([['ASN', selectedHop?.asn], ['ISP', selectedHop?.isp], ['Country', selectedHop?.country], ['Region', selectedHop?.region]] as const).map(([label, value]) => (
                        <div key={label}>
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</div>
                          <div className="text-xs font-mono text-slate-300 break-words">{value || 'Unavailable'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
            <div className="border-b border-slate-800 p-4 bg-slate-900">
              <h3 className="text-sm font-medium text-slate-200">Lookalike Domain Analysis</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Sender Domain</div>
                  <div className="text-lg font-mono text-slate-300">{senderDomain}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Reply-To Domain</div>
                  <div className="text-lg font-mono text-slate-300">{replyDomain === "None" ? "Not specified" : replyDomain}</div>
                </div>
                {hasLookalike ? (
                  <div className="p-4 border border-rose-500/30 bg-rose-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-mono font-bold uppercase tracking-widest text-rose-400">Lookalike Detected</span>
                    </div>
                    <div className="text-xs text-rose-300">
                      The sender domain strongly resembles a known brand domain. 
                      <span className="block mt-1 font-mono">Levenshtein distance: {lookalikes[0]?.distance}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-mono font-bold uppercase tracking-widest text-emerald-400">No Lookalike Detected</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* 7. ATTACHMENTS TAB */}
      <TabsContent value="attachments" className="mt-0 outline-none space-y-6">
        <div className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-xl flex flex-col md:flex-row items-center gap-4 text-amber-500">
          <EyeOff className="w-6 h-6 shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Security Precaution:</span> Attachment execution and preview is strictly disabled. Download raw evidence artifacts in an isolated forensic environment to safely inspect payloads.
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-xs font-mono text-slate-500 uppercase">
                <th className="py-3 px-6 font-normal">Filename</th>
                <th className="py-3 px-6 font-normal">MIME Type</th>
                <th className="py-3 px-6 font-normal">Size</th>
                <th className="py-3 px-6 font-normal">SHA-256</th>
                <th className="py-3 px-6 font-normal">Verdict</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(property?.attachments || []).map((att: any, i: number) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-4 px-6 text-slate-200 font-mono text-xs">{att.filename}</td>
                  <td className="py-4 px-6 text-slate-400 font-mono text-xs">{att.mime_type}</td>
                  <td className="py-4 px-6 text-slate-400 text-xs">{Math.round(att.size / 1024)} KB</td>
                  <td className="py-4 px-6 text-indigo-400 font-mono text-xs max-w-[200px] truncate" title={att.sha256}>{att.sha256}</td>
                  <td className="py-4 px-6">
                    {att.is_suspicious ? (
                      <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono text-xs font-bold tracking-widest">MALICIOUS</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono text-xs tracking-widest">UNKNOWN</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!property?.attachments || property.attachments.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No attachments detected in this evidence.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      {/* 8. CAMPAIGN DNA TAB */}
      <TabsContent value="campaign" className="mt-0 outline-none space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 border border-slate-800 bg-slate-900/40 rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-400" /> Structural Locality Sensitive Hash
              </h2>
              {assertion?.is_coordinated_campaign && (
                <Link href={`/campaigns/1`} className="text-xs font-mono bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                  <Target className="w-4 h-4" /> Manage Campaign DNA
                </Link>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">TLSH Signature</div>
                <div className="font-mono text-sm bg-slate-950 border border-slate-800 rounded p-4 text-indigo-300 break-all leading-relaxed shadow-inner">
                  {property?.tlsh_hash || "NO HASH GENERATED"}
                </div>
              </div>
              <p className="text-sm text-slate-400">
                TLSH generates a hash where structurally similar files have mathematically similar hashes. This is used by ESECURE-AI to detect mutated phishing variants from the same actor cluster.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-1 border border-slate-800 bg-slate-900/40 rounded-xl p-8 flex flex-col justify-center text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Historical Correlation</div>
            {assertion?.is_coordinated_campaign ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-2">
                  <Share2 className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-rose-400 uppercase tracking-widest">Match Found</h3>
                <p className="text-sm text-slate-300">This signature mathematically resembles evidence collected from historical cases, indicating a coordinated campaign.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No Match Found</h3>
                <p className="text-sm text-slate-500">This signature is unique within the historical evidence store. No coordinated campaign correlation detected.</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* 9. ATTACK GRAPH TAB */}
      <TabsContent value="graph" className="mt-0 outline-none h-[700px] border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
        <div className="absolute inset-0 bg-slate-950">
          <StixGraph data={graph} />
        </div>
        <div className="absolute top-4 left-4 p-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
          STIX Attack Graph generated from intelligence, indicators, and campaign DNA.
        </div>
      </TabsContent>

      {/* 10. EVIDENCE TAB */}
      <TabsContent value="evidence" className="mt-0 outline-none space-y-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-8 max-w-4xl">
          <h2 className="text-xl font-medium text-slate-200 mb-6">Evidence Custody Record</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Internal Case Record</div>
              <div className="text-lg font-mono text-indigo-400">{data.case_number}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Case Creation Timestamp</div>
              <div className="text-sm font-mono text-slate-300">{data.created_at ? new Date(data.created_at).toISOString() : 'N/A'}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Status</div>
              <div className="text-sm font-mono text-emerald-400 uppercase tracking-widest">{data.status}</div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/60 space-y-8">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Cryptographic Hash (SHA-256)</div>
              <div className="text-sm font-mono bg-[#0a0a0a] border border-slate-800 rounded p-4 text-slate-300 break-all">
                {evidence_custody?.sha256_hash || "Not available"}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This is the cryptographic hash of the exact raw bytes ingested by the engine. Verify original evidence integrity against this hash.
              </p>
            </div>
            
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Locality Sensitive Hash (TLSH)</div>
              <div className="text-sm font-mono bg-[#0a0a0a] border border-slate-800 rounded p-4 text-slate-300 break-all">
                {property?.tlsh_hash || "Not available"}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Structural signature used for similarity clustering.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
      
    </Tabs>
  );
}
