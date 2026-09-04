'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { AlertTriangle, ChevronLeft, Activity, Network } from 'lucide-react';
import Link from 'next/link';
import CampaignDNAForm from '@/components/campaign/CampaignDNAForm';

export default function CampaignDetailsPage() {
  const params = useParams();
  const campaignId = params?.campaign_id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/campaigns/${campaignId}`);
      setData(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Since this is a new feature, if a campaign doesn't exist, we can auto-create one for demo purposes
        try {
          const createRes = await axios.post(`http://127.0.0.1:8000/api/campaigns/?name=Campaign%20${campaignId}`);
          setData(createRes.data);
        } catch (createErr: any) {
          setError("Failed to load or create campaign.");
        }
      } else {
        setError(err.response?.data?.detail || "Failed to load campaign data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!campaignId) return;
    fetchCampaign();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative flex items-center justify-center w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
        </div>
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest animate-pulse">Loading Campaign...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-30 text-rose-500" />
        <h2 className="text-xl text-slate-300">Campaign Not Found</h2>
        <p className="mt-2 text-sm">{error}</p>
        <Link href="/" className="mt-6 text-indigo-400 text-sm hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Return to Command Center
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      {/* Back Navigation */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors mb-6 uppercase tracking-widest">
        <ChevronLeft className="w-4 h-4" /> Command Center
      </Link>

      {/* Header */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-8 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Network className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-800/60 pb-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                ACTIVE CAMPAIGN
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-800 text-slate-400">
                ID-{data.id}
              </span>
              <span className="text-xs font-mono text-slate-500 ml-auto">
                Created: {new Date(data.created_at).toLocaleString()}
              </span>
            </div>
            
            <h1 className="text-2xl font-semibold text-slate-100 mb-2 tracking-tight">
              {data.name || `Campaign ${data.id}`}
            </h1>
            <p className="text-sm text-slate-400">
              Manage the central DNA properties of this campaign. These attributes are used by the correlation engine to classify structurally similar phishing attempts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <CampaignDNAForm 
          campaignId={data.id} 
          initialData={data.dna} 
          onSaved={(updatedData) => setData(updatedData)} 
        />
      </div>
    </div>
  );
}
