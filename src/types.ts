export type UserRole = 'Student' | 'Moderator' | 'Admin';
export type ExamType = 'Nepal CEE' | 'IOE Entrance';
export type PlanTier = 'Free' | 'Premium' | 'Unlimited';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  targetScore: number;
  targetExam: ExamType;
  examDate: string; // ISO date e.g. "2026-10-15"
  plan: PlanTier;
  mocksRemaining: number | null; // null = unlimited
  studyCoinBalance: number;
  preferredLanguage: 'en' | 'ne';
  darkTheme: boolean;
  avatarUrl?: string;
}

export type SubjectName = 'Physics' | 'Chemistry' | 'Zoology' | 'Botany' | 'MAT' | 'Mathematics' | 'English';

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  id: string;
  subject: SubjectName;
  chapter: string;
  stem: string;
  options: QuestionOptions;
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  tags: string[];
  language: 'en' | 'ne';
  status: 'pending_review' | 'published' | 'flagged';
  source?: string;
  flagCount?: number;
}

export interface MockTest {
  id: string;
  title: string;
  examType: ExamType;
  kind: 'Mock' | 'PYP'; // PYP = Previous Year Paper
  durationSec: number; // e.g. 10800 (3 hrs) or 7200 (2 hrs)
  totalQuestions: number;
  questionsPerPage: number; // default 20
  correctMarks: number; // e.g. 1
  wrongMarks: number; // e.g. -0.25
  unansweredMarks: number; // 0
  isPublished: boolean;
  coinPrice?: number; // 0 or amount required if redeemed via coins
  year?: string;
  questions: Question[];
}

export interface AttemptState {
  id: string;
  mockId: string;
  mockTitle: string;
  examType: ExamType;
  startedAt: string;
  endsAt: string; // ISO timestamp
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  markedForReview: string[];
  currentPage: number;
  status: 'in_progress' | 'scored' | 'void';
  totalQuestions: number;
  timeSpentSecs: Record<string, number>;
}

export interface ChapterScore {
  subject: SubjectName;
  chapter: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number; // 0 to 100
  status: 'Weak' | 'Average' | 'Strong';
}

export interface SubjectScore {
  subject: SubjectName;
  total: number;
  score: number;
  accuracy: number;
}

export interface RecommendationTask {
  id: string;
  title: string;
  subject: SubjectName;
  chapter: string;
  type: 'Revision Pack' | 'Practice Quiz';
  coinCost: number;
  estimatedMinutes: number;
  questionCount: number;
  completed?: boolean;
}

export interface AttemptReport {
  id: string;
  attemptId: string;
  mockId: string;
  mockTitle: string;
  examType: ExamType;
  completedAt: string;
  overallScore: number;
  maxScore: number;
  accuracyPercentage: number;
  totalAttempted: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentSec: number;
  predictedRank: number;
  rankBand: [number, number]; // [min, max]
  percentile: number;
  subjectScores: SubjectScore[];
  chapterScores: ChapterScore[];
  mistakeAnalysis: {
    wrongVsSkippedRatio: string;
    slowCorrectCount: number;
    speedSecPerQuestion: number;
  };
  targetScore: number;
  targetGap: number;
  recommendations: RecommendationTask[];
  shareToken: string;
}

export interface CoinTransaction {
  id: string;
  delta: number;
  reason: string;
  refType: string;
  refId: string;
  createdAt: string;
}

export interface PaymentClaim {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planCode: 'Premium' | 'Unlimited';
  amountNpr: number;
  paymentMethod: 'eSewa' | 'Khalti' | 'Bank Transfer';
  transactionRef: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  userNotes?: string;
  moderatorNotes?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface FormulaSheet {
  id: string;
  subject: SubjectName;
  title: string;
  chapter: string;
  formulas: {
    name: string;
    formula: string;
    note?: string;
  }[];
}

export interface FlaggedQuestionReport {
  id: string;
  questionId: string;
  questionStem: string;
  reporterEmail: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface BulkImportLog {
  id: string;
  filename: string;
  totalParsed: number;
  successCount: number;
  errorCount: number;
  errors: { line: number; message: string }[];
  importedAt: string;
}
