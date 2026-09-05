'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, HelpCircle, FileText, CheckCircle2, Eye, EyeOff, BookOpen, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [explanationMode, setExplanationMode] = useState<'technical' | 'layman' | 'auto'>('technical');
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [pdfIncludeLayman, setPdfIncludeLayman] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aarohan_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.explanationMode) setExplanationMode(parsed.explanationMode);
        if (typeof parsed.privacyMode === 'boolean') setPrivacyMode(parsed.privacyMode);
        if (typeof parsed.pdfIncludeLayman === 'boolean') setPdfIncludeLayman(parsed.pdfIncludeLayman);
      }
    } catch (e) {
      console.warn("Failed to load settings from localStorage");
    }
  }, []);

  const saveSettings = (newExplanation: 'technical' | 'layman' | 'auto', newPrivacy: boolean, newPdf: boolean) => {
    setExplanationMode(newExplanation);
    setPrivacyMode(newPrivacy);
    setPdfIncludeLayman(newPdf);
    try {
      localStorage.setItem('aarohan_settings', JSON.stringify({
        explanationMode: newExplanation,
        privacyMode: newPrivacy,
        pdfIncludeLayman: newPdf
      }));
      toast.success("Settings updated successfully.");
    } catch (e) {
      toast.error("Failed to save settings.");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-slate-100 flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-400" /> Analyst Preferences & Settings
        </h1>
        <p className="text-slate-500 mt-2 text-sm">Configure presentation redactions, explanation modes, and report parameters.</p>
      </div>

      <div className="space-y-6">
        
        {/* PRIVACY MODE CARD */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg border ${privacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {privacyMode ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-200">PRIVACY MODE</h2>
                  {privacyMode && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Automatically mask personal information in investigation views and reports.
                </p>
                <div className="mt-3 text-xs text-slate-500 font-mono space-y-1">
                  <p>• Redacts email addresses (<code className="text-slate-400">secu•••@example.com</code>) and sender display names (<code className="text-slate-400">J••• D••</code>).</p>
                  <p>• Technical forensic indicators (IPs, hashes, domains, case IDs, headers) remain intact.</p>
                  <p>• Presentation redaction only — stored raw evidence hashes remain unmodified.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0">
              <button
                onClick={() => saveSettings(explanationMode, false, pdfIncludeLayman)}
                className={`px-4 py-2 rounded-md text-xs font-mono font-bold tracking-wider transition-all ${!privacyMode ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                OFF
              </button>
              <button
                onClick={() => saveSettings(explanationMode, true, pdfIncludeLayman)}
                className={`px-4 py-2 rounded-md text-xs font-mono font-bold tracking-wider transition-all ${privacyMode ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ON
              </button>
            </div>
          </div>
        </div>

        {/* EXPLANATION MODE CARD */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg border bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-200">EXPLANATION MODE</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Choose how technical findings and risk factors are presented across the workspace and exported reports.
                </p>
                <div className="mt-3 text-xs text-slate-500 font-mono space-y-1">
                  <p>• <b>TECHNICAL:</b> Shows exact raw headers, protocol rationale, and SOC indicator terminology.</p>
                  <p>• <b>LAYMAN:</b> Translates findings into plain 4-part explanations (What We Found, Why It Matters, Simple Terms, Action).</p>
                  <p>• <b>AUTO:</b> Adapts view based on threat severity and user context.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0">
              {(['technical', 'layman', 'auto'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => saveSettings(mode, privacyMode, pdfIncludeLayman)}
                  className={`px-3 py-2 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    explanationMode === mode 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PDF REPORT PREFERENCES */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg border bg-slate-800 border-slate-700 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-200">FORENSIC PDF REPORT PREFERENCES</h2>
              <p className="text-sm text-slate-400 mt-1">
                Configure default parameters for downloadable 10-page forensic PDF deliverables.
              </p>
              
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfIncludeLayman}
                    onChange={(e) => saveSettings(explanationMode, privacyMode, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-mono text-slate-300">Include Layman Explanations in PDF Executive Summary</span>
                </label>
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded text-xs text-slate-400 font-mono">
                  Current PDF export defaults: 10 structured sections, AAROHAN branding, evidence custody hash, and score severity indicator.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
