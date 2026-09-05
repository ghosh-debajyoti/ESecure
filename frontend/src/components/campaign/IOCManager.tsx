import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ShieldAlert, Trash2, Plus, AlertCircle, Activity, Server, Hash, Link as LinkIcon, Mail } from 'lucide-react';

interface IOC {
  id: number;
  type: 'IP' | 'Domain' | 'Hash' | 'URL' | 'Email';
  value: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string | null;
  timestamp: string;
}

interface IOCManagerProps {
  campaignId: number;
}

const TYPE_ICONS = {
  IP: <Server className="w-4 h-4" />,
  Domain: <Activity className="w-4 h-4" />,
  Hash: <Hash className="w-4 h-4" />,
  URL: <LinkIcon className="w-4 h-4" />,
  Email: <Mail className="w-4 h-4" />,
};

const SEVERITY_COLORS = {
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function IOCManager({ campaignId }: IOCManagerProps) {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<IOC['type']>('IP');
  const [value, setValue] = useState('');
  const [severity, setSeverity] = useState<IOC['severity']>('Medium');
  const [description, setDescription] = useState('');

  const fetchIOCs = async () => {
    try {
      const res = await api.get(`/api/iocs/campaign/${campaignId}`);
      setIocs(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch IOCs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIOCs();
  }, [campaignId]);

  const handleAddIOC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    setSubmitting(true);
    try {
      await api.post('/api/iocs/', {
        type,
        value,
        severity,
        description,
        campaign_id: campaignId
      });
      // Reset form
      setValue('');
      setDescription('');
      // Refresh list
      await fetchIOCs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add IOC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIOC = async (id: number) => {
    try {
      await api.delete(`/api/iocs/${id}`);
      setIocs(iocs.filter(ioc => ioc.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete IOC');
    }
  };

  if (loading) {
    return <div className="p-6 border border-slate-800 bg-slate-900/50 rounded-xl animate-pulse h-64"></div>;
  }

  return (
    <div className="border border-slate-800 bg-slate-900/50 rounded-xl overflow-hidden shadow-xl shadow-black/20 mt-8">
      <div className="border-b border-slate-800 bg-slate-900/80 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-200">Indicators of Compromise (IOC)</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Known threat artifacts associated with this campaign</p>
          </div>
        </div>
        <div className="text-xs font-mono px-2 py-1 bg-slate-800 text-slate-400 rounded-md">
          {iocs.length} records
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="xl:col-span-1">
          <form onSubmit={handleAddIOC} className="bg-slate-900 p-5 rounded-lg border border-slate-800">
            <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New IOC
            </h4>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Type</label>
                <select 
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="IP">IP Address</option>
                  <option value="Domain">Domain</option>
                  <option value="URL">URL</option>
                  <option value="Hash">File Hash (MD5/SHA256)</option>
                  <option value="Email">Email Address</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Indicator Value</label>
                <input 
                  type="text" 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'IP' ? 'e.g., 192.168.1.1' : type === 'Domain' ? 'e.g., malicious.com' : '...'}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Severity</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map((s: any) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                        severity === s 
                          ? 'bg-slate-700 border-slate-600 text-white' 
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context about this indicator..."
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-h-[80px]"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting || !value}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? 'Adding...' : 'Save Indicator'}
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="xl:col-span-2">
          {iocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 border border-dashed border-slate-700 rounded-lg bg-slate-900/30">
              <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No indicators have been added to this campaign yet.</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-wider">
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Indicator</th>
                    <th className="p-3 font-medium">Severity</th>
                    <th className="p-3 font-medium">Added</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-slate-900/20">
                  {iocs.map((ioc) => (
                    <tr key={ioc.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <span className="text-slate-500">{TYPE_ICONS[ioc.type]}</span>
                          {ioc.type}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-mono text-slate-200">{ioc.value}</div>
                        {ioc.description && (
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px] xl:max-w-[300px]">{ioc.description}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest border ${SEVERITY_COLORS[ioc.severity]}`}>
                          {ioc.severity}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500 font-mono">
                        {new Date(ioc.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeleteIOC(ioc.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete IOC"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
