'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ShieldCheck, Zap, Globe, FileWarning, Search, Key, Network, Activity, Database, Mail, MapPin, Target, Eye, ChevronRight, Share2, EyeOff } from 'lucide-react';
import StixGraph from '@/components/StixGraph';
import Link from 'next/link';

export default function CaseTabs({ data }: { data: any }) {
  const { trace, property, assertion, evidence_custody, graph } = data;
  
  // Helpers
  const flags = assertion?.technical_flags || {};
  const lookalikes = assertion?.lookalikes || [];
  const scoreBreakdown = assertion?.threat_score_breakdown || {};
  
  // Derived specific technical factors for "WHY THIS SCORE?"
  const scoringFactors = [];
  if (flags.reply_to_mismatch) scoringFactors.push({ reason: "Reply-To mismatch", val: "+20" });
  if (!flags.dmarc_pass) scoringFactors.push({ reason: "DMARC failure", val: "+15" });
  if (!flags.spf_pass) scoringFactors.push({ reason: "SPF failure", val: "+10" });
  if (!flags.dkim_pass) scoringFactors.push({ reason: "DKIM failure", val: "+10" });
  if (scoreBreakdown.attachment_penalty > 0) scoringFactors.push({ reason: "Malicious Attachment", val: `+${scoreBreakdown.attachment_penalty}` });
  if (scoreBreakdown.intel_penalty > 0) scoringFactors.push({ reason: "Malicious Indicator Intelligence", val: `+${Math.round(scoreBreakdown.intel_penalty)}` });

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

  const getMaliciousCount = () => {
    return property?.indicators?.filter((i: any) => i.reputation?.is_flagged).length || 0;
  };

  const senderDomain = trace?.headers?.From?.split('@').pop()?.replace('>', '') || "Unknown";
  const replyDomain = trace?.headers?.['Reply-To']?.split('@').pop()?.replace('>', '') || "None";
  const hasLookalike = lookalikes.length > 0;

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
        
        {/* Threat Assessment */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800 p-4 bg-slate-900 flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-200">Threat Assessment</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest ${assertion?.threat_score >= 80 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' : assertion?.threat_score >= 40 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'}`}>
              SCORE: {Math.round(assertion?.threat_score || 0)} / 100
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Score Composition</h3>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-800">
                <span className="text-sm font-medium text-slate-300">Model / Phishing Score</span>
                <span className="font-mono text-indigo-400">{Math.round(scoreBreakdown.model_score || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-800">
                <span className="text-sm font-medium text-slate-300">Technical Risk</span>
                <span className="font-mono text-rose-400">{Math.round(scoreBreakdown.technical_score || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-800">
                <span className="text-sm font-medium text-slate-300">Payload / Intel Penalty</span>
                <span className="font-mono text-amber-400">{Math.round((scoreBreakdown.attachment_penalty || 0) + (scoreBreakdown.intel_penalty || 0))}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Why This Score?</h3>
              {scoringFactors.length > 0 ? (
                <div className="space-y-3">
                  {scoringFactors.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-xs font-mono">{f.val}</span>
                      <span className="text-sm text-slate-300">{f.reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">No explicit negative scoring factors identified.</div>
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
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
            <div className="border-b border-slate-800 p-4 bg-slate-900">
              <h2 className="text-sm font-medium text-slate-200">Email Identity</h2>
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

          <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
            <div className="border-b border-slate-800 p-4 bg-slate-900">
              <h2 className="text-sm font-medium text-slate-200">Email Authentication</h2>
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
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800 p-4 bg-slate-900 flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-200">Campaign DNA Correlation</h2>
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

      </TabsContent>

      {/* 2. FORENSICS TAB */}
      <TabsContent value="forensics" className="mt-0 outline-none space-y-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800 p-4 bg-slate-900">
            <h3 className="text-sm font-medium text-slate-200">Parsed Email Headers</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">From:</span> <span className="text-sm font-mono text-slate-300 break-all">{trace?.headers?.From}</span></div>
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">Reply-To:</span> <span className="text-sm font-mono text-slate-300 break-all">{trace?.headers?.['Reply-To']}</span></div>
            <div className="space-y-1"><span className="text-xs font-mono text-slate-500">To:</span> <span className="text-sm font-mono text-slate-300 break-all">{trace?.headers?.To || "Undisclosed"}</span></div>
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
      <TabsContent value="network" className="mt-0 outline-none space-y-6">
        <h2 className="text-xl font-medium text-slate-200">Relay Route Timeline</h2>
        <div className="relative pl-6 border-l border-slate-800 space-y-12">
          {(trace?.relay_route || []).map((hop: any, i: number) => (
            <div key={i} className="relative group">
              <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-slate-900 bg-indigo-500 transition-colors group-hover:bg-indigo-400"></div>
              <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 ml-4">
                <div className="flex justify-between items-start mb-4 border-b border-slate-800/60 pb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">HOP {hop.hop_number || i + 1}</span>
                  <span className="text-xs font-mono text-slate-500">{hop.timestamp || "Time Unavailable"}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">IP Address</div>
                    <div className="text-sm font-mono text-indigo-300">{hop.ip_address || hop.ip || "Unknown"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">HELO Domain</div>
                    <div className="text-sm font-mono text-slate-300">{hop.helo_domain || "Unknown"}</div>
                  </div>
                  {(hop.country || hop.city) && (
                    <div className="md:col-span-2">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Resolved Location</div>
                      <div className="text-sm text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {hop.city ? `${hop.city}, ` : ''}{hop.country}</div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded text-xs font-mono text-slate-500 truncate" title={hop.raw_header || hop.raw}>
                  {hop.raw_header || hop.raw || "No raw header available"}
                </div>
              </div>
            </div>
          ))}
          {(!trace?.relay_route || trace.relay_route.length === 0) && (
            <div className="text-sm text-slate-500 italic ml-4">No relay route extracted from headers.</div>
          )}
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
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
            <div className="border-b border-slate-800 p-4 bg-slate-900">
              <h3 className="text-sm font-medium text-slate-200">Origin IP Intelligence</h3>
            </div>
            <div className="p-6">
              {data.infrastructure && Object.keys(data.infrastructure).length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Target IP</div>
                    <div className="text-lg font-mono text-indigo-400">{data.infrastructure.ip}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">ISP / Organization</div>
                      <div className="text-sm text-slate-300 font-mono">{data.infrastructure.org || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">ASN</div>
                      <div className="text-sm text-slate-300 font-mono">{data.infrastructure.asn || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Location</div>
                      <div className="text-sm text-slate-300">{data.infrastructure.city ? `${data.infrastructure.city}, ` : ''}{data.infrastructure.country || "Unknown"}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Globe className="w-8 h-8 mb-2 opacity-20" />
                  <div className="text-sm">No origin IP infrastructure intelligence available.</div>
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
            <h2 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" /> Structural Locality Sensitive Hash
            </h2>
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">TLSH Signature</div>
                <div className="font-mono text-sm bg-slate-950 border border-slate-800 rounded p-4 text-indigo-300 break-all leading-relaxed shadow-inner">
                  {property?.tlsh_hash || "NO HASH GENERATED"}
                </div>
              </div>
              <p className="text-sm text-slate-400">
                TLSH generates a hash where structurally similar files have mathematically similar hashes. This is used by AAROHAN to detect mutated phishing variants from the same actor cluster.
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
