import type { AttemptReport } from '../types';

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string }).error || `Request failed (${res.status})`;
}

/** Load past mock reports from the server (source of truth after score). */
export async function fetchAttemptReports(
  getToken: () => Promise<string | null>
): Promise<{ reports: AttemptReport[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/reports', { headers });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return {
    reports: (data.reports || []) as AttemptReport[],
    syncedAt: data.syncedAt as string,
  };
}
