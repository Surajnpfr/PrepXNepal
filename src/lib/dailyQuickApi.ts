import type { Question } from '../types';

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

export type DailyQuickSubject = 'Physics' | 'Chemistry' | 'Botany' | 'Zoology';

export type DailyQuickPayload = {
  subject: DailyQuickSubject;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

/** Public — no auth. Active published set (answers included for client-only grading). */
export async function fetchActiveDailyQuick(): Promise<{
  questions: Question[];
  syncedAt: string;
}> {
  const res = await fetch('/api/daily-quick/active');
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return {
    questions: (data.questions || []) as Question[],
    syncedAt: data.syncedAt as string,
  };
}

export async function fetchDailyQuickQueue(
  getToken: () => Promise<string | null>
): Promise<{ questions: Question[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/daily-quick', { headers });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return {
    questions: (data.questions || []) as Question[],
    syncedAt: data.syncedAt as string,
  };
}

export async function createDailyQuick(
  getToken: () => Promise<string | null>,
  payload: DailyQuickPayload
): Promise<Question> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/daily-quick', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.question as Question;
}

export async function updateDailyQuick(
  getToken: () => Promise<string | null>,
  id: string,
  payload: DailyQuickPayload
): Promise<Question> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/daily-quick/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.question as Question;
}

export async function approveDailyQuick(
  getToken: () => Promise<string | null>,
  id: string
): Promise<Question> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/daily-quick/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.question as Question;
}

export async function deleteDailyQuick(
  getToken: () => Promise<string | null>,
  id: string
): Promise<void> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/daily-quick/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(await readError(res));
}
