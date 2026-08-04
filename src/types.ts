export type UserRole = 'Student' | 'Moderator (Questions)' | 'Moderator (Billing)' | 'Admin';
export type ExamType = 'Nepal CEE';
export type PlanTier = 'Free' | 'Premium' | 'Unlimited';

export interface PricingPlan {
  id: string;
  code: string; // 'Free' | 'Premium' | 'Unlimited' or custom
  name: string; // e.g. 'Free Tier', 'Standard Premium', 'Unlimited Elite'
  tier: PlanTier;
  priceNpr: number;
  originalPriceNpr?: number;
  mocksGranted: number | null; // null = unlimited
  coinsGranted: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  badgeText?: string;
  status: 'active' | 'archived';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  targetScore: number;
  targetExam: ExamType;
  examDate: string; // ISO date when set; empty = tentative Ashoj–Kartik (official TBA)
  plan: PlanTier;
  mocksRemaining: number | null; // null = unlimited
  studyCoinBalance: number;
  preferredLanguage: 'en' | 'ne';
  darkTheme: boolean;
  avatarUrl?: string;
  isClerkLive?: boolean;
  clerkId?: string;
  /** Latest mock overall score synced to Clerk publicMetadata for leaderboard. */
  lastMockScore?: number;
  /** Latest mock percentile synced to Clerk publicMetadata for leaderboard. */
  lastPercentile?: number;
}

export type SubjectName = 'Physics' | 'Chemistry' | 'Zoology' | 'Botany' | 'MAT' | 'Mixed';

export type MockMode = 'fixed' | 'dynamic';
export type MockScope = 'full' | 'subject' | 'chapter';

export interface ChapterAllocationRule {
  subject: SubjectName;
  chapter: string;
  count: number;
}

export interface MockAllocation {
  subjects: Partial<Record<SubjectName, number>>;
  chapters?: ChapterAllocationRule[];
}

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
  /** Optional figure/diagram URL (MAT pattern questions, physics diagrams, etc.). */
  imageUrl?: string;
  options: QuestionOptions;
  /** Optional images for choices A–D. */
  optionImages?: Partial<Record<'A' | 'B' | 'C' | 'D', string>>;
  correctOptionKey?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  tags: string[];
  language: 'en' | 'ne';
  status: 'pending_review' | 'published' | 'flagged';
  source?: string;
  flagCount?: number;
  batchId?: string;
}

export interface MockTest {
  id: string;
  title: string;
  examType: ExamType;
  /** fixed = frozen paper; dynamic = sample at start. Defaults to fixed for legacy seed data. */
  mode?: MockMode;
  /** full | subject | chapter. Inferred from kind/testCategory when omitted. */
  scope?: MockScope;
  kind: 'Mock' | 'Chapter'; // derived from scope for catalog filters
  testCategory?: 'full' | 'chapter';
  subject?: 'Physics' | 'Chemistry' | 'Zoology' | 'Botany' | 'MAT' | 'Mixed' | 'Combined';
  chapterName?: string;
  durationSec: number; // e.g. 10800 (3 hrs) or 1800 (30 mins)
  totalQuestions: number;
  questionsPerPage: number; // default 20
  correctMarks: number; // e.g. 1
  wrongMarks: number; // e.g. -0.25
  unansweredMarks: number; // 0
  isPublished: boolean;
  coinPrice?: number; // 0 or amount required if redeemed via coins
  year?: string;
  allocation?: MockAllocation;
  importBatchId?: string;
  /** ISO timestamp from server — used for catalog "New" sort. */
  createdAt?: string;
  questions: Question[];
  /** Server session binding start → score (not persisted). */
  attemptSessionId?: string;
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
  userId?: string;
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
  /** Snapshot of the paper for PDF review (optional for older reports). */
  paperQuestions?: Question[];
  /** Student answers keyed by question id. */
  paperAnswers?: Record<string, 'A' | 'B' | 'C' | 'D'>;
}

export interface CoinTransaction {
  id: string;
  userId?: string;
  delta: number;
  reason: string;
  refType: string;
  refId: string;
  createdAt: string;
}

export interface PaymentClaim {
  id: string;
  userId: string;
  /** Clerk user id of the payer (server-backed claims). */
  clerkUserId?: string;
  userName: string;
  userEmail: string;
  planCode: string;
  /** Payable amount after promo. */
  amountNpr: number;
  /** Catalog / list price before promo. */
  listAmountNpr?: number;
  promoCode?: string;
  promoDiscountNpr?: number;
  paymentMethod: 'Fonepay' | 'eSewa' | 'Khalti' | 'Bank Transfer';
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
  batchId?: string;
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

export type NotificationKind =
  | 'mock_complete'
  | 'coins'
  | 'payment'
  | 'target'
  | 'catalog'
  | 'system'
  | 'planner';

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  desc: string;
  /** ISO timestamp — source of truth for ordering / relative time. */
  createdAt: string;
  read: boolean;
  /** Optional deep-link tab when the notification is opened. */
  hrefTab?: string;
  /** Optional entity id (report, claim, mock, etc.). */
  refId?: string;
}

export interface StudyPlanTask {
  id: string;
  userId: string;
  /** Local calendar day YYYY-MM-DD. */
  dateKey: string;
  subject: string;
  title: string;
  durationMin: number;
  completed: boolean;
  highYield: boolean;
  source: 'auto' | 'custom';
  chapter?: string;
  refReportId?: string;
}

/** Staff referral commission rate (30% of approved paid conversion). */
export const REFERRAL_COMMISSION_RATE = 0.3;

export type ReferralCommissionStatus = 'pending' | 'settled';

export interface ReferralLink {
  ownerClerkId: string;
  code: string;
  ownerEmail: string;
  ownerName: string;
  ownerRole: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralAttribution {
  referredClerkId: string;
  referrerClerkId: string;
  code: string;
  attributedAt: string;
}

export interface ReferralCommission {
  id: string;
  claimId: string;
  referredClerkId: string;
  referrerClerkId: string;
  conversionAmountNpr: number;
  commissionRate: number;
  commissionAmountNpr: number;
  status: ReferralCommissionStatus;
  createdAt: string;
  settledAt: string | null;
  settledByClerkId: string | null;
}

export interface ReferralTotals {
  totalConversionNpr: number;
  totalCommissionNpr: number;
  pendingCommissionNpr: number;
  settledCommissionNpr: number;
  conversionCount: number;
}

export interface StaffReferralBundle {
  link: ReferralLink;
  commissions: ReferralCommission[];
  totals: ReferralTotals;
}
