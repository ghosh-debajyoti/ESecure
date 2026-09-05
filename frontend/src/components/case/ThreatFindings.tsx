'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, FileCode2, Link2, Users, CheckCircle2 } from 'lucide-react';

interface ThreatFindingsProps {
  data: any;
}

export default function ThreatFindings({ data }: ThreatFindingsProps) {
  const flags = data?.assertion?.technical_flags || {};
  const assertion = data?.assertion || {};
  const property = data?.property || {};
  const lookalikes = assertion?.lookalikes || [];

  const findings: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    icon: React.ElementType;
    severity: 'critical' | 'high' | 'moderate';
  }> = [];

  // 1. SPF/DKIM/DMARC Failures
  if (flags.spf_pass === false || flags.dkim_pass === false || flags.dmarc_pass === false) {
    findings.push({
      id: 'auth_failure',
      category: 'Authentication Failure',
      title: 'Email Sender Forgery / Spoofing',
      description: "The sender's email address is forged or spoofed. The transmitting server is not authorized by the real domain to send messages on their behalf.",
      icon: ShieldAlert,
      severity: 'critical'
    });
  }

  // 2. Reply-To Mismatch
  if (flags.reply_to_mismatch) {
    findings.push({
      id: 'reply_to_mismatch',
      category: 'Reply-To Mismatch',
      title: 'Response Redirection Hazard',
      description: "If you reply to this email, your response will be sent to an entirely different address than the one shown in the 'From' field.",
      icon: AlertTriangle,
      severity: 'high'
    });
  }

  // 3. Suspicious Attachment (.vbs, .exe, macro keywords)
  const hasSuspiciousAttachment = property?.attachments?.some((att: any) => 
    att.is_suspicious || 
    att.filename?.match(/\.(vbs|exe|bat|cmd|ps1|scr|docm|xlsm|zip|rar)$/i) || 
    att.mime_type?.includes('executable')
  );
  if (hasSuspiciousAttachment) {
    findings.push({
      id: 'suspicious_attachment',
      category: 'Dangerous Attachment',
      title: 'Executable Payload Warning',
      description: "The attached file contains executable script commands designed to run programs or download software in the background without your permission.",
      icon: FileCode2,
      severity: 'critical'
    });
  }

  // 4. Phishing/Unverified URLs
  const hasPhishingUrls = property?.indicators?.some((ind: any) => 
    ind.type === 'URL' || ind.reputation?.is_flagged
  ) || lookalikes.length > 0;
  if (hasPhishingUrls) {
    findings.push({
      id: 'phishing_urls',
      category: 'Phishing Links',
      title: 'Credential Harvesting Destination',
      description: "The email contains links directing to unverified or suspicious external web pages designed to harvest login credentials.",
      icon: Link2,
      severity: 'high'
    });
  }

  // 5. Coordinated Campaign
  if (assertion?.is_coordinated_campaign) {
    findings.push({
      id: 'coordinated_campaign',
      category: 'Automated Campaign',
      title: 'Coordinated Attack Cluster',
      description: "This email's structure matches known automated phishing waves targeting multiple recipients simultaneously.",
      icon: Users,
      severity: 'high'
    });
  }

  return (
    <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-[clamp(1rem,2vw,1.25rem)] font-bold tracking-[0.1em] text-slate-100 uppercase">Threat Findings</h3>
            <p className="text-xs text-slate-400 font-mono">Plain-English translation of detected indicators</p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.05)]">
          {findings.length} Pattern{findings.length === 1 ? '' : 's'} Identified
        </span>
      </div>

      {findings.length > 0 ? (
        <div className="space-y-3">
          {findings.map((f) => {
            const Icon = f.icon;
            const isCritical = f.severity === 'critical';
            return (
              <div 
                key={f.id} 
                className={`p-4 rounded-lg border transition-all ${
                  isCritical 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold tracking-wide text-slate-100">{f.title}</h4>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        isCritical ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}>
                        {f.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold block text-slate-100">No Critical Threat Patterns Identified</span>
            <span>Authentication mechanisms and sender structures pass standard baseline checks.</span>
          </div>
        </div>
      )}
    </div>
  );
}
