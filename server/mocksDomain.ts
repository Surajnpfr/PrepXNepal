/** Domain invariants for Fixed / Dynamic mock tests (single source of truth). */

import {
  SUBJECTS,
  isSubject,
  parseImportItem,
  type QuestionRecord,
  type SubjectName,
} from './questionsDomain.ts';

export type MockMode = 'fixed' | 'dynamic';
export type MockScope = 'full' | 'subject' | 'chapter';
export type ExamType = 'Nepal CEE';

export interface ChapterAllocationRule {
  subject: SubjectName;
  chapter: string;
  count: number;
}

export interface MockAllocation {
  subjects: Partial<Record<SubjectName, number>>;
  chapters?: ChapterAllocationRule[];
}

/** Official CEE unit blueprint (marks = question count). Source of truth for Dynamic Full. */
export const CEE_UNIT_BLUEPRINT: ReadonlyArray<{
  subject: SubjectName;
  chapter: string;
  count: number;
}> = [
  { subject: 'Zoology', chapter: 'Human Biology & Physiology', count: 15 },
  { subject: 'Zoology', chapter: 'Study of Selected Animals', count: 6 },
  { subject: 'Zoology', chapter: 'Animal Diversity & Classification', count: 4 },
  { subject: 'Zoology', chapter: 'Microbial Diseases & Immunology', count: 4 },
  { subject: 'Zoology', chapter: 'Animal Tissues & Histology', count: 4 },
  { subject: 'Zoology', chapter: 'Evolutionary Biology', count: 3 },
  { subject: 'Zoology', chapter: 'Medical Technology & Applied Biology', count: 2 },
  { subject: 'Zoology', chapter: 'Biota, Environment & Conservation', count: 2 },
  { subject: 'Botany', chapter: 'Biodiversity', count: 9 },
  { subject: 'Botany', chapter: 'Genetics', count: 6 },
  { subject: 'Botany', chapter: 'Plant Physiology', count: 6 },
  { subject: 'Botany', chapter: 'Cell Biology', count: 5 },
  { subject: 'Botany', chapter: 'Ecology & Vegetation', count: 4 },
  { subject: 'Botany', chapter: 'Plant Anatomy', count: 3 },
  { subject: 'Botany', chapter: 'Applied Botany', count: 3 },
  { subject: 'Botany', chapter: 'Developmental Botany', count: 2 },
  { subject: 'Botany', chapter: 'Basic Components of Life', count: 2 },
  { subject: 'Chemistry', chapter: 'Physical Chemistry', count: 17 },
  { subject: 'Chemistry', chapter: 'Organic Chemistry', count: 17 },
  { subject: 'Chemistry', chapter: 'Inorganic Chemistry', count: 10 },
  { subject: 'Chemistry', chapter: 'Applied Chemistry', count: 3 },
  { subject: 'Chemistry', chapter: 'Analytical Chemistry', count: 3 },
  { subject: 'Physics', chapter: 'Modern Physics', count: 12 },
  { subject: 'Physics', chapter: 'Mechanics', count: 10 },
  { subject: 'Physics', chapter: 'Current Electricity & Magnetism', count: 9 },
  { subject: 'Physics', chapter: 'Wave and Optics', count: 8 },
  { subject: 'Physics', chapter: 'Heat & Thermodynamics', count: 7 },
  { subject: 'Physics', chapter: 'Electrostatics & Capacitors', count: 4 },
  { subject: 'MAT', chapter: 'All Subsections', count: 20 },
];

function subjectsFromUnits(
  units: ReadonlyArray<{ subject: SubjectName; chapter: string; count: number }>
): Partial<Record<SubjectName, number>> {
  const subjects: Partial<Record<SubjectName, number>> = {};
  for (const u of units) {
    subjects[u.subject] = (subjects[u.subject] || 0) + u.count;
  }
  return subjects;
}

export const DEFAULT_CEE_ALLOCATION: MockAllocation = {
  subjects: subjectsFromUnits(CEE_UNIT_BLUEPRINT),
  chapters: CEE_UNIT_BLUEPRINT.map((u) => ({
    subject: u.subject,
    chapter: u.chapter,
    count: u.count,
  })),
};

