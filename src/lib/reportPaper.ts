import type { AttemptReport, Question } from '../types';

export type PaperAnswerKey = 'A' | 'B' | 'C' | 'D';

export type AnswerClassification = 'correct' | 'wrong' | 'skipped';

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
  try {
    const raw = localStorage.getItem(`prepx_paper_${report.mockId}`);
    if (!raw) return null;
    const questions = JSON.parse(raw) as Question[];
    if (!Array.isArray(questions) || questions.length === 0) return null;
    return { questions, answers: report.paperAnswers || {} };
  } catch {
    return null;
  }
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
