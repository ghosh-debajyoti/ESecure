import React from 'react';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, FileWarning, FileText, MapPin, CheckCircle, XCircle, Zap } from 'lucide-react';

interface TechnicalFlags {
  spf_pass?: boolean;
  dkim_pass?: boolean;
  dmarc_pass?: boolean;
  [key: string]: any;
}

interface Attachment {
  filename: string;
  mime_type?: string;
  is_suspicious?: boolean;
  threat_indicators?: string[];
}

interface RouteHop {
  ip_address: string;
  country?: string;
  city?: string;
  hop_number?: number;
}

export interface DashboardData {
  assertion: {
    threat_score: number;
    technical_flags?: TechnicalFlags;
    is_coordinated_campaign?: boolean;
  };
  property?: {
    attachments?: Attachment[];
    indicators?: string[];
  };
  trace?: {
    relay_route?: RouteHop[];
  };
}

interface Props {
  data?: DashboardData | null;
  isLoading?: boolean;
}

export default function AnalysisDashboard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-slate-950 rounded-2xl border border-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <span className="text-sm font-mono text-slate-500 uppercase tracking-widest">Analyzing Threat Telemetry...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.assertion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-950 rounded-2xl border border-slate-800 text-slate-500">
        <Shield className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm tracking-wide uppercase">No forensics data available</p>
      </div>
    );
  }

  const { assertion, property, trace } = data;
  const { threat_score, technical_flags, is_coordinated_campaign } = assertion;

  // Determine threat level color
  let scoreColor = "text-emerald-400";
  let ringColor = "ring-emerald-400/30";
  let bgGradient = "from-emerald-500/5 to-transparent";
  
  if (threat_score >= 80) {
    scoreColor = "text-rose-500";
    ringColor = "ring-rose-500/40";
    bgGradient = "from-rose-500/10 to-transparent";
  } else if (threat_score >= 40) {
    scoreColor = "text-amber-400";
    ringColor = "ring-amber-400/30";
    bgGradient = "from-amber-400/10 to-transparent";
  }

  // Aggregate threat indicators
  const indicators: React.ReactNode[] = [];
  if (technical_flags?.spf_pass === false) {
    indicators.push(<span key="spf" className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">SPF Alignment Failed</span>);
  }
  if (technical_flags?.dkim_pass === false) {
    indicators.push(<span key="dkim" className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">DKIM Signature Invalid</span>);
  }
  if (technical_flags?.dmarc_pass === false) {
    indicators.push(<span key="dmarc" className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">DMARC Policy Failed</span>);
  }
  if (is_coordinated_campaign) {
    indicators.push(<span key="camp" className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">Coordinated Campaign</span>);
  }
  
  if (property?.indicators) {
    property.indicators.forEach((ind, i) => {
      indicators.push(<span key={`ind-${i}`} className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">{ind}</span>);
    });
  }
  
  if (property?.attachments) {
    const maliciousCount = property.attachments.filter(a => a.is_suspicious).length;
    if (maliciousCount > 0) {
      indicators.push(<span key="att" className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">Malicious Payloads ({maliciousCount})</span>);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full mx-auto p-1 bg-transparent text-slate-200 font-sans">
      
      {/* CAMPAIGN ALERT */}
      {is_coordinated_campaign && (
        <div className="flex items-center gap-4 w-full bg-rose-950/40 border border-rose-500/30 text-rose-400 p-4 rounded-2xl shadow-lg shadow-rose-900/10 backdrop-blur-md">
          <div className="p-2 bg-rose-500/20 rounded-full">
            <ShieldAlert className="w-6 h-6 flex-shrink-0 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold tracking-widest uppercase text-xs mb-1">Coordinated Campaign Detected</h3>
            <p className="text-sm opacity-80 text-rose-300">This payload structurally matches an ongoing organized threat cluster. TLSH similarities confirm a coordinated attack.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* HERO: Threat Score */}
        <div className={`col-span-1 flex flex-col items-center justify-center p-8 rounded-3xl border border-slate-800/60 bg-gradient-to-b ${bgGradient} bg-slate-950 relative overflow-hidden`}>
          <div className="absolute top-5 left-5 text-slate-500 text-[10px] font-black uppercase tracking-widest">Threat Score</div>
          <div className="mt-4 mb-2">
            <div className={`relative flex items-center justify-center w-48 h-48 rounded-full ring-2 ${ringColor} shadow-[0_0_50px_rgba(0,0,0,0.15)] bg-slate-900/80 backdrop-blur-xl border border-slate-800/50`}>
              <div className="flex flex-col items-center">
                <span className={`text-7xl font-black tabular-nums tracking-tighter drop-shadow-md ${scoreColor}`}>
                  {threat_score.toFixed(0)}
                </span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* REASONS FOR FRAUD (Auth) */}
        <div className="col-span-1 flex flex-col p-8 rounded-3xl border border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Domain Auth
          </h2>
          <div className="flex flex-col gap-4 h-full justify-center">
            {[
              { label: 'SPF Alignment', pass: technical_flags?.spf_pass },
              { label: 'DKIM Signatures', pass: technical_flags?.dkim_pass },
              { label: 'DMARC Policy', pass: technical_flags?.dmarc_pass }
            ].map((check, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
                <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">{check.label}</span>
                {check.pass === true ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]" />
                ) : check.pass === false ? (
                  <XCircle className="w-5 h-5 text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-600"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* THREAT INDICATORS */}
        <div className="col-span-1 flex flex-col p-8 rounded-3xl border border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" /> Threat Indicators
          </h2>
          <div className="flex flex-wrap gap-2 content-start h-full">
            {indicators.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm italic">
                No distinct threat indicators flagged.
              </div>
            ) : (
              indicators
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FORENSICS: Attachments */}
        <div className="flex flex-col p-8 rounded-3xl border border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-indigo-400" /> Malicious Payloads
          </h2>
          
          <div className="flex flex-col gap-4">
            {!property?.attachments || property.attachments.length === 0 ? (
              <div className="flex items-center justify-center h-32 border border-dashed border-slate-800/50 rounded-2xl text-slate-600 text-sm italic">
                No attachments detected
              </div>
            ) : (
              property.attachments.map((att, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${att.is_suspicious ? 'bg-gradient-to-r from-rose-950/30 to-slate-900/30 border-rose-500/20' : 'bg-slate-900/30 border-slate-800/50'} flex flex-col gap-4 transition-all hover:border-slate-700`}>
                  <div className="flex items-center gap-3">
                    {att.is_suspicious ? (
                      <div className="p-2 bg-rose-500/10 rounded-lg">
                        <FileWarning className="w-5 h-5 text-rose-400" />
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                    <span className="font-semibold text-slate-200 text-sm truncate">{att.filename}</span>
                    {att.is_suspicious && (
                      <span className="ml-auto px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        High Risk
                      </span>
                    )}
                  </div>
                  
                  {att.is_suspicious && att.threat_indicators && att.threat_indicators.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/50">
                      {att.threat_indicators.map((indicator, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-slate-950 text-rose-300 border border-rose-900/60 shadow-sm">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ROUTING: Delivery Path */}
        <div className="flex flex-col p-8 rounded-3xl border border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" /> Routing Trace
          </h2>
          
          <div className="relative flex flex-col gap-8 pl-6 py-2">
            {!trace?.relay_route || trace.relay_route.length === 0 ? (
              <div className="text-slate-600 text-sm italic">No geographic routing data available.</div>
            ) : (
              <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-indigo-500/50 via-slate-800 to-transparent rounded-full"></div>
            )}
            
            {trace?.relay_route?.map((hop, idx) => (
              <div key={idx} className="relative z-10 flex items-start gap-6">
                <div className="absolute -left-6 flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 border-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                </div>
                <div className="flex flex-col -mt-1">
                  <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest mb-1.5">
                    Hop {hop.hop_number || trace.relay_route!.length - idx}
                  </span>
                  <span className="font-mono text-sm text-slate-300 font-medium">{hop.ip_address}</span>
                  {(hop.city || hop.country) && (
                    <span className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3 h-3 opacity-50" />
                      {hop.city ? `${hop.city}, ` : ''}{hop.country}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