/** Subject-wise dynamic paper: that subject's units from the CEE blueprint. */
export function ceeAllocationForSubject(subject: SubjectName): MockAllocation {
  const units = CEE_UNIT_BLUEPRINT.filter((u) => u.subject === subject);
  return {
    subjects: { [subject]: units.reduce((s, u) => s + u.count, 0) },
    chapters: units.map((u) => ({ subject: u.subject, chapter: u.chapter, count: u.count })),
  };
}

/** Single-unit chapter mock from the blueprint (falls back to 25 if unknown unit). */
export function ceeAllocationForChapter(subject: SubjectName, chapter: string): MockAllocation {
  const unit = CEE_UNIT_BLUEPRINT.find(
    (u) => u.subject === subject && u.chapter.toLowerCase() === chapter.trim().toLowerCase()
  );
  const count = unit?.count ?? 25;
  const name = unit?.chapter ?? chapter.trim();
  return {
    subjects: { [subject]: count },
    chapters: [{ subject, chapter: name, count }],
  };
}

export interface MockRecord {
  id: string;
  title: string;
  examType: ExamType;
  mode: MockMode;
  scope: MockScope;
  subject?: SubjectName | 'Combined';
  chapterName?: string;
  durationSec: number;
  totalQuestions: number;
  questionsPerPage: number;
  correctMarks: number;
  wrongMarks: number;
  unansweredMarks: number;
  isPublished: boolean;
  coinPrice?: number;
  year?: string;
  allocation?: MockAllocation;
  importBatchId?: string;
  questionIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockImportBatchRecord {
  id: string;
  label: string;
  filename: string | null;
  importedByEmail: string;
  importedByName: string;
  mockCount: number;
  errorCount: number;
  createdAt: string;
}

export interface SampleShortage {
  subject: SubjectName;
  chapter?: string;
  needed: number;
  available: number;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isMockMode(value: unknown): value is MockMode {
  return value === 'fixed' || value === 'dynamic';
}

function isMockScope(value: unknown): value is MockScope {
  return value === 'full' || value === 'subject' || value === 'chapter';
}

export function totalFromAllocation(allocation: MockAllocation): number {
  const chapterUsed: Partial<Record<SubjectName, number>> = {};
  for (const rule of allocation.chapters || []) {
    chapterUsed[rule.subject] = (chapterUsed[rule.subject] || 0) + rule.count;
  }
  let total = 0;
  for (const subject of SUBJECTS) {
    const subjectQuota = allocation.subjects[subject] || 0;
    const used = chapterUsed[subject] || 0;
    total += Math.max(subjectQuota, used);
  }
  // If only chapter rules (no subject totals), sum chapters
  if (total === 0 && (allocation.chapters?.length || 0) > 0) {
    return (allocation.chapters || []).reduce((s, r) => s + r.count, 0);
  }
  return total;
}

/**
 * Normalize allocation: empty subjects → default CEE blueprint for full scope.
 * Chapter counts must not exceed their subject quota when subject quota is set.
 */
export function parseAllocation(
  raw: unknown,
  opts?: { scope?: MockScope; subject?: SubjectName }
): { ok: true; allocation: MockAllocation } | { ok: false; error: string } {
  if (raw == null || raw === undefined) {
    if (opts?.scope === 'full') {
      return { ok: true, allocation: structuredClone(DEFAULT_CEE_ALLOCATION) };
    }
    if (opts?.scope === 'subject' && opts.subject) {
      return {
        ok: true,
        allocation: { subjects: { [opts.subject]: 25 }, chapters: [] },
      };
    }
    return { ok: false, error: 'allocation is required for dynamic mocks' };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'allocation must be an object' };
  }
  const row = raw as Record<string, unknown>;
  const subjectsRaw = row.subjects;
  const subjects: Partial<Record<SubjectName, number>> = {};

  if (subjectsRaw != null) {
    if (typeof subjectsRaw !== 'object' || Array.isArray(subjectsRaw)) {
      return { ok: false, error: 'allocation.subjects must be an object' };
    }
    for (const [key, val] of Object.entries(subjectsRaw as Record<string, unknown>)) {
      if (!isSubject(key)) {
        return { ok: false, error: `allocation.subjects: invalid subject "${key}"` };
      }
      const n = typeof val === 'number' ? val : Number(val);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return { ok: false, error: `allocation.subjects.${key} must be a non-negative integer` };
      }
      if (n > 0) subjects[key] = n;
    }
  }

