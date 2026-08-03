import type { ImportBatchRecord, QuestionRecord, SubjectCount, SubjectName } from '../questionsDomain.ts';
import type {
  MockImportBatchRecord,
  MockRecord,
  MockMode,
  MockScope,
} from '../mocksDomain.ts';
import type {
  ReferralAttributionRecord,
  ReferralCommissionRecord,
  ReferralLinkRecord,
} from '../referralsDomain.ts';
import type { PaymentClaimRecord, PaymentClaimStatus } from '../paymentsDomain.ts';
import type { SupportIssueRecord } from '../supportDomain.ts';
import type {
  FormulaImportBatchRecord,
  FormulaSheetRecord,
} from '../formulasDomain.ts';
import type { PromoCodeRecord } from '../promoCodesDomain.ts';

export interface CreateBatchInput {
  id: string;
  label: string;
  filename?: string | null;
  importedByEmail: string;
  importedByName: string;
  questionCount: number;
  errorCount: number;
}

export interface ChapterCount {
  subject: SubjectName;
  chapter: string;
  count: number;
}

export interface QuestionsRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  list(opts?: { status?: string; batchId?: string }): Promise<QuestionRecord[]>;
  getByIds(ids: string[]): Promise<QuestionRecord[]>;
  listPool(opts: {
    subject: SubjectName;
    chapter?: string;
    status?: string;
    excludeIds?: string[];
  }): Promise<QuestionRecord[]>;
  insertMany(questions: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>[]): Promise<number>;
  insertOne(question: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>): Promise<QuestionRecord>;
  updateOne(question: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>): Promise<QuestionRecord | null>;
  deleteOne(id: string): Promise<boolean>;
  createBatch(input: CreateBatchInput): Promise<ImportBatchRecord>;
  listBatches(): Promise<ImportBatchRecord[]>;
  getBatch(id: string): Promise<ImportBatchRecord | null>;
  deleteBatch(id: string): Promise<{ deletedQuestions: number }>;
  countsBySubject(opts?: { status?: string }): Promise<SubjectCount[]>;
  countsByChapter(opts?: { status?: string; subject?: SubjectName }): Promise<ChapterCount[]>;
  countAll(): Promise<number>;
  close(): Promise<void>;
}

export interface CreateMockBatchInput {
  id: string;
  label: string;
  filename?: string | null;
  importedByEmail: string;
  importedByName: string;
  mockCount: number;
  errorCount: number;
}

export interface MocksRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  list(opts?: {
    publishedOnly?: boolean;
    mode?: MockMode;
    scope?: MockScope;
  }): Promise<MockRecord[]>;
  getById(id: string): Promise<MockRecord | null>;
  insertFixed(
    mock: Omit<MockRecord, 'createdAt' | 'updatedAt' | 'questionIds' | 'allocation'> & {
      mode: 'fixed';
      questionIds: string[];
    }
  ): Promise<MockRecord>;
  insertDynamic(
    mock: Omit<MockRecord, 'createdAt' | 'updatedAt' | 'questionIds'> & { mode: 'dynamic' }
  ): Promise<MockRecord>;
  updateMeta(
    id: string,
    patch: Partial<
      Pick<
        MockRecord,
        | 'title'
        | 'isPublished'
        | 'durationSec'
        | 'questionsPerPage'
        | 'correctMarks'
        | 'wrongMarks'
        | 'unansweredMarks'
        | 'coinPrice'
        | 'allocation'
        | 'totalQuestions'
      >
    >
  ): Promise<MockRecord | null>;
  deleteOne(id: string): Promise<boolean>;
  createImportBatch(input: CreateMockBatchInput): Promise<MockImportBatchRecord>;
  listImportBatches(): Promise<MockImportBatchRecord[]>;
  deleteImportBatch(id: string): Promise<{ deletedMocks: number }>;
  close(): Promise<void>;
}

export function emptySubjectCounts(): SubjectCount[] {
  const subjects: SubjectName[] = [
    'Physics',
    'Chemistry',
    'Zoology',
    'Botany',
    'MAT',
  ];
  return subjects.map((subject) => ({ subject, count: 0 }));
}

export type EnsureReferralLinkInput = {
  ownerClerkId: string;
  code: string;
  ownerEmail: string;
  ownerName: string;
  ownerRole: string;
};

export type CreateCommissionInput = {
  id: string;
  claimId: string;
  referredClerkId: string;
  referrerClerkId: string;
  conversionAmountNpr: number;
  commissionRate: number;
  commissionAmountNpr: number;
};

