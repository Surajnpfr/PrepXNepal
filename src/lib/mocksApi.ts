import type { MockAllocation, MockTest, Question } from '../types';

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface MockImportBatch {
  id: string;
  label: string;
  filename: string | null;
  importedByEmail: string;
  importedByName: string;
  mockCount: number;
  errorCount: number;
  createdAt: string;
}

function normalizeMock(raw: any): MockTest {
  const scope = raw.scope || (raw.kind === 'Chapter' || raw.testCategory === 'chapter' ? 'chapter' : 'full');
  const mode = raw.mode === 'dynamic' ? 'dynamic' : 'fixed';
  return {
    id: raw.id,
    title: raw.title,
    examType: raw.examType || 'Nepal CEE',
    mode,
    scope,
    kind: scope === 'full' ? 'Mock' : 'Chapter',
    testCategory: scope === 'full' ? 'full' : 'chapter',
    subject: raw.subject,
    chapterName: raw.chapterName,
    durationSec: raw.durationSec,
    totalQuestions: raw.totalQuestions,
    questionsPerPage: raw.questionsPerPage ?? 20,
    correctMarks: raw.correctMarks ?? 1,
    wrongMarks: raw.wrongMarks ?? -0.25,
    unansweredMarks: raw.unansweredMarks ?? 0,
    isPublished: raw.isPublished !== false,
    coinPrice: raw.coinPrice,
    year: raw.year,
    allocation: raw.allocation,
    importBatchId: raw.importBatchId,
    questions: Array.isArray(raw.questions) ? (raw.questions as Question[]) : [],
  };
}

export async function fetchMocks(
  getToken: () => Promise<string | null>
): Promise<{ mocks: MockTest[]; total: number; syncedAt: string; source: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/mocks', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch mocks (${res.status})`);
  }
  const data = await res.json();
  return {
    mocks: (data.mocks || []).map(normalizeMock),
    total: data.total || 0,
    syncedAt: data.syncedAt,
    source: data.source,
  };
}

export async function fetchMockBatches(
  getToken: () => Promise<string | null>
): Promise<{ batches: MockImportBatch[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/mocks/batches', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch mock batches (${res.status})`);
  }
  return res.json();
}

export async function startMockAttempt(
  getToken: () => Promise<string | null>,
  mockId: string
): Promise<MockTest & { attemptSessionId: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/mocks/${encodeURIComponent(mockId)}/start`, {
    method: 'POST',
    headers,
    body: '{}',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to start mock (${res.status})`);
  }
  const data = await res.json();
  if (!data.attemptSessionId) {
    throw new Error('Server did not return attemptSessionId. Restart the API and try again.');
  }
  return { ...normalizeMock(data.mock), attemptSessionId: data.attemptSessionId };
}

export async function scoreMockAttempt(
  getToken: () => Promise<string | null>,
  payload: {
    attemptSessionId: string;
    questionIds: string[];
    answers: Record<string, string>;
    mockId: string;
    mockTitle: string;
    attemptId: string;
    startedAt?: string;
    correctMarks?: number;
    wrongMarks?: number;
  }
): Promise<{
  report: import('../types').AttemptReport;
  coinReward: number;
  user: import('../types').UserProfile;
}> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/mocks/score', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to score attempt (${res.status})`);
  }
  return res.json();
}

/** Student self-serve: sample a dynamic paper from the bank (no moderator). */
export async function generatePracticeMock(
  getToken: () => Promise<string | null>,
  payload: {
    title?: string;
    scope: 'full' | 'subject' | 'chapter';
    subject?: string;
    chapterName?: string;
    durationSec?: number;
    questionsPerPage?: number;
    allocation?: MockAllocation;
    totalQuestions?: number;
  }
): Promise<MockTest & { attemptSessionId: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/mocks/practice', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error(
        'Practice API not found (404). Restart the PrepX API server so /api/mocks/practice is loaded.'
      );
    }
    throw new Error(body.error || `Failed to generate practice mock (${res.status})`);
  }
  const data = await res.json();
  if (!data.attemptSessionId) {
    throw new Error('Server did not return attemptSessionId. Restart the API and try again.');
  }
  return { ...normalizeMock(data.mock), attemptSessionId: data.attemptSessionId };
}

export async function importFixedMocksJson(
  getToken: () => Promise<string | null>,
  payload: unknown,
  meta?: { filename?: string | null; label?: string | null }
): Promise<{
  successCount: number;
  errors: string[];
  batchId: string | null;
  batches: MockImportBatch[];
  mocks: MockTest[];
}> {
  const headers = await authHeaders(getToken);
  const body =
    Array.isArray(payload)
      ? { mocks: payload, filename: meta?.filename ?? null, label: meta?.label ?? null }
      : { ...(payload as object), filename: meta?.filename ?? null, label: meta?.label ?? null };
  const res = await fetch('/api/mocks/import', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Failed to import mocks (${res.status})`);
  }
  const data = await res.json();
  return {
    successCount: data.successCount || 0,
    errors: data.errors || [],
    batchId: data.batchId || null,
    batches: data.batches || [],
    mocks: (data.mocks || []).map(normalizeMock),
  };
}

export async function createDynamicMock(
  getToken: () => Promise<string | null>,
  payload: {
    title: string;
    scope: 'full' | 'subject' | 'chapter';
    subject?: string;
    chapterName?: string;
    durationSec?: number;
    questionsPerPage?: number;
    correctMarks?: number;
    wrongMarks?: number;
    unansweredMarks?: number;
    isPublished?: boolean;
    coinPrice?: number;
    allocation?: MockAllocation;
    totalQuestions?: number;
  }
): Promise<MockTest> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/mocks', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, mode: 'dynamic' }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to create mock (${res.status})`);
  }
  const data = await res.json();
  return normalizeMock(data.mock);
}

export async function updateMockMeta(
  getToken: () => Promise<string | null>,
  id: string,
  patch: Record<string, unknown>
): Promise<MockTest> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/mocks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to update mock (${res.status})`);
  }
  const data = await res.json();
  return normalizeMock(data.mock);
}

export async function deleteMock(
  getToken: () => Promise<string | null>,
  id: string
): Promise<void> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/mocks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to delete mock (${res.status})`);
  }
}

export async function deleteMockBatch(
  getToken: () => Promise<string | null>,
  batchId: string
): Promise<void> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/mocks/batches/${encodeURIComponent(batchId)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to delete mock batch (${res.status})`);
  }
}