  const chapters: ChapterAllocationRule[] = [];
  if (row.chapters != null) {
    if (!Array.isArray(row.chapters)) {
      return { ok: false, error: 'allocation.chapters must be an array' };
    }
    for (let i = 0; i < row.chapters.length; i++) {
      const item = row.chapters[i];
      if (!item || typeof item !== 'object') {
        return { ok: false, error: `allocation.chapters[${i}] must be an object` };
      }
      const c = item as Record<string, unknown>;
      if (!isSubject(c.subject)) {
        return { ok: false, error: `allocation.chapters[${i}]: invalid subject` };
      }
      if (!nonEmptyString(c.chapter)) {
        return { ok: false, error: `allocation.chapters[${i}]: missing chapter` };
      }
      const count = typeof c.count === 'number' ? c.count : Number(c.count);
      if (!Number.isFinite(count) || count < 1 || !Number.isInteger(count)) {
        return { ok: false, error: `allocation.chapters[${i}].count must be a positive integer` };
      }
      chapters.push({ subject: c.subject, chapter: c.chapter.trim(), count });
    }
  }

  if (Object.keys(subjects).length === 0 && chapters.length === 0) {
    if (opts?.scope === 'full') {
      return { ok: true, allocation: structuredClone(DEFAULT_CEE_ALLOCATION) };
    }
    return { ok: false, error: 'allocation needs subjects and/or chapters' };
  }

  const chapterUsed: Partial<Record<SubjectName, number>> = {};
  for (const rule of chapters) {
    chapterUsed[rule.subject] = (chapterUsed[rule.subject] || 0) + rule.count;
  }
  for (const subject of SUBJECTS) {
    const quota = subjects[subject];
    const used = chapterUsed[subject] || 0;
    if (quota != null && used > quota) {
      return {
        ok: false,
        error: `Chapter rules for ${subject} sum to ${used} but subject quota is ${quota}`,
      };
    }
  }

  if (opts?.scope === 'subject' && opts.subject) {
    for (const s of Object.keys(subjects)) {
      if (s !== opts.subject) {
        return { ok: false, error: `Subject-scoped mock may only allocate ${opts.subject}` };
      }
    }
    for (const rule of chapters) {
      if (rule.subject !== opts.subject) {
        return { ok: false, error: `Subject-scoped mock may only allocate ${opts.subject}` };
      }
    }
  }

  return { ok: true, allocation: { subjects, chapters } };
}

/** Expand allocation into ordered draw steps (chapter rules first, then remainder per subject). */
export function allocationDrawPlan(
  allocation: MockAllocation
): { subject: SubjectName; chapter?: string; count: number }[] {
  const plan: { subject: SubjectName; chapter?: string; count: number }[] = [];
  const chapterUsed: Partial<Record<SubjectName, number>> = {};

  for (const rule of allocation.chapters || []) {
    plan.push({ subject: rule.subject, chapter: rule.chapter, count: rule.count });
    chapterUsed[rule.subject] = (chapterUsed[rule.subject] || 0) + rule.count;
  }

  for (const subject of SUBJECTS) {
    const quota = allocation.subjects[subject] || 0;
    const used = chapterUsed[subject] || 0;
    const remaining = quota - used;
    if (remaining > 0) {
      plan.push({ subject, count: remaining });
    } else if (quota === 0 && used === 0) {
      // nothing
    }
  }

  // Chapters-only subjects with no subject quota already covered via chapter rules
  return plan.filter((p) => p.count > 0);
}

export function kindFromScope(scope: MockScope): 'Mock' | 'Chapter' {
  return scope === 'full' ? 'Mock' : 'Chapter';
}

