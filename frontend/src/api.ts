export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchCases() {
  const res = await fetch(`${API_BASE_URL}/api/v1/cases`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCase(caseNumber: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/cases/${caseNumber}`);
  if (!res.ok) throw new Error('Failed to fetch case');
  return res.json();
}

export async function analyzeFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Analysis failed');
  return res.json();
}
export async function fetchCampaigns() {
  const res = await fetch(`${API_BASE_URL}/api/campaigns`);
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function fetchAttackGraph(campaignId: number = 1) {
  const res = await fetch(`${API_BASE_URL}/api/attack-graph/normalized?campaign_id=${campaignId}`);
  if (!res.ok) {
    if (res.status === 404) return null; // Handle if no campaign graph exists
    throw new Error('Failed to fetch attack graph');
  }
  return res.json();
}



export async function fetchIOCs(campaignId: number = 1) {
  const res = await fetch(`${API_BASE_URL}/api/iocs/campaign/${campaignId}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error('Failed to fetch IOCs');
  }
  return res.json();
}

export async function fetchAllIOCs() {
  const res = await fetch(`${API_BASE_URL}/api/iocs`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error('Failed to fetch IOCs');
  }
  return res.json();
}

export function getExportUrl(caseNumber: string) {
  return `${API_BASE_URL}/api/v1/export/${caseNumber}`;
}
