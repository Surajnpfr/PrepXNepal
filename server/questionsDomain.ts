/** Domain invariants for the CEE question bank (single source of truth). */

export const SUBJECTS = [
  'Physics',
  'Chemistry',
  'Zoology',
  'Botany',
  'MAT',
] as const;

export type SubjectName = (typeof SUBJECTS)[number];
export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type QuestionStatus = 'pending_review' | 'published' | 'flagged';
export type QuestionLanguage = 'en' | 'ne';

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export type OptionImageMap = Partial<Record<OptionKey, string>>;

export interface QuestionRecord {
  id: string;
  subject: SubjectName;
  chapter: string;
  stem: string;
  /** Optional figure/diagram for the stem (common in MAT). */
  imageUrl?: string;
  options: QuestionOptions;
  /** Optional per-option images (pattern / figure choices). */
  optionImages?: OptionImageMap;
  correctOptionKey: OptionKey;
  explanation: string;
  tags: string[];
  language: QuestionLanguage;
  status: QuestionStatus;
  source?: string;
  flagCount: number;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportBatchRecord {
  id: string;
  label: string;
  filename: string | null;
  importedByEmail: string;
  importedByName: string;
  questionCount: number;
  errorCount: number;
  createdAt: string;
}

export interface SubjectCount {
  subject: SubjectName;
  count: number;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];
const STATUSES: QuestionStatus[] = ['pending_review', 'published', 'flagged'];

export function isSubject(value: unknown): value is SubjectName {
  return typeof value === 'string' && (SUBJECTS as readonly string[]).includes(value);
}

export function isOptionKey(value: unknown): value is OptionKey {
  return typeof value === 'string' && (OPTION_KEYS as readonly string[]).includes(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeOptions(raw: unknown): QuestionOptions | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!nonEmptyString(o.A) || !nonEmptyString(o.B) || !nonEmptyString(o.C) || !nonEmptyString(o.D)) {
    return null;
  }
  return { A: o.A.trim(), B: o.B.trim(), C: o.C.trim(), D: o.D.trim() };
}

/** Accept http(s) image URLs or site-relative paths; block XSS-prone schemes/types. */
export function normalizeImageUrl(value: unknown): string | undefined {
  if (!nonEmptyString(value)) return undefined;
  const url = value.trim();
  if (url.length > 2048) return undefined;
  // Site-relative only (no protocol-relative //evil).
  if (url.startsWith('/') && !url.startsWith('//')) {
    if (url.includes('\\') || url.includes('\0')) return undefined;
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    if (parsed.username || parsed.password) return undefined;
    const pathLower = parsed.pathname.toLowerCase();
    // Block common scriptable image vectors used in stored XSS.
    if (pathLower.endsWith('.svg') || pathLower.endsWith('.svgz') || pathLower.endsWith('.html')) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function normalizeOptionImages(raw: unknown): OptionImageMap | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const out: OptionImageMap = {};
  for (const key of OPTION_KEYS) {
    const url = normalizeImageUrl(o[key]);
    if (url) out[key] = url;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Accepts PRD import shape (`question`, `correctAnswer`) or app shape (`stem`, `correctOptionKey`). */
export function parseImportItem(
  item: unknown,
  idx: number,
  idFactory: (idx: number) => string,
  batchId?: string
): { ok: true; question: Omit<QuestionRecord, 'createdAt' | 'updatedAt'> } | { ok: false; error: string } {
  if (!item || typeof item !== 'object') {
    return { ok: false, error: `Item #${idx + 1}: Must be an object` };
  }
  const row = item as Record<string, unknown>;

  if (!isSubject(row.subject)) {
    return {
      ok: false,
      error: `Item #${idx + 1}: Invalid or missing subject (expected one of ${SUBJECTS.join(', ')})`,
    };
  }
  if (!nonEmptyString(row.chapter)) {
    return { ok: false, error: `Item #${idx + 1}: Missing chapter` };
  }

  const stem = nonEmptyString(row.question)
    ? row.question.trim()
    : nonEmptyString(row.stem)
      ? row.stem.trim()
      : null;
  if (!stem) {
    return { ok: false, error: `Item #${idx + 1}: Missing question/stem` };
  }

  const options = normalizeOptions(row.options);
  if (!options) {
    return { ok: false, error: `Item #${idx + 1}: options must include non-empty A, B, C, D` };
  }

  const correctRaw = row.correctAnswer ?? row.correctOptionKey;
  if (!isOptionKey(correctRaw)) {
    return { ok: false, error: `Item #${idx + 1}: correctAnswer/correctOptionKey must be A|B|C|D` };
  }

  const language: QuestionLanguage = row.language === 'ne' ? 'ne' : 'en';
  let status: QuestionStatus = 'published';
  if (typeof row.status === 'string' && (STATUSES as string[]).includes(row.status)) {
    status = row.status as QuestionStatus;
  }

  const tags = Array.isArray(row.tags)
    ? row.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
    : [];

  const resolvedBatchId =
    batchId || (nonEmptyString(row.batchId) ? row.batchId.trim() : undefined);

  const imageUrl =
    normalizeImageUrl(row.imageUrl) ||
    normalizeImageUrl(row.image) ||
    normalizeImageUrl(row.stemImageUrl);
  const optionImages =
    normalizeOptionImages(row.optionImages) ||
    normalizeOptionImages(row.optionImageUrls);

  return {
    ok: true,
    question: {
      id: nonEmptyString(row.id) ? row.id.trim() : idFactory(idx),
      subject: row.subject,
      chapter: row.chapter.trim(),
      stem,
      imageUrl,
      options,
      optionImages,
      correctOptionKey: correctRaw,
      explanation: nonEmptyString(row.explanation)
        ? row.explanation.trim()
        : 'Solution explanation verified by moderator.',
      tags,
      language,
      status,
      source: nonEmptyString(row.source) ? row.source.trim() : undefined,
      flagCount: typeof row.flagCount === 'number' && row.flagCount >= 0 ? row.flagCount : 0,
      batchId: resolvedBatchId,
    },
  };
}

export function parseImportBatch(
  raw: unknown,
  opts?: { batchId?: string }
): {
  questions: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>[];
  errors: string[];
} {
  if (!Array.isArray(raw)) {
    return { questions: [], errors: ['Input JSON must be an array of question objects.'] };
  }
  const stamp = Date.now();
  const questions: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];
  raw.forEach((item, idx) => {
    const parsed = parseImportItem(item, idx, (i) => `q-imp-${stamp}-${i}`, opts?.batchId);
    if (parsed.ok === true) {
      questions.push(parsed.question);
      return;
    }
    errors.push(parsed.error);
  });
  return { questions, errors };
}

/** Validate a full question payload for PATCH updates (id required). */
export function parseQuestionUpdate(
  id: string,
  body: unknown
): { ok: true; question: Omit<QuestionRecord, 'createdAt' | 'updatedAt'> } | { ok: false; error: string } {
  if (!nonEmptyString(id)) return { ok: false, error: 'Missing question id' };
  const parsed = parseImportItem({ ...(body as object), id }, 0, () => id);
  if (parsed.ok === false) return parsed;
  return {
    ok: true,
    question: {
      ...parsed.question,
      id,
      batchId: parsed.question.batchId,
    },
  };
}