export function testCategoryFromScope(scope: MockScope): 'full' | 'chapter' {
  return scope === 'full' ? 'full' : 'chapter';
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export function parseMockMeta(
  item: unknown,
  idx: number
):
  | {
      ok: true;
      meta: {
        title: string;
        examType: ExamType;
        mode: MockMode;
        scope: MockScope;
        subject?: SubjectName | 'Combined';
        chapterName?: string;
        durationSec: number;
        questionsPerPage: number;
        correctMarks: number;
        wrongMarks: number;
        unansweredMarks: number;
        isPublished: boolean;
        coinPrice?: number;
        year?: string;
        id?: string;
      };
    }
  | { ok: false; error: string } {
  if (!item || typeof item !== 'object') {
    return { ok: false, error: `Mock #${idx + 1}: Must be an object` };
  }
  const row = item as Record<string, unknown>;
  if (!nonEmptyString(row.title)) {
    return { ok: false, error: `Mock #${idx + 1}: Missing title` };
  }

  const mode: MockMode = isMockMode(row.mode) ? row.mode : 'fixed';
  let scope: MockScope = isMockScope(row.scope)
    ? row.scope
    : row.kind === 'Chapter' || row.testCategory === 'chapter'
      ? 'chapter'
      : 'full';

  let subject: SubjectName | 'Combined' | undefined;
  if (row.subject === 'Combined') subject = 'Combined';
  else if (isSubject(row.subject)) subject = row.subject;
  else if (scope === 'full') subject = 'Combined';

  if ((scope === 'subject' || scope === 'chapter') && (!subject || subject === 'Combined')) {
    return {
      ok: false,
      error: `Mock #${idx + 1}: subject is required for scope "${scope}"`,
    };
  }

  const chapterName = nonEmptyString(row.chapterName)
    ? row.chapterName.trim()
    : nonEmptyString(row.chapter)
      ? row.chapter.trim()
      : undefined;

  if (scope === 'chapter' && !chapterName) {
    return { ok: false, error: `Mock #${idx + 1}: chapterName required for chapter scope` };
  }

  return {
    ok: true,
    meta: {
      title: row.title.trim(),
      examType: 'Nepal CEE',
      mode,
      scope,
      subject,
      chapterName,
      durationSec: parsePositiveInt(row.durationSec, scope === 'full' ? 10800 : 1800) || 1800,
      questionsPerPage: parsePositiveInt(row.questionsPerPage, 20) || 20,
      correctMarks: typeof row.correctMarks === 'number' ? row.correctMarks : 1,
      wrongMarks: typeof row.wrongMarks === 'number' ? row.wrongMarks : -0.25,
      unansweredMarks: typeof row.unansweredMarks === 'number' ? row.unansweredMarks : 0,
      isPublished: row.isPublished === false ? false : true,
      coinPrice: typeof row.coinPrice === 'number' ? row.coinPrice : undefined,
      year: nonEmptyString(row.year) ? row.year.trim() : undefined,
      id: nonEmptyString(row.id) ? row.id.trim() : undefined,
    },
  };
}

export type FixedImportQuestion = Omit<QuestionRecord, 'createdAt' | 'updatedAt'>;

/** True when JSON is a question bank array (not wrapped mock objects). */
export function looksLikeQuestionBankArray(raw: unknown[]): boolean {
  if (raw.length === 0) return false;
  const first = raw[0];
  if (!first || typeof first !== 'object') return false;
  const row = first as Record<string, unknown>;
  // Fixed mock objects include an embedded questions[].
  if (Array.isArray(row.questions)) return false;
  const hasStem =
    (typeof row.question === 'string' && row.question.trim().length > 0) ||
    (typeof row.stem === 'string' && row.stem.trim().length > 0);
  const hasAnswer = row.correctAnswer != null || row.correctOptionKey != null;
  return hasStem && row.options != null && hasAnswer;
}

export function wrapQuestionBankAsFixedMock(
  questions: unknown[],
  opts?: { title?: string; filename?: string | null }
): Record<string, unknown> {
  const stemFrom = (value: string) => value.trim().replace(/\.json$/i, '').trim();
  const fromFile =
    typeof opts?.filename === 'string' && opts.filename.trim()
      ? stemFrom(opts.filename)
      : '';
  const fromTitle =
    typeof opts?.title === 'string' && opts.title.trim() ? stemFrom(opts.title) : '';
  // Prefer filename stem (SetA) over generic batch labels.
  const title = fromFile || fromTitle || 'Imported Fixed Mock';
  const idSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return {
    id: idSlug ? `mock-set-${idSlug}` : undefined,
    title,
    scope: 'full',
    subject: 'Combined',
    mode: 'fixed',
    durationSec: 10800,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    isPublished: true,
    questions,
  };
}

export function parseFixedMockImportItem(
  item: unknown,
  idx: number,
  opts?: { batchId?: string; questionBatchId?: string }
):
  | {
      ok: true;
      mock: Omit<MockRecord, 'createdAt' | 'updatedAt' | 'questionIds'> & {
        mode: 'fixed';
        questions: FixedImportQuestion[];
      };
    }
  | { ok: false; error: string } {
  const metaParsed = parseMockMeta({ ...(item as object), mode: 'fixed' }, idx);
  if (metaParsed.ok === false) return metaParsed;

  const row = item as Record<string, unknown>;
  if (!Array.isArray(row.questions) || row.questions.length === 0) {
    return { ok: false, error: `Mock #${idx + 1}: questions array is required for fixed mocks` };
  }

  const stamp = Date.now();
  const questions: FixedImportQuestion[] = [];
  const errors: string[] = [];
  row.questions.forEach((q, qIdx) => {
    const parsed = parseImportItem(
      q,
      qIdx,
      (i) => `q-mock-${stamp}-${idx}-${i}`,
      opts?.questionBatchId
    );
    if (parsed.ok === false) {
      errors.push(`Mock #${idx + 1} Q${qIdx + 1}: ${parsed.error}`);
      return;
    }
    questions.push(parsed.question);
  });

  if (errors.length > 0) {
    return { ok: false, error: errors[0] };
  }

  const { meta } = metaParsed;
  if (meta.scope === 'subject' || meta.scope === 'chapter') {
    const expected = meta.subject as SubjectName;
    const mismatch = questions.find((q) => q.subject !== expected);
    if (mismatch) {
      return {
        ok: false,
        error: `Mock #${idx + 1}: all questions must be ${expected} for ${meta.scope} scope`,
      };
    }
  }
  if (meta.scope === 'chapter' && meta.chapterName) {
    const mismatch = questions.find(
      (q) => q.chapter.toLowerCase() !== meta.chapterName!.toLowerCase()
    );
    if (mismatch) {
      return {
        ok: false,
        error: `Mock #${idx + 1}: all questions must be chapter "${meta.chapterName}"`,
      };
    }
  }

  const id = meta.id || `mock-fixed-${stamp}-${idx}`;
  return {
    ok: true,
    mock: {
      id,
      title: meta.title,
      examType: meta.examType,
      mode: 'fixed',
      scope: meta.scope,
      subject: meta.subject,
      chapterName: meta.chapterName,
      durationSec: meta.durationSec,
      totalQuestions: questions.length,
      questionsPerPage: meta.questionsPerPage,
      correctMarks: meta.correctMarks,
      wrongMarks: meta.wrongMarks,
      unansweredMarks: meta.unansweredMarks,
      isPublished: meta.isPublished,
      coinPrice: meta.coinPrice,
      year: meta.year,
      importBatchId: opts?.batchId,
      questions,
    },
  };
}

export function parseFixedMockImportBatch(
  raw: unknown,
  opts?: { batchId?: string; questionBatchId?: string; title?: string | null; filename?: string | null }
): {
  mocks: Array<
    Omit<MockRecord, 'createdAt' | 'updatedAt' | 'questionIds'> & {
      mode: 'fixed';
      questions: FixedImportQuestion[];
    }
  >;
  errors: string[];
} {
  if (!Array.isArray(raw)) {
    return {
      mocks: [],
      errors: [
        'Input JSON must be an array of fixed mock objects, or an array of questions (Set*.json style).',
      ],
    };
  }

  // SetA.json / question-bank files → one Fixed mock named after the file.
  const items: unknown[] = looksLikeQuestionBankArray(raw)
    ? [wrapQuestionBankAsFixedMock(raw, { title: opts?.title ?? undefined, filename: opts?.filename })]
    : raw;

  const mocks: Array<
    Omit<MockRecord, 'createdAt' | 'updatedAt' | 'questionIds'> & {
      mode: 'fixed';
      questions: FixedImportQuestion[];
    }
  > = [];
  const errors: string[] = [];
  items.forEach((item, idx) => {
    const parsed = parseFixedMockImportItem(item, idx, opts);
    if (parsed.ok === true) mocks.push(parsed.mock);
    else errors.push(parsed.error);
  });
  return { mocks, errors };
}

export function parseDynamicMockCreate(
  body: unknown
):
  | { ok: true; mock: Omit<MockRecord, 'createdAt' | 'updatedAt'> & { mode: 'dynamic' } }
  | { ok: false; error: string } {
  const metaParsed = parseMockMeta({ ...(body as object), mode: 'dynamic' }, 0);
  if (metaParsed.ok === false) return metaParsed;
  const { meta } = metaParsed;
  const subjectForAlloc =
    meta.subject && meta.subject !== 'Combined' ? meta.subject : undefined;
  const allocParsed = parseAllocation((body as Record<string, unknown>)?.allocation, {
    scope: meta.scope,
    subject: subjectForAlloc,
  });
  if (allocParsed.ok === false) return allocParsed;

  if (meta.scope === 'chapter' && meta.chapterName && subjectForAlloc) {
    const hasChapterRule = (allocParsed.allocation.chapters || []).some(
      (c) =>
        c.subject === subjectForAlloc &&
        c.chapter.toLowerCase() === meta.chapterName!.toLowerCase()
    );
    if (!hasChapterRule && !(allocParsed.allocation.subjects[subjectForAlloc] || 0)) {
      // Inject chapter rule from meta if allocation empty for chapter
      const count =
        typeof (body as any)?.totalQuestions === 'number'
          ? (body as any).totalQuestions
          : 25;
      allocParsed.allocation = {
        subjects: { [subjectForAlloc]: count },
        chapters: [{ subject: subjectForAlloc, chapter: meta.chapterName, count }],
      };
    }
  }

  const total = totalFromAllocation(allocParsed.allocation);
  if (total < 1) {
    return { ok: false, error: 'Dynamic mock allocation must request at least 1 question' };
  }

  const id = meta.id || `mock-dyn-${Date.now()}`;
  return {
    ok: true,
    mock: {
      id,
      title: meta.title,
      examType: meta.examType,
      mode: 'dynamic',
      scope: meta.scope,
      subject: meta.subject,
      chapterName: meta.chapterName,
      durationSec: meta.durationSec,
      totalQuestions: total,
      questionsPerPage: meta.questionsPerPage,
      correctMarks: meta.correctMarks,
      wrongMarks: meta.wrongMarks,
      unansweredMarks: meta.unansweredMarks,
      isPublished: meta.isPublished,
      coinPrice: meta.coinPrice,
      year: meta.year,
      allocation: allocParsed.allocation,
    },
  };
}

/**
 * Pure sampler: given a fetch function, draw without replacement per plan.
 * Used by API and tests.
 * allowPartial: take whatever is available per rule instead of failing on shortage.
 */
export async function sampleFromAllocation(
  allocation: MockAllocation,
  fetchPool: (opts: {
    subject: SubjectName;
    chapter?: string;
    excludeIds: string[];
  }) => Promise<QuestionRecord[]>,
  opts?: { allowPartial?: boolean }
): Promise<
  | { ok: true; questions: QuestionRecord[]; shortages: SampleShortage[] }
  | { ok: false; shortages: SampleShortage[] }
> {
  const allowPartial = opts?.allowPartial === true;
  const plan = allocationDrawPlan(allocation);
  const picked: QuestionRecord[] = [];
  const excludeIds: string[] = [];
  const shortages: SampleShortage[] = [];

  for (const step of plan) {
    const pool = await fetchPool({
      subject: step.subject,
      chapter: step.chapter,
      excludeIds: [...excludeIds],
    });
    const take = allowPartial ? Math.min(step.count, pool.length) : step.count;
    if (pool.length < step.count) {
      shortages.push({
        subject: step.subject,
        chapter: step.chapter,
        needed: step.count,
        available: pool.length,
      });
      if (!allowPartial) continue;
    }
    if (take <= 0) continue;

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const slice = shuffled.slice(0, take);
    for (const q of slice) {
      picked.push(q);
      excludeIds.push(q.id);
    }
  }

  // Partial practice: if unit pools were short, top up from same subject until quota.
  if (allowPartial) {
    for (const subject of SUBJECTS) {
      const quota = allocation.subjects[subject] || 0;
      if (quota <= 0) continue;
      const have = picked.filter((q) => q.subject === subject).length;
      const need = quota - have;
      if (need <= 0) continue;
      const pool = await fetchPool({
        subject,
        excludeIds: [...excludeIds],
      });
      if (pool.length === 0) continue;
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (const q of shuffled.slice(0, need)) {
        picked.push(q);
        excludeIds.push(q.id);
      }
    }
  }

  if (!allowPartial && shortages.length > 0) {
    return { ok: false, shortages };
  }
  if (picked.length === 0) {
    return { ok: false, shortages: shortages.length ? shortages : [{ subject: 'Physics', needed: 1, available: 0 }] };
  }
  return { ok: true, questions: picked, shortages };
}

export function formatShortageError(shortages: SampleShortage[]): string {
  return shortages
    .map((s) => {
      const where = s.chapter ? `${s.subject} / ${s.chapter}` : s.subject;
      return `${where}: need ${s.needed}, have ${s.available}`;
    })
    .join('; ');
}
