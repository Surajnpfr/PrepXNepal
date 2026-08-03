import type { Question } from '../types';

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface SubjectQuestionCount {
  subject: string;
  count: number;
}

export interface ChapterQuestionCount {
  subject: string;
  chapter: string;
  count: number;
}

export interface QuestionsStats {
  bySubject: SubjectQuestionCount[];
  byChapter?: ChapterQuestionCount[];
  total: number;
  syncedAt: string;
  source: string;
}

export interface ImportBatch {
  id: string;
  label: string;
  filename: string | null;
  importedByEmail: string;
  importedByName: string;
  questionCount: number;
  errorCount: number;
  createdAt: string;
}

export async function fetchQuestions(
  getToken: () => Promise<string | null>
): Promise<{ questions: Question[]; total: number; syncedAt: string; source: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/questions', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch questions (${res.status})`);
  }
  return res.json();
}

export async function fetchQuestionBatches(
  getToken: () => Promise<string | null>
): Promise<{ batches: ImportBatch[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/questions/batches', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch batches (${res.status})`);
  }
  return res.json();
}

export async function fetchQuestionStats(
  getToken: () => Promise<string | null>
): Promise<QuestionsStats> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/questions/stats', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch question stats (${res.status})`);
  }
  return res.json();
}

export async function createQuestion(
  getToken: () => Promise<string | null>,
  payload: unknown
): Promise<Question> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to create question (${res.status})`);
  }
  const data = await res.json();
  return data.question as Question;
}

export async function updateQuestion(
  getToken: () => Promise<string | null>,
  id: string,
  payload: unknown
): Promise<Question> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/questions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to update question (${res.status})`);
  }
  const data = await res.json();
  return data.question as Question;
}

export async function deleteQuestion(
  getToken: () => Promise<string | null>,
  id: string
): Promise<void> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to delete question (${res.status})`);
  }
}

export async function deleteQuestionBatch(
  getToken: () => Promise<string | null>,
  batchId: string
): Promise<{ deletedQuestions: number }> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/questions/batches/${encodeURIComponent(batchId)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to delete batch (${res.status})`);
  }
  return res.json();
}

export async function updateQuestionBatchMeta(
  getToken: () => Promise<string | null>,
  batchId: string,
  patch: { label?: string; filename?: string | null }
): Promise<ImportBatch> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/questions/batches/${encodeURIComponent(batchId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to update batch (${res.status})`);
  }
  const data = await res.json();
  return data.batch as ImportBatch;
}

export async function importQuestionsJson(
  getToken: () => Promise<string | null>,
  questions: unknown,
  meta?: { filename?: string | null; label?: string | null }
): Promise<{
  successCount: number;
  errors: string[];
  batchId: string | null;
  batches: ImportBatch[];
  bySubject: SubjectQuestionCount[];
  total: number;
}> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/questions/import', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      questions,
      filename: meta?.filename ?? null,
      label: meta?.label ?? null,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to import questions (${res.status})`);
  }
  return res.json();
}
