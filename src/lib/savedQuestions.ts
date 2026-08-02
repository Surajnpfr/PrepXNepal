import type { Question, SubjectName } from '../types';

const STORAGE_KEY = 'prepx_saved_questions';

export interface SavedQuestionItem {
  id: string;
  userId: string;
  questionId: string;
  subject: SubjectName;
  chapter: string;
  stem: string;
  imageUrl?: string;
  options: Question['options'];
  optionImages?: Question['optionImages'];
  /** Present only after graded review / staff bank; absent during live attempts. */
  correctOptionKey?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  savedAt: string; // ISO
  mockId?: string;
  mockTitle?: string;
}

export function loadSavedQuestions(): SavedQuestionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedQuestionItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSavedQuestions(items: SavedQuestionItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertSavedQuestion(
  list: SavedQuestionItem[],
  item: SavedQuestionItem
): SavedQuestionItem[] {
  const without = list.filter(
    (s) => !(s.userId === item.userId && s.questionId === item.questionId)
  );
  return [item, ...without];
}

export function removeSavedQuestion(
  list: SavedQuestionItem[],
  userId: string,
  questionId: string
): SavedQuestionItem[] {
  return list.filter((s) => !(s.userId === userId && s.questionId === questionId));
}

export function questionToSavedItem(input: {
  userId: string;
  question: Question;
  mockId?: string;
  mockTitle?: string;
}): SavedQuestionItem {
  const q = input.question;
  return {
    id: `sq-${input.userId}-${q.id}`,
    userId: input.userId,
    questionId: q.id,
    subject: q.subject,
    chapter: q.chapter,
    stem: q.stem,
    imageUrl: q.imageUrl,
    options: q.options,
    optionImages: q.optionImages,
    correctOptionKey: q.correctOptionKey,
    explanation: q.explanation,
    savedAt: new Date().toISOString(),
    mockId: input.mockId,
    mockTitle: input.mockTitle,
  };
}
