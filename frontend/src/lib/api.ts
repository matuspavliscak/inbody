import type { Scan, ScanSummary, TrendPoint, Goals } from '../types';

const BASE = '/api';

async function parseError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    if (json.detail) return json.detail;
  } catch {}
  return `Request failed (${res.status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export const api = {
  listScans: () => request<ScanSummary[]>('/scans'),
  getScan: (id: number) => request<Scan>(`/scans/${id}`),
  deleteScan: (id: number) => request<void>(`/scans/${id}`, { method: 'DELETE' }),
  getTrends: () => request<TrendPoint[]>('/trends'),

  updateScan: (id: number, data: Partial<Scan>) =>
    request<Scan>(`/scans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getGoals: () => request<Goals>('/goals'),
  setGoals: (goals: Goals) =>
    request<Goals>('/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goals),
    }),

  seedSampleData: () => request<{ ok: boolean }>('/sample-data', { method: 'POST' }),
  clearAllScans: () => request<{ ok: boolean }>('/scans', { method: 'DELETE' }),

  upload: async (file: File): Promise<Scan[]> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },
};
