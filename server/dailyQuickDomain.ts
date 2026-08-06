/**
 * Daily Quick — one published MCQ per science subject (Phy/Chem/Bot/Zoo).
 * Items live in the question bank (tag `daily-quick`); student answers are never persisted.
 */

import {
  isOptionKey,
  normalizeOptions,
  type OptionKey,
  type QuestionOptions,
  type QuestionRecord,
  type QuestionStatus,
} from './questionsDomain.ts';
import { canApproveDailyQuickRole, canManageDailyQuickRole } from './userRoles.ts';

export const DAILY_QUICK_TAG = 'daily-quick';
export const DAILY_QUICK_CHAPTER = 'Daily Quick';
export const DAILY_QUICK_SOURCE = 'daily-quick';

export const DAILY_QUICK_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Botany',
  'Zoology',
] as const;

export type DailyQuickSubject = (typeof DAILY_QUICK_SUBJECTS)[number];

export type DailyQuickCreateInput = {
  subject: unknown;
  stem?: unknown;
  question?: unknown;
  options: unknown;
  correctOptionKey?: unknown;
  correctAnswer?: unknown;
  explanation?: unknown;
};

export function isDailyQuickSubject(value: unknown): value is DailyQuickSubject {
  return (
    typeof value === 'string' &&
    (DAILY_QUICK_SUBJECTS as readonly string[]).includes(value)
  );
}

export function isDailyQuickQuestion(
  q: Pick<QuestionRecord, 'tags' | 'chapter' | 'source'>
): boolean {
  if (q.tags?.includes(DAILY_QUICK_TAG)) return true;
  if (q.chapter === DAILY_QUICK_CHAPTER) return true;
  if (q.source === DAILY_QUICK_SOURCE) return true;
  return false;
}

export function canUploadDailyQuick(role: string | undefined, isBootstrap = false): boolean {
  return canManageDailyQuickRole(role, isBootstrap);
}

/** QAD or Admin can publish a pending Daily Quick item. */
export function canApproveDailyQuick(role: string | undefined, isBootstrap = false): boolean {
  return canApproveDailyQuickRole(role, isBootstrap);
}

export function canEditOrDeleteDailyQuick(
  role: string | undefined,
  isBootstrap = false
): boolean {
  return canManageDailyQuickRole(role, isBootstrap);
}

/**
 * Active student/guest set: latest **published** Daily Quick question per subject.
 * Missing subjects are omitted (UI shows whatever is live).
 */
export function pickActiveDailyQuickSet(questions: QuestionRecord[]): QuestionRecord[] {
  const bySubject = new Map<DailyQuickSubject, QuestionRecord>();
  const published = questions
    .filter((q) => isDailyQuickQuestion(q) && q.status === 'published')
    .filter((q) => isDailyQuickSubject(q.subject))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  for (const q of published) {
    const subject = q.subject as DailyQuickSubject;
    if (!bySubject.has(subject)) bySubject.set(subject, q);
  }

  return DAILY_QUICK_SUBJECTS.map((s) => bySubject.get(s)).filter(
    (q): q is QuestionRecord => Boolean(q)
  );
}

export function listDailyQuickQueue(questions: QuestionRecord[]): QuestionRecord[] {
  return questions
    .filter(isDailyQuickQuestion)
    .filter((q) => isDailyQuickSubject(q.subject))
    .sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === 'pending_review') return -1;
        if (b.status === 'pending_review') return 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

export function validateDailyQuickCreate(
  raw: DailyQuickCreateInput
):
  | {
      ok: true;
      subject: DailyQuickSubject;
      stem: string;
      options: QuestionOptions;
      correctOptionKey: OptionKey;
      explanation: string;
    }
  | { ok: false; error: string } {
  if (!isDailyQuickSubject(raw.subject)) {
    return {
      ok: false,
      error: `Subject must be one of ${DAILY_QUICK_SUBJECTS.join(', ')}`,
    };
  }

  const stemRaw =
    typeof raw.question === 'string' && raw.question.trim()
      ? raw.question.trim()
      : typeof raw.stem === 'string' && raw.stem.trim()
        ? raw.stem.trim()
        : '';
  if (!stemRaw) return { ok: false, error: 'Question text is required' };
  if (stemRaw.length > 4000) return { ok: false, error: 'Question text is too long' };

  const options = normalizeOptions(raw.options);
  if (!options) return { ok: false, error: 'Options A–D are required' };

  const correctRaw = raw.correctAnswer ?? raw.correctOptionKey;
  if (!isOptionKey(correctRaw)) {
    return { ok: false, error: 'Correct answer must be A, B, C, or D' };
  }

  const explanation =
    typeof raw.explanation === 'string' && raw.explanation.trim()
      ? raw.explanation.trim()
      : '';
  if (!explanation) return { ok: false, error: 'Explanation is required' };
  if (explanation.length > 8000) return { ok: false, error: 'Explanation is too long' };

  return {
    ok: true,
    subject: raw.subject,
    stem: stemRaw,
    options,
    correctOptionKey: correctRaw,
    explanation,
  };
}

/** Build a bank-ready question draft (always pending until Admin approves). */
export function buildDailyQuickQuestionDraft(
  input: {
    subject: DailyQuickSubject;
    stem: string;
    options: QuestionOptions;
    correctOptionKey: OptionKey;
    explanation: string;
  },
  id: string
): Omit<QuestionRecord, 'createdAt' | 'updatedAt'> {
  return {
    id,
    subject: input.subject,
    chapter: DAILY_QUICK_CHAPTER,
    stem: input.stem,
    options: input.options,
    correctOptionKey: input.correctOptionKey,
    explanation: input.explanation,
    tags: [DAILY_QUICK_TAG],
    language: 'en',
    status: 'pending_review' as QuestionStatus,
    source: DAILY_QUICK_SOURCE,
    flagCount: 0,
  };
}

export function applyDailyQuickApproval(
  question: QuestionRecord
): QuestionRecord | { error: string } {
  if (!isDailyQuickQuestion(question)) {
    return { error: 'Not a Daily Quick question' };
  }
  if (question.status === 'published') {
    return { error: 'Already published' };
  }
  return { ...question, status: 'published' };
}

/** PATCH merge — keeps Daily Quick identity; never auto-publishes pending items. */
export function mergeDailyQuickUpdate(
  existing: QuestionRecord,
  validated: {
    subject: DailyQuickSubject;
    stem: string;
    options: QuestionOptions;
    correctOptionKey: OptionKey;
    explanation: string;
  }
): Omit<QuestionRecord, 'createdAt' | 'updatedAt'> {
  const status: QuestionStatus =
    existing.status === 'published' ? 'published' : 'pending_review';

  return {
    id: existing.id,
    subject: validated.subject,
    chapter: DAILY_QUICK_CHAPTER,
    stem: validated.stem,
    options: validated.options,
    correctOptionKey: validated.correctOptionKey,
    explanation: validated.explanation,
    tags: existing.tags.includes(DAILY_QUICK_TAG)
      ? existing.tags
      : [...existing.tags, DAILY_QUICK_TAG],
    language: existing.language || 'en',
    status,
    source: DAILY_QUICK_SOURCE,
    flagCount: existing.flagCount,
    batchId: existing.batchId,
    imageUrl: existing.imageUrl,
    optionImages: existing.optionImages,
  };
}
