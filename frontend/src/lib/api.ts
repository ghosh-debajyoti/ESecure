import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getPdfExportUrl = (caseId: string, explanationMode: boolean = false, privacyMode: boolean = false): string => {
  return `${API_BASE_URL}/api/v1/export/${caseId}?explanation_mode=${explanationMode}&privacy_mode=${privacyMode}`;
};
