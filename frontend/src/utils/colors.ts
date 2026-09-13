export function getSeverityColorClass(score: number): string {
  if (score >= 67) return 'critical';
  if (score >= 34) return 'moderate';
  return 'low';
}

export function getClassificationColorClass(classification: string | undefined): string {
  if (!classification) return 'info';
  const c = classification.toUpperCase();
  if (c === 'SPOOFED' || c === 'POSSIBLY_COMPROMISED' || c.includes('PHISHING') || c.includes('SCAM') || c.includes('FRAUD') || c === 'BEC' || c === 'MALICIOUS') {
    return 'critical';
  }
  if (c === 'SAFE' || c === 'BENIGN' || c === 'CLEAN') {
    return 'safe';
  }
  if (c === 'UNKNOWN' || c === 'UNCLASSIFIED' || c === 'OTHER/UNCLASSIFIED') {
    return 'muted-alt';
  }
  return 'moderate';
}

export function getStatusColorClass(status: string | undefined): string {
  if (!status) return 'muted-alt';
  const s = status.toLowerCase();
  if (s === 'open' || s === 'in progress') return 'info';
  if (s === 'resolved' || s === 'closed') return 'safe';
  return 'muted-alt';
}
