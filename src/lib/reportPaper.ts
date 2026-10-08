import type { AttemptReport, Question } from '../types';
import { loadCachedPaperQuestions } from './reportsStorage';

export type PaperAnswerKey = 'A' | 'B' | 'C' | 'D';

export type AnswerClassification = 'correct' | 'wrong' | 'skipped';

/**
 * Resolve the paper for review/PDF.
 * Prefers an in-memory `paperQuestions` snapshot (fresh score response),
 * otherwise loads the dedicated `prepx_paper_*` cache — never from the reports blob.
 */
export function resolvePaper(report: AttemptReport): {
  questions: Question[];
  answers: Record<string, PaperAnswerKey>;
} | null {
  if (report.paperQuestions && report.paperQuestions.length > 0) {
    return {
      questions: report.paperQuestions,
      answers: report.paperAnswers || {},
    };
  }
  const questions = loadCachedPaperQuestions(report.mockId);
  if (!questions?.length) return null;
  return { questions, answers: report.paperAnswers || {} };
}

export function classifyAnswer(
  q: Question,
  answers: Record<string, PaperAnswerKey>
): AnswerClassification {
  const userAns = answers[q.id];
  if (!userAns) return 'skipped';
  if (q.correctOptionKey && userAns === q.correctOptionKey) return 'correct';
  return 'wrong';
}
