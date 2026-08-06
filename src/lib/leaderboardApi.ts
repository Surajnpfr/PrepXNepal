export type WeeklyLeaderboardRow = {
  rank: number;
  displayName: string;
  avatarUrl: string;
  score: number;
  completedAt: string;
  isYou: boolean;
};

export type WeeklyLeaderboardResponse = {
  mock: {
    mockId: string;
    title: string;
    opensAt: string | null;
    closesAt: string | null;
    durationSec: number;
    totalQuestions: number;
    status: 'open' | 'closed' | 'upcoming' | 'unscheduled';
  } | null;
  status: 'open' | 'closed' | 'upcoming' | 'unscheduled';
  rows: WeeklyLeaderboardRow[];
  youAttempted: boolean;
  yourScore: number | null;
  syncedAt: string;
};

export type WeeklyLeaderboardExportRow = {
  rank: number;
  fullName: string;
  username: string;
  score: number;
  completedAt: string;
};

export type WeeklyLeaderboardExportPayload = {
  mock: {
    mockId: string;
    title: string;
    opensAt: string | null;
    closesAt: string | null;
    status: string;
  };
  rows: WeeklyLeaderboardExportRow[];
  exportedAt: string;
};

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchWeeklyLeaderboard(
  getToken: () => Promise<string | null>
): Promise<WeeklyLeaderboardResponse> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/leaderboard/weekly', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load weekly leaderboard (${res.status})`);
  }
  return res.json();
}

/** Staff: full student export payload for PDF (no emails). */
export async function fetchWeeklyLeaderboardExport(
  getToken: () => Promise<string | null>
): Promise<WeeklyLeaderboardExportPayload> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/leaderboard/weekly/export?format=json', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load export data (${res.status})`);
  }
  return res.json();
}

/** Staff: download weekly student ranks CSV (includes email; PDF path does not). */
export async function downloadWeeklyLeaderboardCsv(
  getToken: () => Promise<string | null>
): Promise<void> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/leaderboard/weekly/export?format=csv', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to export weekly leaderboard (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] || 'weekly-leaderboard.csv';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Staff: download weekly student ranks PDF. */
export async function downloadWeeklyLeaderboardPdfFile(
  getToken: () => Promise<string | null>
): Promise<string> {
  const data = await fetchWeeklyLeaderboardExport(getToken);
  const { downloadWeeklyLeaderboardPdf } = await import('./downloadWeeklyLeaderboardPdf');
  const result = await downloadWeeklyLeaderboardPdf(data);
  if (!result.ok) throw new Error(result.error);
  return result.fileName;
}
