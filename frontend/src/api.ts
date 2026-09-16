export const API_BASE_URL = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export async function fetchCases() {
  const res = await fetch(`${API_BASE_URL}/api/v1/cases`);
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    console.error('fetchCases failed:', res.status, err);
    throw new Error(`Failed to fetch cases: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCase(caseNumber: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/cases/${caseNumber}`);
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    console.error('fetchCase failed:', res.status, err);
    throw new Error(`Failed to fetch case: ${res.statusText}`);
  }
  return res.json();
}

export async function analyzeFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    console.error('analyzeFile failed:', res.status, err);
    throw new Error(`Analysis failed. Please try again. (${res.status} ${res.statusText})`);
  }
  return res.json();
}
export async function fetchCampaigns() {
  const res = await fetch(`${API_BASE_URL}/api/campaigns`);
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    console.error('fetchCampaigns failed:', res.status, err);
    throw new Error(`Failed to fetch campaigns: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAttackGraph(caseNumber: string | null = null, campaignId: number | null = null) {
  let url = `${API_BASE_URL}/api/attack-graph/normalized`;
  const params = new URLSearchParams();
  if (caseNumber) params.append('case_number', caseNumber);
  if (campaignId) params.append('campaign_id', campaignId.toString());
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null; // Handle if no campaign graph exists
    const err = await res.text().catch(() => 'Unknown error');
    console.error('fetchAttackGraph failed:', res.status, err);
    throw new Error(`Failed to fetch attack graph: ${res.statusText}`);
  }
  return res.json();
}



export async function fetchIOCs(campaignId: number = 1) {
  const res = await fetch(`${API_BASE_URL}/api/iocs/campaign/${campaignId}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    const err = await res.text().catch(() => 'Unknown error');
    console.error('fetchIOCs failed:', res.status, err);
    throw new Error(`Failed to fetch IOCs: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAllIOCs() {
  const res = await fetch(`${API_BASE_URL}/api/iocs`);
  if (!res.ok) {
    if (res.status === 404) return [];
    const err = await res.text().catch(() => 'Unknown error');
    console.error('fetchAllIOCs failed:', res.status, err);
    throw new Error(`Failed to fetch IOCs: ${res.statusText}`);
  }
  return res.json();
}

export function getExportUrl(caseNumber: string) {
  return `${API_BASE_URL}/api/v1/export/${caseNumber}`;
}