export interface ReferralsRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  getLinkByOwner(ownerClerkId: string): Promise<ReferralLinkRecord | null>;
  getLinkByCode(code: string): Promise<ReferralLinkRecord | null>;
  ensureLink(input: EnsureReferralLinkInput): Promise<ReferralLinkRecord>;
  listLinks(): Promise<ReferralLinkRecord[]>;
  getAttribution(referredClerkId: string): Promise<ReferralAttributionRecord | null>;
  /** First-touch: returns existing if already attributed, else inserts. */
  attributeFirstTouch(input: {
    referredClerkId: string;
    referrerClerkId: string;
    code: string;
  }): Promise<{ attribution: ReferralAttributionRecord; created: boolean }>;
  getCommissionByClaimId(claimId: string): Promise<ReferralCommissionRecord | null>;
  insertCommission(
    input: CreateCommissionInput
  ): Promise<
    | { ok: true; commission: ReferralCommissionRecord }
    | { ok: false; reason: 'duplicate_claim'; existing: ReferralCommissionRecord }
  >;
  listCommissionsByReferrer(referrerClerkId: string): Promise<ReferralCommissionRecord[]>;
  listAllCommissions(): Promise<ReferralCommissionRecord[]>;
  settleCommission(
    id: string,
    settledByClerkId: string
  ): Promise<ReferralCommissionRecord | null>;
  close(): Promise<void>;
}

export type CreatePaymentClaimInput = {
  id: string;
  userId: string;
  clerkUserId: string;
  userName: string;
  userEmail: string;
  planCode: string;
  amountNpr: number;
  listAmountNpr?: number;
  promoCode?: string | null;
  promoDiscountNpr?: number;
  paymentMethod: string;
  transactionRef: string;
  screenshotUrl: string;
  userNotes?: string | null;
};

export interface PaymentClaimsRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  insert(input: CreatePaymentClaimInput): Promise<PaymentClaimRecord>;
  listAll(): Promise<PaymentClaimRecord[]>;
  listByClerkUserId(clerkUserId: string): Promise<PaymentClaimRecord[]>;
  getById(id: string): Promise<PaymentClaimRecord | null>;
  /** Update fields on a pending claim. Returns null if missing or not pending. */
  updatePending(
    id: string,
    patch: {
      planCode?: string;
      amountNpr?: number;
      listAmountNpr?: number | null;
      promoCode?: string | null;
      promoDiscountNpr?: number;
      paymentMethod?: string;
      transactionRef?: string;
      screenshotUrl?: string;
      userNotes?: string | null;
    }
  ): Promise<PaymentClaimRecord | null>;
  /** Delete a pending claim. Returns false if missing or not pending. */
  deletePending(id: string): Promise<boolean>;
  /** Atomically transition pending → approved|rejected. Returns null if not pending. */
  resolve(
    id: string,
    input: {
      status: Extract<PaymentClaimStatus, 'approved' | 'rejected'>;
      moderatorNotes?: string | null;
      verifiedBy: string;
      verifiedByClerkId: string;
    }
  ): Promise<PaymentClaimRecord | null>;
  close(): Promise<void>;
}

export type CreatePromoCodeRepoInput = {
  id: string;
  code: string;
  description?: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  applicablePlanCodes?: string[];
  maxRedemptions?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
  createdByClerkId?: string | null;
  createdByName?: string | null;
};

export type UpdatePromoCodeRepoInput = {
  description?: string | null;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  applicablePlanCodes?: string[];
  maxRedemptions?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
};

export interface PromoCodesRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  listAll(): Promise<PromoCodeRecord[]>;
  getById(id: string): Promise<PromoCodeRecord | null>;
  getByCode(code: string): Promise<PromoCodeRecord | null>;
  insert(input: CreatePromoCodeRepoInput): Promise<PromoCodeRecord>;
  update(id: string, patch: UpdatePromoCodeRepoInput): Promise<PromoCodeRecord | null>;
  /** Atomically increment redemption_count when under max (or unlimited). */
  tryIncrementRedemption(code: string): Promise<PromoCodeRecord | null>;
  deleteById(id: string): Promise<boolean>;
  close(): Promise<void>;
}

export type CreateSupportIssueInput = {
  id: string;
  clerkUserId: string;
  userName: string;
  userEmail: string;
  category: string;
  body: string;
};

export interface SupportIssuesRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  insert(input: CreateSupportIssueInput): Promise<SupportIssueRecord>;
  listAll(): Promise<SupportIssueRecord[]>;
  listByClerkUserId(clerkUserId: string): Promise<SupportIssueRecord[]>;
  getById(id: string): Promise<SupportIssueRecord | null>;
  /** Atomically open → resolved. Returns null if not open. */
  resolve(
    id: string,
    input: {
      staffNotes?: string | null;
      resolvedBy: string;
      resolvedByClerkId: string;
    }
  ): Promise<SupportIssueRecord | null>;
  close(): Promise<void>;
}

export interface CreateFormulaBatchInput {
  id: string;
  label: string;
  filename?: string | null;
  importedByEmail: string;
  importedByName: string;
  sheetCount: number;
  errorCount: number;
}

export interface FormulasRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  list(opts?: { batchId?: string }): Promise<FormulaSheetRecord[]>;
  insertMany(
    sheets: Omit<FormulaSheetRecord, 'createdAt' | 'updatedAt'>[]
  ): Promise<number>;
  createBatch(input: CreateFormulaBatchInput): Promise<FormulaImportBatchRecord>;
  listBatches(): Promise<FormulaImportBatchRecord[]>;
  getBatch(id: string): Promise<FormulaImportBatchRecord | null>;
  deleteBatch(id: string): Promise<{ deletedSheets: number }>;
  countAll(): Promise<number>;
  close(): Promise<void>;
}

