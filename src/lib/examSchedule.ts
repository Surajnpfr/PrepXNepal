/**
 * Nepal CEE exam schedule helpers.
 * Official date is TBA; public window is tentative Ashoj–Kartik until MEC announces.
 */

/** Shown when the student (or product) has no official exam date. */
export const TENTATIVE_EXAM_WINDOW = 'Ashoj–Kartik';
export const TENTATIVE_EXAM_LABEL = `Tentative · ${TENTATIVE_EXAM_WINDOW}`;

/**
 * Legacy mapper default that was never an official MEC date.
 * Treat as unset so existing profiles don't show a fake countdown.
 */
const LEGACY_PLACEHOLDER_EXAM_DATES = new Set(['2026-09-15']);

export function isExamDateSet(examDate?: string | null): boolean {
  const raw = (examDate || '').trim();
  if (!raw) return false;
  if (LEGACY_PLACEHOLDER_EXAM_DATES.has(raw)) return false;
  const t = new Date(raw).getTime();
  return !Number.isNaN(t);
}

export function daysUntilExamDate(examDate: string): number {
  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) return 0;
  const now = new Date();
  return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatExamDateShort(examDate: string): string {
  return new Date(examDate).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
