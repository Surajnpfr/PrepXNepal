import type { FormulaSheet } from '../types';

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface FormulaImportBatch {
  id: string;
  label: string;
  filename: string | null;
  importedByEmail: string;
  importedByName: string;
  sheetCount: number;
  errorCount: number;
  createdAt: string;
}

export async function fetchFormulaSheets(
  getToken: () => Promise<string | null>
): Promise<{ sheets: FormulaSheet[]; total: number; syncedAt: string; source: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/formulas', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch formulas (${res.status})`);
  }
  return res.json();
}

export async function fetchFormulaBatches(
  getToken: () => Promise<string | null>
): Promise<{ batches: FormulaImportBatch[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/formulas/batches', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch formula batches (${res.status})`);
  }
  return res.json();
}

export async function importFormulaSheetsJson(
  getToken: () => Promise<string | null>,
  sheets: unknown,
  meta?: { filename?: string | null; label?: string | null }
): Promise<{
  successCount: number;
  errors: string[];
  batchId: string | null;
  batches: FormulaImportBatch[];
  sheets: FormulaSheet[];
  total: number;
}> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/formulas/import', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sheets,
      filename: meta?.filename ?? null,
      label: meta?.label ?? null,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to import formulas (${res.status})`);
  }
  return res.json();
}

export async function deleteFormulaBatch(
  getToken: () => Promise<string | null>,
  batchId: string
): Promise<{ deletedSheets: number }> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/formulas/batches/${encodeURIComponent(batchId)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to delete formula batch (${res.status})`);
  }
  return res.json();
}
