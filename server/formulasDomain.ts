/** Domain invariants for the Formula Library (batch import like questions). */

import { SUBJECTS, isSubject, type SubjectName } from './questionsDomain.ts';

export type { SubjectName };

export interface FormulaEntry {
  name: string;
  formula: string;
  note?: string;
}

export interface FormulaSheetRecord {
  id: string;
  subject: SubjectName;
  title: string;
  chapter: string;
  formulas: FormulaEntry[];
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormulaImportBatchRecord {
  id: string;
  label: string;
  filename: string | null;
  importedByEmail: string;
  importedByName: string;
  sheetCount: number;
  errorCount: number;
  createdAt: string;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseFormulaEntry(
  raw: unknown,
  sheetIdx: number,
  formulaIdx: number
): { ok: true; entry: FormulaEntry } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      error: `Sheet #${sheetIdx + 1} formula #${formulaIdx + 1}: must be an object`,
    };
  }
  const row = raw as Record<string, unknown>;
  if (!nonEmptyString(row.name)) {
    return {
      ok: false,
      error: `Sheet #${sheetIdx + 1} formula #${formulaIdx + 1}: missing name`,
    };
  }
  if (!nonEmptyString(row.formula)) {
    return {
      ok: false,
      error: `Sheet #${sheetIdx + 1} formula #${formulaIdx + 1}: missing formula`,
    };
  }
  return {
    ok: true,
    entry: {
      name: row.name.trim(),
      formula: row.formula.trim(),
      note: nonEmptyString(row.note) ? row.note.trim() : undefined,
    },
  };
}

export function parseFormulaSheetItem(
  item: unknown,
  idx: number,
  idFactory: (i: number) => string,
  batchId?: string
):
  | { ok: true; sheet: Omit<FormulaSheetRecord, 'createdAt' | 'updatedAt'> }
  | { ok: false; error: string } {
  if (!item || typeof item !== 'object') {
    return { ok: false, error: `Item #${idx + 1}: must be an object` };
  }
  const row = item as Record<string, unknown>;

  if (!isSubject(row.subject)) {
    return {
      ok: false,
      error: `Item #${idx + 1}: Invalid or missing subject (expected one of ${SUBJECTS.join(', ')})`,
    };
  }
  if (!nonEmptyString(row.title)) {
    return { ok: false, error: `Item #${idx + 1}: missing title` };
  }
  if (!nonEmptyString(row.chapter)) {
    return { ok: false, error: `Item #${idx + 1}: missing chapter` };
  }
  if (!Array.isArray(row.formulas) || row.formulas.length === 0) {
    return {
      ok: false,
      error: `Item #${idx + 1}: formulas must be a non-empty array`,
    };
  }

  const formulas: FormulaEntry[] = [];
  for (let i = 0; i < row.formulas.length; i++) {
    const parsed = parseFormulaEntry(row.formulas[i], idx, i);
    if (parsed.ok === false) return parsed;
    formulas.push(parsed.entry);
  }

  const id = nonEmptyString(row.id) ? row.id.trim() : idFactory(idx);
  const resolvedBatchId =
    batchId ||
    (nonEmptyString(row.batchId) ? row.batchId.trim() : undefined);

  return {
    ok: true,
    sheet: {
      id,
      subject: row.subject,
      title: row.title.trim(),
      chapter: row.chapter.trim(),
      formulas,
      batchId: resolvedBatchId,
    },
  };
}

/** Bulk import: array of formula sheets. Partial success allowed. */
export function parseFormulaImportBatch(
  raw: unknown,
  opts?: { batchId?: string }
): {
  sheets: Omit<FormulaSheetRecord, 'createdAt' | 'updatedAt'>[];
  errors: string[];
} {
  if (!Array.isArray(raw)) {
    return {
      sheets: [],
      errors: ['Input JSON must be an array of formula sheet objects.'],
    };
  }
  const stamp = Date.now();
  const sheets: Omit<FormulaSheetRecord, 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];
  raw.forEach((item, idx) => {
    const parsed = parseFormulaSheetItem(
      item,
      idx,
      (i) => `fs-imp-${stamp}-${i}`,
      opts?.batchId
    );
    if (parsed.ok === true) {
      sheets.push(parsed.sheet);
      return;
    }
    errors.push(parsed.error);
  });
  return { sheets, errors };
}
