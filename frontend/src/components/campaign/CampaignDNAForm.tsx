'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';

interface CampaignDNAFormProps {
  campaignId: number;
  initialData?: any;
  onSaved?: (data: any) => void;
}

export default function CampaignDNAForm({ campaignId, initialData, onSaved }: CampaignDNAFormProps) {
  const [dna, setDna] = useState(initialData || {
    targetAudience: { demographics: '', psychographics: '' },
    coreMessage: '',
    tone: [] as string[],
    primaryGoal: '',
    brandGuidelines: { primaryColor: '#ffffff', slogan: '' }
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TONE_OPTIONS = [
    'Professional',
    'Energetic',
    'Urgent',
    'Friendly',
    'Authoritative',
    'Humorous'
  ];

  const handleToneChange = (toneOption: string) => {
    setDna((prev: any) => {
      const tones = prev.tone || [];
      if (tones.includes(toneOption)) {
        return { ...prev, tone: tones.filter((t: string) => t !== toneOption) };
      } else {
        return { ...prev, tone: [...tones, toneOption] };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const res = await api.patch(`/api/campaigns/${campaignId}/dna`, {
        dna: dna
      });
      setSuccess(true);
      if (onSaved) {
        onSaved(res.data);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Analysis service unavailable or failed to save Campaign DNA");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 text-slate-300">
      <h3 className="text-xl font-medium text-slate-100 mb-6">Campaign DNA Profile</h3>
      
      {error && (
        <div className="mb-6 p-4 border border-rose-500/30 bg-rose-500/10 rounded flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span className="text-sm text-rose-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 border border-emerald-500/30 bg-emerald-500/10 rounded flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm text-emerald-400">Campaign DNA saved successfully!</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Core Message */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Core Message</label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 min-h-[100px]"
            value={dna.coreMessage || ''}
            onChange={(e) => setDna({...dna, coreMessage: e.target.value})}
            placeholder="Define the primary message of this campaign..."
          />
        </div>

        {/* Primary Goal */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Primary Goal</label>
          <input 
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
            value={dna.primaryGoal || ''}
            onChange={(e) => setDna({...dna, primaryGoal: e.target.value})}
            placeholder="e.g., Credential Harvesting, Malware Distribution"
          />
        </div>

        {/* Target Audience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Target Demographics</label>
            <input 
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
              value={dna.targetAudience?.demographics || ''}
              onChange={(e) => setDna({...dna, targetAudience: { ...dna.targetAudience, demographics: e.target.value }})}
              placeholder="e.g., C-Level Executives"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Target Psychographics</label>
            <input 
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
              value={dna.targetAudience?.psychographics || ''}
              onChange={(e) => setDna({...dna, targetAudience: { ...dna.targetAudience, psychographics: e.target.value }})}
              placeholder="e.g., High stress, financially motivated"
            />
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">Tone</label>
          <div className="flex flex-wrap gap-3">
            {TONE_OPTIONS.map(tone => {
              const isActive = (dna.tone || []).includes(tone);
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleToneChange(tone)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  {tone}
                </button>
              )
            })}
          </div>
        </div>

        {/* Brand Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Brand Slogan (Spoofed)</label>
            <input 
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
              value={dna.brandGuidelines?.slogan || ''}
              onChange={(e) => setDna({...dna, brandGuidelines: { ...dna.brandGuidelines, slogan: e.target.value }})}
              placeholder="e.g., Your Security is Our Priority"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color"
                className="w-12 h-12 rounded border-0 bg-transparent cursor-pointer"
                value={dna.brandGuidelines?.primaryColor || '#ffffff'}
                onChange={(e) => setDna({...dna, brandGuidelines: { ...dna.brandGuidelines, primaryColor: e.target.value }})}
              />
              <span className="text-sm font-mono text-slate-400 uppercase">{dna.brandGuidelines?.primaryColor || '#ffffff'}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Campaign DNA'}
          </button>
        </div>

      </div>
    </div>
  );
}
