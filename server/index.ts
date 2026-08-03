import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { createAppRepositories, resolveDbMode } from './db/index.ts';
import { parseImportBatch, parseQuestionUpdate } from './questionsDomain.ts';
import {
  ceeAllocationForChapter,
  ceeAllocationForSubject,
  DEFAULT_CEE_ALLOCATION,
  formatShortageError,
  kindFromScope,
  parseAllocation,
  parseDynamicMockCreate,
  parseFixedMockImportBatch,
  sampleFromAllocation,
  testCategoryFromScope,
  totalFromAllocation,
  type MockRecord,
} from './mocksDomain.ts';
import { isSubject } from './questionsDomain.ts';
import type {
  FormulasRepository,
  MocksRepository,
  PaymentClaimsRepository,
  PromoCodesRepository,
  QuestionsRepository,
  ReferralsRepository,
  SupportIssuesRepository,
} from './db/types.ts';
import { consumeAttemptSession, createAttemptSession } from './attemptSessions.ts';
import type { AttemptSession } from './attemptSessions.ts';
import { updatePublicMetadataAtomic, type PublicMeta } from './clerkMeta.ts';
import {
  assertPatchBodyAllowed,
  isAllowedPlannerDateKey,
  publicErrorMessage,
} from './userPatchPolicy.ts';
import {
  REFERRAL_COMMISSION_RATE,
  canRecordReferralCommission,
  canSettleReferralCommission,
  computeCommissionAmountNpr,
  generateReferralCode,
  isReferralStaffRole,
  normalizeReferralCode,
  sumCommissionTotals,
} from './referralsDomain.ts';
import {
  canModeratePaymentClaims,
  defaultEntitlementsForPlan,
  isPaymentMethod,
  sortClaimsForQueue,
} from './paymentsDomain.ts';
import {
  canTriageSupportIssues,
  isSupportIssueCategory,
  normalizeIssueBody,
  sortIssuesForQueue,
} from './supportDomain.ts';
import { parseFormulaImportBatch } from './formulasDomain.ts';
import {
  canManagePromoCodes,
  evaluatePromoForCheckout,
  normalizePromoCode,
  validatePromoCodeCreateInput,
} from './promoCodesDomain.ts';
import {
  emailDomainBlockedMessage,
  emailDomainPolicyFromEnv,
  evaluateEmailDomain,
} from './emailDomainPolicy.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Bundled `server.js` lives at repo root; source `server/index.ts` lives in /server. */
const root = fs.existsSync(path.join(__dirname, 'package.json'))
  ? __dirname
  : path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

/** Hostinger and most PaaS inject PORT; keep API_PORT for local/dev. */
const PORT = Number(process.env.PORT || process.env.API_PORT || 3001);
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
const BOOTSTRAP_ADMIN_EMAIL =
  process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || 'surajnepal2058@gmail.com';
/** Default localhost for laptop; public bind when hosted (PORT set) or production. */
const API_BIND_HOST =
  process.env.API_BIND_HOST ||
  (process.env.PORT || process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const MOCK_COMPLETE_COINS = 20;
const CLERK_AUTHORIZED_PARTIES = (process.env.CLERK_AUTHORIZED_PARTIES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const EMAIL_DOMAIN_POLICY = emailDomainPolicyFromEnv();

if (!SECRET_KEY) {
  console.error(
    'CLERK_SECRET_KEY is missing. Set it in the host Environment Variables panel ' +
      '(or .env.local for local dev). Without it the process exits and the proxy returns 503.'
  );
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: SECRET_KEY });
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

let questionsRepo: QuestionsRepository;
let mocksRepo: MocksRepository;
let referralsRepo: ReferralsRepository;
let paymentClaimsRepo: PaymentClaimsRepository;
let supportIssuesRepo: SupportIssuesRepository;
let formulasRepo: FormulasRepository;
let promoCodesRepo: PromoCodesRepository;

type AppMeta = {
  plan?: string;
  role?: string;
  mocksRemaining?: number | null;
  studyCoinBalance?: number;
  targetScore?: number;
  targetExam?: string;
  examDate?: string;
  preferredLanguage?: string;
  darkTheme?: boolean;
  lastMockScore?: number;
  lastPercentile?: number;
  referredByClerkId?: string;
  referralCode?: string;
};

function mapUser(user: Awaited<ReturnType<typeof clerk.users.getUser>>) {
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    '';
  // Authorization entitlements: publicMetadata ONLY (never merge unsafeMetadata).
  const meta = (user.publicMetadata || {}) as AppMeta;
  const isBootstrapAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
  const plan = meta.plan || (isBootstrapAdmin ? 'Unlimited' : 'Free');
  const role = meta.role || (isBootstrapAdmin ? 'Admin' : 'Student');
  const mocksRemaining =
    meta.mocksRemaining !== undefined
      ? meta.mocksRemaining
      : plan === 'Unlimited'
        ? null
        : plan === 'Premium'
          ? 10
          : 3;
  const studyCoinBalance =
    typeof meta.studyCoinBalance === 'number' ? meta.studyCoinBalance : isBootstrapAdmin ? 9999 : 0;
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    email.split('@')[0] ||
    'Clerk User';

  return {
    id: `usr-clerk-${user.id}`,
    clerkId: user.id,
    name: fullName,
    email,
    role,
    targetScore: typeof meta.targetScore === 'number' ? meta.targetScore : 160,
    targetExam: meta.targetExam || 'Nepal CEE',
    examDate: typeof meta.examDate === 'string' ? meta.examDate : '2026-09-15',
    plan,
    mocksRemaining,
    studyCoinBalance,
    preferredLanguage: meta.preferredLanguage === 'ne' ? 'ne' : 'en',
    darkTheme: Boolean(meta.darkTheme),
    avatarUrl: user.imageUrl || '',
    isClerkLive: true,
    lastMockScore: typeof meta.lastMockScore === 'number' ? meta.lastMockScore : undefined,
    lastPercentile: typeof meta.lastPercentile === 'number' ? meta.lastPercentile : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isBootstrapAdminEmail(email: string | undefined): boolean {
  return (email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
}

function isStaff(role: string | undefined, email: string): boolean {
  return (
    isBootstrapAdminEmail(email) ||
    role === 'Admin' ||
    role === 'Moderator (Questions)' ||
    role === 'Moderator (Billing)'
  );
}

function canManageBilling(role: string | undefined, email: string): boolean {
  return (
    isBootstrapAdminEmail(email) ||
    role === 'Admin' ||
    role === 'Moderator (Billing)'
  );
}

function canManageQuestions(role: string | undefined, email: string): boolean {
  return (
    isBootstrapAdminEmail(email) ||
    role === 'Admin' ||
    role === 'Moderator (Questions)'
  );
}

function toClientQuestion(
  q: Awaited<ReturnType<QuestionsRepository['list']>>[number],
  includeAnswers = false
) {
  const base = {
    id: q.id,
    subject: q.subject,
    chapter: q.chapter,
    stem: q.stem,
    imageUrl: q.imageUrl,
    options: q.options,
    optionImages: q.optionImages,
    tags: q.tags,
    language: q.language,
    status: q.status,
    source: q.source,
    flagCount: q.flagCount,
    batchId: q.batchId,
  };
  if (!includeAnswers) return base;
  return {
    ...base,
    correctOptionKey: q.correctOptionKey,
    explanation: q.explanation,
  };
}

function resolvePlanQuota(meta: PublicMeta): {
  plan: string;
  mocksRemaining: number | null;
} {
  const plan = typeof meta.plan === 'string' ? meta.plan : 'Free';
  if (plan === 'Unlimited' || meta.mocksRemaining === null) {
    return { plan: plan === 'Unlimited' ? 'Unlimited' : plan, mocksRemaining: null };
  }
  if (typeof meta.mocksRemaining === 'number') {
    return { plan, mocksRemaining: meta.mocksRemaining };
  }
  return {
    plan,
    mocksRemaining: plan === 'Premium' ? 10 : 3,
  };
}

async function mutateClerkMeta(
  clerkUserId: string,
  mutator: (draft: PublicMeta) =>
    | { ok: true; next: PublicMeta }
    | { ok: false; error: string; status: number }
): Promise<ReturnType<typeof mapUser>> {
  const result = await updatePublicMetadataAtomic({
    userId: clerkUserId,
    getUser: (id) => clerk.users.getUser(id),
    updateUser: (id, data) => clerk.users.updateUser(id, data),
    mutator: (draft) => mutator(draft),
  });
  if ('error' in result) {
    const err: any = new Error(result.error);
    err.status = result.status;
    throw err;
  }
  return mapUser(result.user);
}

/** Decrement mock quota using fresh Clerk metadata (never stale request profile). */
async function consumeMockQuota(clerkUserId: string): Promise<ReturnType<typeof mapUser>> {
  return mutateClerkMeta(clerkUserId, (draft) => {
    const { plan, mocksRemaining } = resolvePlanQuota(draft);
    if (plan === 'Unlimited' || mocksRemaining === null) {
      draft.plan = plan === 'Unlimited' ? 'Unlimited' : draft.plan;
      return { ok: true, next: draft };
    }
    if (mocksRemaining <= 0) {
      return {
        ok: false,
        error: 'No mock quota remaining. Upgrade your plan to continue.',
        status: 402,
      };
    }
    draft.mocksRemaining = mocksRemaining - 1;
    return { ok: true, next: draft };
  });
}

/** Charge catalog coinPrice for a mock start (alternative to quota burn). */
async function chargeMockCoinPrice(
  clerkUserId: string,
  coinPrice: number
): Promise<ReturnType<typeof mapUser>> {
  const price = Math.floor(coinPrice);
  if (price <= 0) {
    const u = await clerk.users.getUser(clerkUserId);
    return mapUser(u);
  }
  return mutateClerkMeta(clerkUserId, (draft) => {
    const balance = typeof draft.studyCoinBalance === 'number' ? draft.studyCoinBalance : 0;
    if (balance < price) {
      return { ok: false, error: 'Insufficient Study Coins for this mock', status: 402 };
    }
    draft.studyCoinBalance = balance - price;
    return { ok: true, next: draft };
  });
}

/**
 * Paid mocks (coinPrice > 0) charge coins and skip quota.
 * Free mocks consume quota. Runs after paper is successfully built.
 */
async function authorizeStartedMock(
  clerkUserId: string,
  coinPrice: number | null | undefined
): Promise<{ profile: ReturnType<typeof mapUser>; coinPriceCharged: number }> {
  const price = typeof coinPrice === 'number' && coinPrice > 0 ? Math.floor(coinPrice) : 0;
  if (price > 0) {
    const profile = await chargeMockCoinPrice(clerkUserId, price);
    return { profile, coinPriceCharged: price };
  }
  const profile = await consumeMockQuota(clerkUserId);
  return { profile, coinPriceCharged: 0 };
}

function sessionMarksFromMock(mock: { correctMarks?: number; wrongMarks?: number }) {
  return {
    correctMarks: typeof mock.correctMarks === 'number' ? mock.correctMarks : 1,
    wrongMarks: typeof mock.wrongMarks === 'number' ? mock.wrongMarks : -0.25,
  };
}

function toClientBatch(b: Awaited<ReturnType<QuestionsRepository['listBatches']>>[number]) {
  return {
    id: b.id,
    label: b.label,
    filename: b.filename,
    importedByEmail: b.importedByEmail,
    importedByName: b.importedByName,
    questionCount: b.questionCount,
    errorCount: b.errorCount,
    createdAt: b.createdAt,
  };
}

function toClientFormulaSheet(s: Awaited<ReturnType<FormulasRepository['list']>>[number]) {
  return {
    id: s.id,
    subject: s.subject,
    title: s.title,
    chapter: s.chapter,
    formulas: s.formulas,
    batchId: s.batchId,
  };
}

function toClientFormulaBatch(
  b: Awaited<ReturnType<FormulasRepository['listBatches']>>[number]
) {
  return {
    id: b.id,
    label: b.label,
    filename: b.filename,
    importedByEmail: b.importedByEmail,
    importedByName: b.importedByName,
    sheetCount: b.sheetCount,
    errorCount: b.errorCount,
    createdAt: b.createdAt,
  };
}

function toClientMock(m: MockRecord, questions?: ReturnType<typeof toClientQuestion>[]) {
  return {
    id: m.id,
    title: m.title,
    examType: m.examType,
    mode: m.mode,
    scope: m.scope,
    kind: kindFromScope(m.scope),
    testCategory: testCategoryFromScope(m.scope),
    subject: m.subject,
    chapterName: m.chapterName,
    durationSec: m.durationSec,
    totalQuestions: m.totalQuestions,
    questionsPerPage: m.questionsPerPage,
    correctMarks: m.correctMarks,
    wrongMarks: m.wrongMarks,
    unansweredMarks: m.unansweredMarks,
    isPublished: m.isPublished,
    coinPrice: m.coinPrice,
    year: m.year,
    allocation: m.allocation,
    importBatchId: m.importBatchId,
    questions: questions || [],
  };
}

function toClientMockBatch(b: Awaited<ReturnType<MocksRepository['listImportBatches']>>[number]) {
  return {
    id: b.id,
    label: b.label,
    filename: b.filename,
    importedByEmail: b.importedByEmail,
    importedByName: b.importedByName,
    mockCount: b.mockCount,
    errorCount: b.errorCount,
    createdAt: b.createdAt,
  };
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }
    const token = header.slice('Bearer '.length).trim();
    const verifyOpts: { secretKey: string; authorizedParties?: string[] } = {
      secretKey: SECRET_KEY!,
    };
    if (CLERK_AUTHORIZED_PARTIES.length > 0) {
      verifyOpts.authorizedParties = CLERK_AUTHORIZED_PARTIES;
    }
    const payload = await verifyToken(token, verifyOpts);
    const user = await clerk.users.getUser(payload.sub);
    const profile = mapUser(user);

    const emailCheck = evaluateEmailDomain(profile.email, EMAIL_DOMAIN_POLICY);
    if (emailCheck.ok === false) {
      console.warn(
        `Blocked email domain for user ${user.id}: ${emailCheck.domain || '(none)'} (${emailCheck.reason})`
      );
      return res.status(403).json({
        error: emailDomainBlockedMessage(emailCheck),
        code: 'EMAIL_DOMAIN_BLOCKED',
        reason: emailCheck.reason,
      });
    }

    (req as any).auth = { userId: user.id, profile };
    next();
  } catch (err: any) {
    console.warn('Auth failed:', err?.message || err);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    source: 'clerk-backend',
    realtime: true,
    questionsDb: resolveDbMode(),
  });
});

/** List questions from durable DB (staff: all; others: published only). */
app.get('/api/questions', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    const staffQs = canManageQuestions(profile.role, profile.email);
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    const batchId = typeof req.query.batchId === 'string' ? req.query.batchId : undefined;
    const list = staffQs
      ? await questionsRepo.list({
          ...(statusParam ? { status: statusParam } : {}),
          ...(batchId ? { batchId } : {}),
        })
      : await questionsRepo.list({ status: 'published', ...(batchId ? { batchId } : {}) });
    res.json({
      questions: list.map((q) => toClientQuestion(q, staffQs)),
      total: list.length,
      syncedAt: new Date().toISOString(),
      source: questionsRepo.driver,
    });
  } catch (err: any) {
    console.error('GET /api/questions failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to list questions' });
  }
});

/** Import batches (Admin / Questions Moderator). */
app.get('/api/questions/batches', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const batches = await questionsRepo.listBatches();
    res.json({
      batches: batches.map(toClientBatch),
      syncedAt: new Date().toISOString(),
      source: questionsRepo.driver,
    });
  } catch (err: any) {
    console.error('GET /api/questions/batches failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to list batches' });
  }
});

/** Subject counts for pie chart / bank inventory. */
app.get('/api/questions/stats', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    const staffQs = canManageQuestions(profile.role, profile.email);
    const bySubject = staffQs
      ? await questionsRepo.countsBySubject()
      : await questionsRepo.countsBySubject({ status: 'published' });
    const byChapter = staffQs
      ? await questionsRepo.countsByChapter()
      : await questionsRepo.countsByChapter({ status: 'published' });
    const total = bySubject.reduce((sum, row) => sum + row.count, 0);
    res.json({
      bySubject,
      byChapter,
      total,
      syncedAt: new Date().toISOString(),
      source: questionsRepo.driver,
    });
  } catch (err: any) {
    console.error('GET /api/questions/stats failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to load question stats' });
  }
});

/** Create a single question (Admin / Questions Moderator). */
app.post('/api/questions', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const parsed = parseImportBatch([req.body]);
    if (parsed.questions.length === 0) {
      return res.status(400).json({ error: parsed.errors[0] || 'Invalid question payload' });
    }
    const saved = await questionsRepo.insertOne(parsed.questions[0]);
    res.status(201).json({
      question: toClientQuestion(saved, true),
      syncedAt: new Date().toISOString(),
      source: questionsRepo.driver,
    });
  } catch (err: any) {
    console.error('POST /api/questions failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to create question' });
  }
});

/** Update one question (Admin / Questions Moderator). */
app.patch('/api/questions/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const parsed = parseQuestionUpdate(req.params.id, req.body);
    if (parsed.ok === false) {
      return res.status(400).json({ error: parsed.error });
    }
    const saved = await questionsRepo.updateOne(parsed.question);
    if (!saved) return res.status(404).json({ error: 'Question not found' });
    res.json({
      question: toClientQuestion(saved, true),
      syncedAt: new Date().toISOString(),
      source: questionsRepo.driver,
    });
  } catch (err: any) {
    console.error('PATCH /api/questions/:id failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to update question' });
  }
});

/** Delete an entire import batch and its questions. */
app.delete('/api/questions/batches/:batchId', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const existing = await questionsRepo.getBatch(req.params.batchId);
    if (!existing) return res.status(404).json({ error: 'Batch not found' });
    const result = await questionsRepo.deleteBatch(req.params.batchId);
    res.json({
      deleted: true,
      batchId: req.params.batchId,
      deletedQuestions: result.deletedQuestions,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('DELETE /api/questions/batches/:batchId failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete batch' });
  }
});

/** Delete one question (Admin / Questions Moderator). */
app.delete('/api/questions/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const ok = await questionsRepo.deleteOne(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Question not found' });
    res.json({ deleted: true, id: req.params.id, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('DELETE /api/questions/:id failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete question' });
  }
});

/** Bulk import JSON array → durable DB as one batch. Partial success allowed. */
app.post('/api/questions/import', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }

    const payload = Array.isArray(req.body) ? req.body : req.body?.questions;
    const filename =
      typeof req.body?.filename === 'string' && req.body.filename.trim()
        ? req.body.filename.trim()
        : null;
    const label =
      typeof req.body?.label === 'string' && req.body.label.trim()
        ? req.body.label.trim()
        : filename || `Import ${new Date().toLocaleString()}`;

    const batchId = `batch-${Date.now()}`;
    const parsed = parseImportBatch(payload, { batchId });
    let successCount = 0;
    if (parsed.questions.length > 0) {
      await questionsRepo.createBatch({
        id: batchId,
        label,
        filename,
        importedByEmail: profile.email,
        importedByName: profile.name,
        questionCount: parsed.questions.length,
        errorCount: parsed.errors.length,
      });
      successCount = await questionsRepo.insertMany(parsed.questions);
    }

    const bySubject = await questionsRepo.countsBySubject();
    const batches = await questionsRepo.listBatches();
    res.json({
      successCount,
      errors: parsed.errors,
      batchId: successCount > 0 ? batchId : null,
      batches: batches.map(toClientBatch),
      bySubject,
      total: bySubject.reduce((sum, row) => sum + row.count, 0),
      syncedAt: new Date().toISOString(),
      source: questionsRepo.driver,
    });
  } catch (err: any) {
    console.error('POST /api/questions/import failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to import questions' });
  }
});

/** List mock tests (students: published; staff: all). */
app.get('/api/mocks', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    const staffQs = canManageQuestions(profile.role, profile.email);
    const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;
    const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;
    const list = await mocksRepo.list({
      publishedOnly: !staffQs,
      ...(mode === 'fixed' || mode === 'dynamic' ? { mode } : {}),
      ...(scope === 'full' || scope === 'subject' || scope === 'chapter' ? { scope } : {}),
    });
    res.json({
      mocks: list.map((m) => toClientMock(m)),
      total: list.length,
      syncedAt: new Date().toISOString(),
      source: mocksRepo.driver,
    });
  } catch (err: any) {
    console.error('GET /api/mocks failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to list mocks' });
  }
});

app.get('/api/mocks/batches', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const batches = await mocksRepo.listImportBatches();
    res.json({
      batches: batches.map(toClientMockBatch),
      syncedAt: new Date().toISOString(),
      source: mocksRepo.driver,
    });
  } catch (err: any) {
    console.error('GET /api/mocks/batches failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to list mock batches' });
  }
});

/** Create a dynamic (or validated) mock definition. */
app.post('/api/mocks', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const mode = req.body?.mode === 'fixed' ? 'fixed' : 'dynamic';
    if (mode === 'dynamic') {
      const parsed = parseDynamicMockCreate(req.body);
      if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
      const saved = await mocksRepo.insertDynamic(parsed.mock);
      return res.status(201).json({
        mock: toClientMock(saved),
        syncedAt: new Date().toISOString(),
        source: mocksRepo.driver,
      });
    }
    return res.status(400).json({
      error: 'Use POST /api/mocks/import for fixed mocks with embedded questions',
    });
  } catch (err: any) {
    console.error('POST /api/mocks failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to create mock' });
  }
});

/** Batch import fixed mocks (embedded questions upserted into bank). */
app.post('/api/mocks/import', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }

    const payload = Array.isArray(req.body) ? req.body : req.body?.mocks;
    const filename =
      typeof req.body?.filename === 'string' && req.body.filename.trim()
        ? req.body.filename.trim()
        : null;
    const label =
      typeof req.body?.label === 'string' && req.body.label.trim()
        ? req.body.label.trim()
        : filename || `Mock import ${new Date().toLocaleString()}`;

    const batchId = `mock-batch-${Date.now()}`;
    const questionBatchId = `batch-mockq-${Date.now()}`;
    const parsed = parseFixedMockImportBatch(payload, { batchId, questionBatchId });

    let successCount = 0;
    const imported: ReturnType<typeof toClientMock>[] = [];

    if (parsed.mocks.length > 0) {
      const allQuestions = parsed.mocks.flatMap((m) => m.questions);
      await questionsRepo.createBatch({
        id: questionBatchId,
        label: `${label} (questions)`,
        filename,
        importedByEmail: profile.email,
        importedByName: profile.name,
        questionCount: allQuestions.length,
        errorCount: 0,
      });
      await questionsRepo.insertMany(allQuestions);

      await mocksRepo.createImportBatch({
        id: batchId,
        label,
        filename,
        importedByEmail: profile.email,
        importedByName: profile.name,
        mockCount: parsed.mocks.length,
        errorCount: parsed.errors.length,
      });

      for (const m of parsed.mocks) {
        const saved = await mocksRepo.insertFixed({
          id: m.id,
          title: m.title,
          examType: m.examType,
          mode: 'fixed',
          scope: m.scope,
          subject: m.subject,
          chapterName: m.chapterName,
          durationSec: m.durationSec,
          totalQuestions: m.totalQuestions,
          questionsPerPage: m.questionsPerPage,
          correctMarks: m.correctMarks,
          wrongMarks: m.wrongMarks,
          unansweredMarks: m.unansweredMarks,
          isPublished: m.isPublished,
          coinPrice: m.coinPrice,
          year: m.year,
          importBatchId: batchId,
          questionIds: m.questions.map((q) => q.id),
        });
        imported.push(toClientMock(saved));
        successCount += 1;
      }
    }

    const batches = await mocksRepo.listImportBatches();
    res.json({
      successCount,
      errors: parsed.errors,
      batchId: successCount > 0 ? batchId : null,
      mocks: imported,
      batches: batches.map(toClientMockBatch),
      syncedAt: new Date().toISOString(),
      source: mocksRepo.driver,
    });
  } catch (err: any) {
    console.error('POST /api/mocks/import failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to import mocks' });
  }
});

/**
 * Student self-serve practice paper: sample from bank by official CEE unit blueprint.
 * Must be registered before /api/mocks/:id* so "practice" is never treated as an id.
 */
app.post('/api/mocks/practice', requireAuth, async (req, res) => {
  try {
    const { profile, userId } = (req as any).auth;
    const body = (req.body || {}) as Record<string, unknown>;
    const scope =
      body.scope === 'subject' || body.scope === 'chapter' || body.scope === 'full'
        ? body.scope
        : 'full';

    let allocation = structuredClone(DEFAULT_CEE_ALLOCATION);
    let subject: import('./questionsDomain.ts').SubjectName | 'Combined' | undefined =
      body.subject === 'Combined' ? 'Combined' : isSubject(body.subject) ? body.subject : undefined;
    let chapterName =
      typeof body.chapterName === 'string' && body.chapterName.trim()
        ? body.chapterName.trim()
        : undefined;

    if (scope === 'subject') {
      if (!subject || subject === 'Combined') {
        return res.status(400).json({ error: 'subject is required for subject-wise practice' });
      }
      allocation = ceeAllocationForSubject(subject);
    } else if (scope === 'chapter') {
      if (!subject || subject === 'Combined' || !chapterName) {
        return res.status(400).json({ error: 'subject and chapterName are required for chapter practice' });
      }
      allocation = ceeAllocationForChapter(subject, chapterName);
      chapterName = allocation.chapters?.[0]?.chapter || chapterName;
    } else {
      subject = 'Combined';
    }

    const parsed = parseDynamicMockCreate({
      title:
        typeof body.title === 'string' && body.title.trim()
          ? body.title.trim()
          : scope === 'full'
            ? 'My Dynamic Full CEE Mock'
            : scope === 'subject'
              ? `My ${subject} Subject Mock`
              : `My ${subject} · ${chapterName} Chapter Mock`,
      scope,
      subject,
      chapterName,
      durationSec: typeof body.durationSec === 'number' ? body.durationSec : undefined,
      questionsPerPage: typeof body.questionsPerPage === 'number' ? body.questionsPerPage : undefined,
      mode: 'dynamic',
      isPublished: true,
      allocation,
      id: `practice-${profile.clerkId || profile.id}-${Date.now()}`,
    });
    if (parsed.ok === false) {
      return res.status(400).json({ error: parsed.error });
    }

    const sampled = await sampleFromAllocation(
      parsed.mock.allocation!,
      async ({ subject: s, chapter, excludeIds }) =>
        questionsRepo.listPool({
          subject: s,
          chapter,
          status: 'published',
          excludeIds,
        }),
      { allowPartial: true }
    );

    if (sampled.ok === false) {
      return res.status(409).json({
        error:
          'No published questions available in the bank for this mock. Import questions first.',
        shortages: sampled.shortages,
      });
    }

    const now = new Date().toISOString();
    const ephemeral: MockRecord = {
      ...parsed.mock,
      allocation: parsed.mock.allocation,
      totalQuestions: sampled.questions.length,
      createdAt: now,
      updatedAt: now,
    };

    const questionIds = sampled.questions.map((q) => q.id);
    let coinPriceCharged = 0;
    try {
      const access = await authorizeStartedMock(userId, ephemeral.coinPrice);
      coinPriceCharged = access.coinPriceCharged;
    } catch (accessErr: any) {
      return res
        .status(accessErr?.status || 402)
        .json({ error: accessErr?.message || 'Quota exhausted' });
    }
    const marks = sessionMarksFromMock(ephemeral);
    const attemptSessionId = createAttemptSession({
      userId,
      questionIds,
      mockId: ephemeral.id,
      correctMarks: marks.correctMarks,
      wrongMarks: marks.wrongMarks,
      coinPriceCharged,
    });
    res.json({
      mock: toClientMock(
        ephemeral,
        sampled.questions.map((q) => toClientQuestion(q, false))
      ),
      attemptSessionId,
      ephemeral: true,
      partialFill: sampled.shortages.length > 0,
      shortages: sampled.shortages,
      syncedAt: now,
      source: questionsRepo.driver,
    });
  } catch (err: any) {
    console.error('POST /api/mocks/practice failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to generate practice mock') });
  }
});

app.patch('/api/mocks/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const body = req.body || {};
    let allocation = undefined;
    let totalQuestions = undefined;
    if (body.allocation != null) {
      const existing = await mocksRepo.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Mock not found' });
      const subjectForAlloc =
        existing.subject && existing.subject !== 'Combined' ? existing.subject : undefined;
      const parsed = parseAllocation(body.allocation, {
        scope: existing.scope,
        subject: subjectForAlloc,
      });
      if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
      allocation = parsed.allocation;
      totalQuestions = totalFromAllocation(allocation);
    }
    const saved = await mocksRepo.updateMeta(req.params.id, {
      title: typeof body.title === 'string' ? body.title : undefined,
      isPublished: typeof body.isPublished === 'boolean' ? body.isPublished : undefined,
      durationSec: typeof body.durationSec === 'number' ? body.durationSec : undefined,
      questionsPerPage: typeof body.questionsPerPage === 'number' ? body.questionsPerPage : undefined,
      correctMarks: typeof body.correctMarks === 'number' ? body.correctMarks : undefined,
      wrongMarks: typeof body.wrongMarks === 'number' ? body.wrongMarks : undefined,
      unansweredMarks: typeof body.unansweredMarks === 'number' ? body.unansweredMarks : undefined,
      coinPrice: body.coinPrice === null ? null : typeof body.coinPrice === 'number' ? body.coinPrice : undefined,
      allocation,
      totalQuestions,
    } as any);
    if (!saved) return res.status(404).json({ error: 'Mock not found' });
    res.json({
      mock: toClientMock(saved),
      syncedAt: new Date().toISOString(),
      source: mocksRepo.driver,
    });
  } catch (err: any) {
    console.error('PATCH /api/mocks/:id failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to update mock' });
  }
});

app.delete('/api/mocks/batches/:batchId', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const result = await mocksRepo.deleteImportBatch(req.params.batchId);
    res.json({
      deleted: true,
      batchId: req.params.batchId,
      deletedMocks: result.deletedMocks,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('DELETE /api/mocks/batches/:batchId failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete mock batch' });
  }
});

app.delete('/api/mocks/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const ok = await mocksRepo.deleteOne(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Mock not found' });
    res.json({ deleted: true, id: req.params.id, syncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('DELETE /api/mocks/:id failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete mock' });
  }
});

/** Resolve a concrete paper for an attempt (fixed identity / dynamic sample). */
app.post('/api/mocks/:id/start', requireAuth, async (req, res) => {
  try {
    const { profile, userId } = (req as any).auth;
    const mock = await mocksRepo.getById(req.params.id);
    if (!mock) return res.status(404).json({ error: 'Mock not found' });
    if (!mock.isPublished) {
      if (!canManageQuestions(profile.role, profile.email)) {
        return res.status(403).json({ error: 'Mock is not published' });
      }
    }

    const marks = sessionMarksFromMock(mock);

    if (mock.mode === 'fixed') {
      const ids = mock.questionIds || [];
      const records = await questionsRepo.getByIds(ids);
      if (records.length !== ids.length) {
        return res.status(409).json({
          error: `Fixed mock is missing questions in the bank (${records.length}/${ids.length} found)`,
        });
      }
      let coinPriceCharged = 0;
      try {
        const access = await authorizeStartedMock(userId, mock.coinPrice);
        coinPriceCharged = access.coinPriceCharged;
      } catch (accessErr: any) {
        return res
          .status(accessErr?.status || 402)
          .json({ error: accessErr?.message || 'Quota exhausted' });
      }
      const attemptSessionId = createAttemptSession({
        userId,
        questionIds: ids,
        mockId: mock.id,
        correctMarks: marks.correctMarks,
        wrongMarks: marks.wrongMarks,
        coinPriceCharged,
      });
      return res.json({
        mock: toClientMock(
          mock,
          records.map((q) => toClientQuestion(q, false))
        ),
        attemptSessionId,
        syncedAt: new Date().toISOString(),
        source: mocksRepo.driver,
      });
    }

    const allocation = mock.allocation;
    if (!allocation) {
      return res.status(400).json({ error: 'Dynamic mock has no allocation' });
    }

    const sampled = await sampleFromAllocation(allocation, async ({ subject, chapter, excludeIds }) =>
      questionsRepo.listPool({
        subject,
        chapter,
        status: 'published',
        excludeIds,
      })
    );

    if (sampled.ok === false) {
      return res.status(409).json({
        error: `Insufficient question bank inventory: ${formatShortageError(sampled.shortages)}`,
        shortages: sampled.shortages,
      });
    }

    const questionIds = sampled.questions.map((q) => q.id);
    let coinPriceCharged = 0;
    try {
      const access = await authorizeStartedMock(userId, mock.coinPrice);
      coinPriceCharged = access.coinPriceCharged;
    } catch (accessErr: any) {
      return res
        .status(accessErr?.status || 402)
        .json({ error: accessErr?.message || 'Quota exhausted' });
    }
    const attemptSessionId = createAttemptSession({
      userId,
      questionIds,
      mockId: mock.id,
      correctMarks: marks.correctMarks,
      wrongMarks: marks.wrongMarks,
      coinPriceCharged,
    });
    res.json({
      mock: toClientMock(
        mock,
        sampled.questions.map((q) => toClientQuestion(q, false))
      ),
      attemptSessionId,
      syncedAt: new Date().toISOString(),
      source: mocksRepo.driver,
    });
  } catch (err: any) {
    console.error('POST /api/mocks/:id/start failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to start mock') });
  }
});

/**
 * Server-side scoring: answers never trust the client paper.
 * Returns graded report + full paper (with keys) for post-attempt review/PDF.
 */
app.post('/api/mocks/score', requireAuth, async (req, res) => {
  try {
    const { profile, userId } = (req as any).auth;
    const body = (req.body || {}) as Record<string, unknown>;
    const attemptSessionId =
      typeof body.attemptSessionId === 'string' ? body.attemptSessionId.trim() : '';
    if (!attemptSessionId) {
      return res.status(400).json({ error: 'attemptSessionId required (start the mock first)' });
    }
    const questionIds = Array.isArray(body.questionIds)
      ? body.questionIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];
    const answers =
      body.answers && typeof body.answers === 'object'
        ? (body.answers as Record<string, string>)
        : {};
    if (questionIds.length === 0) {
      return res.status(400).json({ error: 'questionIds required' });
    }
    if (questionIds.length > 400) {
      return res.status(400).json({ error: 'Too many questions in one attempt' });
    }

    let session: AttemptSession;
    try {
      session = consumeAttemptSession(attemptSessionId, userId, questionIds);
    } catch (sessionErr: any) {
      return res.status(sessionErr?.status || 403).json({ error: sessionErr?.message || 'Invalid session' });
    }

    const records = await questionsRepo.getByIds(questionIds);
    if (records.length !== questionIds.length) {
      return res.status(409).json({
        error: `Could not resolve full paper (${records.length}/${questionIds.length})`,
      });
    }

    const byId = new Map(records.map((q) => [q.id, q]));
    const ordered = questionIds.map((id) => byId.get(id)!);
    // Marks are bound at start — never trust client-supplied scoring weights.
    const correctMarks = session.correctMarks;
    const wrongMarks = session.wrongMarks;
    const mockTitle = typeof body.mockTitle === 'string' ? body.mockTitle : 'Mock Attempt';
    const mockId =
      typeof body.mockId === 'string' && body.mockId === session.mockId
        ? body.mockId
        : session.mockId;
    const startedAt = typeof body.startedAt === 'string' ? body.startedAt : undefined;

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const subjectMap: Record<string, { total: number; correct: number; wrong: number; score: number }> = {};
    const chapterMap: Record<
      string,
      { subject: string; total: number; correct: number; wrong: number; skipped: number }
    > = {};

    ordered.forEach((q) => {
      if (!subjectMap[q.subject]) subjectMap[q.subject] = { total: 0, correct: 0, wrong: 0, score: 0 };
      if (!chapterMap[q.chapter]) {
        chapterMap[q.chapter] = { subject: q.subject, total: 0, correct: 0, wrong: 0, skipped: 0 };
      }
      subjectMap[q.subject].total += 1;
      chapterMap[q.chapter].total += 1;
      const userAns = answers[q.id];
      if (!userAns || !['A', 'B', 'C', 'D'].includes(userAns)) {
        skipped += 1;
        chapterMap[q.chapter].skipped += 1;
      } else if (userAns === q.correctOptionKey) {
        correct += 1;
        subjectMap[q.subject].correct += 1;
        subjectMap[q.subject].score += correctMarks;
        chapterMap[q.chapter].correct += 1;
      } else {
        wrong += 1;
        subjectMap[q.subject].wrong += 1;
        subjectMap[q.subject].score += wrongMarks;
        chapterMap[q.chapter].wrong += 1;
      }
    });

    const totalQ = ordered.length;
    const netScore = Math.max(0, correct * correctMarks + wrong * wrongMarks);
    const maxScore = totalQ * correctMarks;
    const attemptedCount = correct + wrong;
    const accuracy = attemptedCount > 0 ? Math.round((correct / attemptedCount) * 1000) / 10 : 0;
    const percentile = maxScore > 0 ? Math.min(99.9, Math.round((netScore / maxScore) * 100 * 10) / 10) : 0;
    const predictedRank = Math.max(1, Math.round((100 - percentile) * 45));
    const rankBand: [number, number] = [Math.max(1, predictedRank - 20), predictedRank + 25];
    const startedMs = startedAt ? Date.parse(startedAt) : NaN;
    const timeSpentSec = Number.isNaN(startedMs)
      ? 0
      : Math.max(0, Math.floor((Date.now() - startedMs) / 1000));

    const subjectScores = Object.keys(subjectMap).map((sub) => {
      const s = subjectMap[sub];
      return {
        subject: sub,
        total: s.total,
        score: Math.max(0, s.score),
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      };
    });
    const chapterScores = Object.keys(chapterMap).map((chap) => {
      const c = chapterMap[chap];
      const acc = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
      return {
        subject: c.subject,
        chapter: chap,
        total: c.total,
        correct: c.correct,
        wrong: c.wrong,
        skipped: c.skipped,
        accuracy: acc,
        status: acc < 50 ? 'Weak' : acc > 75 ? 'Strong' : 'Average',
      };
    });
    const recommendations = [...chapterScores]
      .filter((c) => c.status === 'Weak' || c.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3)
      .map((c, idx) => ({
        id: `rec-${Date.now()}-${idx}`,
        title: `Revise ${c.chapter}`,
        subject: c.subject,
        chapter: c.chapter,
        type: 'Revision Pack',
        coinCost: 15,
        estimatedMinutes: c.accuracy < 40 ? 35 : 25,
        questionCount: Math.min(30, Math.max(10, c.total * 2)),
      }));

    const report = {
      id: `rep-${Date.now()}`,
      userId: profile.id,
      attemptId: typeof body.attemptId === 'string' ? body.attemptId : `att-${Date.now()}`,
      mockId,
      mockTitle,
      examType: 'Nepal CEE',
      completedAt: new Date().toLocaleString(),
      overallScore: netScore,
      maxScore,
      accuracyPercentage: accuracy,
      totalAttempted: attemptedCount,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      timeSpentSec,
      predictedRank,
      rankBand,
      percentile,
      subjectScores,
      chapterScores,
      mistakeAnalysis: {
        wrongVsSkippedRatio: `${wrong} Wrong / ${skipped} Skipped`,
        slowCorrectCount: 0,
        speedSecPerQuestion: attemptedCount > 0 ? Math.round(timeSpentSec / attemptedCount) : 0,
      },
      targetScore: profile.targetScore,
      targetGap: Math.max(0, profile.targetScore - netScore),
      recommendations,
      shareToken: `px-token-${Math.floor(Math.random() * 899999 + 100000)}`,
    };

    // Award coins + sync score into Clerk (fresh metadata + per-user lock).
    const updatedUser = await mutateClerkMeta(userId, (draft) => {
      const prevCoins = typeof draft.studyCoinBalance === 'number' ? draft.studyCoinBalance : 0;
      draft.studyCoinBalance = prevCoins + MOCK_COMPLETE_COINS;
      draft.lastMockScore = netScore;
      draft.lastPercentile = percentile;
      return { ok: true, next: draft };
    });

    res.json({
      report: {
        ...report,
        paperQuestions: ordered.map((q) => toClientQuestion(q, true)),
        paperAnswers: answers,
      },
      coinReward: MOCK_COMPLETE_COINS,
      user: updatedUser,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('POST /api/mocks/score failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to score attempt') });
  }
});

/** List all Clerk users (staff only). Near-realtime via client polling. */
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!isStaff(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Staff role required to list all users' });
    }

    const users: ReturnType<typeof mapUser>[] = [];
    let offset = 0;
    const limit = 100;
    for (;;) {
      const page = await clerk.users.getUserList({ limit, offset });
      users.push(...page.data.map(mapUser));
      if (page.data.length < limit) break;
      offset += limit;
    }

    res.json({
      users,
      syncedAt: new Date().toISOString(),
      source: 'clerk',
    });
  } catch (err: any) {
    console.error('GET /api/users failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to list Clerk users') });
  }
});

/** Current signed-in user profile from Clerk. */
app.get('/api/users/me', requireAuth, async (req, res) => {
  const { profile } = (req as any).auth;
  res.json({ user: profile, syncedAt: new Date().toISOString(), source: 'clerk' });
});

/**
 * Update Clerk publicMetadata.
 * - Self: prefs only (students and staff cannot self-grant entitlements)
 * - Billing/Admin: entitlements on *other* users
 * - Role changes: bootstrap admin only
 */
app.patch('/api/users/:clerkId', requireAuth, async (req, res) => {
  try {
    const { profile, userId } = (req as any).auth;
    const targetId = req.params.clerkId === 'me' ? userId : req.params.clerkId;
    const body = (req.body || {}) as AppMeta;
    const actor = {
      role: String(profile.role || 'Student'),
      email: String(profile.email || ''),
      userId,
      isBootstrap: isBootstrapAdminEmail(profile.email),
    };

    const gate = assertPatchBodyAllowed(actor, targetId, Object.keys(body));
    if (gate.ok === false) {
      return res.status(gate.status).json({ error: gate.error });
    }

    const updatedProfile = await mutateClerkMeta(targetId, (draft) => {
      for (const key of Object.keys(body)) {
        const val = (body as any)[key];
        if (key === 'plan') {
          if (val !== 'Free' && val !== 'Premium' && val !== 'Unlimited') {
            return { ok: false, error: 'Invalid plan', status: 400 };
          }
          draft.plan = val;
          continue;
        }
        if (key === 'studyCoinBalance') {
          if (typeof val !== 'number' || !Number.isFinite(val) || val < 0 || val > 1_000_000) {
            return { ok: false, error: 'Invalid studyCoinBalance', status: 400 };
          }
          draft.studyCoinBalance = Math.floor(val);
          continue;
        }
        if (key === 'mocksRemaining') {
          if (
            val !== null &&
            (typeof val !== 'number' || !Number.isFinite(val) || val < 0 || val > 10_000)
          ) {
            return { ok: false, error: 'Invalid mocksRemaining', status: 400 };
          }
          draft.mocksRemaining = val === null ? null : Math.floor(val);
          continue;
        }
        draft[key] = val;
      }
      return { ok: true, next: draft };
    });

    // Bootstrap target always retains Admin (defense in depth).
    const existing = await clerk.users.getUser(targetId);
    const targetEmail =
      existing.emailAddresses.find((e) => e.id === existing.primaryEmailAddressId)?.emailAddress ||
      existing.emailAddresses[0]?.emailAddress ||
      '';
    if (isBootstrapAdminEmail(targetEmail) && updatedProfile.role !== 'Admin') {
      const forced = await mutateClerkMeta(targetId, (draft) => {
        draft.role = 'Admin';
        if (!draft.plan) draft.plan = 'Unlimited';
        return { ok: true, next: draft };
      });
      return res.json({
        user: forced,
        syncedAt: new Date().toISOString(),
        source: 'clerk',
      });
    }

    res.json({
      user: updatedProfile,
      syncedAt: new Date().toISOString(),
      source: 'clerk',
    });
  } catch (err: any) {
    console.error('PATCH /api/users failed:', err);
    const status = err?.status && err.status < 500 ? err.status : 500;
    res.status(status).json({
      error: status < 500 ? err.message : publicErrorMessage(err, 'Failed to update Clerk user'),
    });
  }
});

/** Daily study-plan completion reward (server-owned coins). */
app.post('/api/coins/planner-complete', requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).auth;
    const dateKey = typeof req.body?.dateKey === 'string' ? req.body.dateKey.trim() : '';
    if (!isAllowedPlannerDateKey(dateKey)) {
      return res.status(400).json({
        error: 'Planner reward may only be claimed for today (Nepal calendar date)',
      });
    }
    const reward = 10;
    try {
      const updated = await mutateClerkMeta(userId, (draft) => {
        const rewarded = Array.isArray(draft.plannerRewardedDates)
          ? (draft.plannerRewardedDates as string[])
          : [];
        if (rewarded.includes(dateKey)) {
          return { ok: false, error: 'Daily planner reward already claimed', status: 409 };
        }
        const prevCoins = typeof draft.studyCoinBalance === 'number' ? draft.studyCoinBalance : 0;
        draft.studyCoinBalance = prevCoins + reward;
        draft.plannerRewardedDates = [...rewarded, dateKey].slice(-60);
        return { ok: true, next: draft };
      });
      res.json({ coinReward: reward, user: updated, syncedAt: new Date().toISOString() });
    } catch (claimErr: any) {
      if (claimErr?.status === 409) {
        const existing = await clerk.users.getUser(userId);
        return res.status(409).json({
          error: claimErr.message,
          user: mapUser(existing),
        });
      }
      throw claimErr;
    }
  } catch (err: any) {
    console.error('POST /api/coins/planner-complete failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to award planner coins') });
  }
});

/** Redeem catalog item (server-owned deduction + optional mock quota). */
app.post('/api/coins/redeem', requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).auth;
    const catalog = [
      { id: 'red-01', title: 'Chemical Kinetics High-Yield Practice Pack (30 Qs)', coinCost: 50, mockQuota: 0 },
      { id: 'red-02', title: '1 Extra CEE Full Mock Quota', coinCost: 100, mockQuota: 1 },
      { id: 'red-03', title: 'PYP 2081 Master Exam Solution Pack', coinCost: 75, mockQuota: 0 },
    ];
    const itemId = typeof req.body?.itemId === 'string' ? req.body.itemId : '';
    const item = catalog.find((c) => c.id === itemId);
    if (!item) return res.status(400).json({ error: 'Unknown redeem item' });

    try {
      const updated = await mutateClerkMeta(userId, (draft) => {
        const unlocked = Array.isArray(draft.unlockedRedeems)
          ? (draft.unlockedRedeems as string[])
          : [];
        if (unlocked.includes(item.title) || unlocked.includes(item.id)) {
          return { ok: false, error: 'Item already redeemed', status: 409 };
        }
        const balance = typeof draft.studyCoinBalance === 'number' ? draft.studyCoinBalance : 0;
        if (balance < item.coinCost) {
          return { ok: false, error: 'Insufficient coins', status: 402 };
        }
        draft.studyCoinBalance = balance - item.coinCost;
        if (item.mockQuota > 0) {
          const { mocksRemaining } = resolvePlanQuota(draft);
          if (mocksRemaining !== null) {
            draft.mocksRemaining = mocksRemaining + item.mockQuota;
          }
        }
        draft.unlockedRedeems = [...unlocked, item.id, item.title];
        return { ok: true, next: draft };
      });
      res.json({
        redeemed: item.title,
        coinCost: item.coinCost,
        user: updated,
        syncedAt: new Date().toISOString(),
      });
    } catch (redeemErr: any) {
      if (redeemErr?.status === 409 || redeemErr?.status === 402) {
        const existing = await clerk.users.getUser(userId);
        return res.status(redeemErr.status).json({
          error: redeemErr.message,
          user: mapUser(existing),
        });
      }
      throw redeemErr;
    }
  } catch (err: any) {
    console.error('POST /api/coins/redeem failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to redeem') });
  }
});

/** Create-or-return staff personal referral link. */
app.post('/api/referrals/me/ensure', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    if (!isReferralStaffRole(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Staff only' });
    }
    const link = await referralsRepo.ensureLink({
      ownerClerkId: userId,
      code: generateReferralCode(userId),
      ownerEmail: profile.email,
      ownerName: profile.name,
      ownerRole: profile.role,
    });
    res.json({ link });
  } catch (err: any) {
    console.error('POST /api/referrals/me/ensure failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to ensure referral link') });
  }
});

/** Staff: own link + commissions + totals. */
app.get('/api/referrals/me', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    if (!isReferralStaffRole(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Staff only' });
    }
    let link = await referralsRepo.getLinkByOwner(userId);
    if (!link) {
      link = await referralsRepo.ensureLink({
        ownerClerkId: userId,
        code: generateReferralCode(userId),
        ownerEmail: profile.email,
        ownerName: profile.name,
        ownerRole: profile.role,
      });
    }
    const commissions = await referralsRepo.listCommissionsByReferrer(userId);
    const totals = sumCommissionTotals(commissions);
    res.json({ link, commissions, totals });
  } catch (err: any) {
    console.error('GET /api/referrals/me failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to load referrals') });
  }
});

/** Any signed-in user: first-touch attribution from referral code. */
app.post('/api/referrals/attribute', requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).auth;
    const code = normalizeReferralCode(req.body?.code);
    if (!code) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }
    const link = await referralsRepo.getLinkByCode(code);
    if (!link || !link.active) {
      return res.status(404).json({ error: 'Referral link not found' });
    }
    if (link.ownerClerkId === userId) {
      return res.status(400).json({ error: 'Cannot attribute your own referral link' });
    }
    const result = await referralsRepo.attributeFirstTouch({
      referredClerkId: userId,
      referrerClerkId: link.ownerClerkId,
      code: link.code,
    });

    // Best-effort Clerk read-model; DB remains source of truth.
    if (result.created) {
      try {
        await updatePublicMetadataAtomic({
          userId,
          getUser: (id) => clerk.users.getUser(id),
          updateUser: (id, data) => clerk.users.updateUser(id, data),
          mutator: (draft) => ({
            ok: true,
            next: {
              ...draft,
              referredByClerkId: link.ownerClerkId,
              referralCode: link.code,
            },
          }),
        });
      } catch (metaErr: any) {
        console.warn('referral attribute Clerk meta sync failed:', metaErr?.message || metaErr);
      }
    }

    res.json({
      attribution: result.attribution,
      created: result.created,
    });
  } catch (err: any) {
    console.error('POST /api/referrals/attribute failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to attribute referral') });
  }
});

/**
 * Admin / Billing Mod: record 30% commission when a payment claim is approved.
 * Idempotent on claimId.
 */
app.post('/api/referrals/commissions', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (
      !canRecordReferralCommission(profile.role, isBootstrapAdminEmail(profile.email)) &&
      !canManageBilling(profile.role, profile.email)
    ) {
      return res.status(403).json({ error: 'Billing staff only' });
    }

    const claimId = typeof req.body?.claimId === 'string' ? req.body.claimId.trim() : '';
    const referredClerkId =
      typeof req.body?.referredClerkId === 'string' ? req.body.referredClerkId.trim() : '';
    const amountRaw = req.body?.amountNpr;
    const amountNpr = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);

    if (!claimId || !referredClerkId) {
      return res.status(400).json({ error: 'claimId and referredClerkId are required' });
    }
    if (!Number.isFinite(amountNpr) || amountNpr <= 0) {
      return res.status(400).json({ error: 'amountNpr must be a positive number' });
    }

    const attribution = await referralsRepo.getAttribution(referredClerkId);
    if (!attribution) {
      return res.status(200).json({
        recorded: false,
        reason: 'no_attribution',
        message: 'Payer has no referral attribution; no commission created',
      });
    }

    const commissionAmountNpr = computeCommissionAmountNpr(amountNpr, REFERRAL_COMMISSION_RATE);
    const insert = await referralsRepo.insertCommission({
      id: `refc-${claimId}`.slice(0, 64),
      claimId,
      referredClerkId,
      referrerClerkId: attribution.referrerClerkId,
      conversionAmountNpr: Math.round(amountNpr),
      commissionRate: REFERRAL_COMMISSION_RATE,
      commissionAmountNpr,
    });

    if (insert.ok === false) {
      return res.status(200).json({
        recorded: false,
        reason: 'duplicate_claim',
        commission: insert.existing,
      });
    }

    res.status(201).json({
      recorded: true,
      commission: insert.commission,
    });
  } catch (err: any) {
    console.error('POST /api/referrals/commissions failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to record commission') });
  }
});

/** Admin only: all links + commissions + aggregates. */
app.get('/api/referrals/admin/overview', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canSettleReferralCommission(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const links = await referralsRepo.listLinks();
    const commissions = await referralsRepo.listAllCommissions();
    const totals = sumCommissionTotals(commissions);
    const byReferrer = links.map((link) => {
      const rows = commissions.filter((c) => c.referrerClerkId === link.ownerClerkId);
      return {
        link,
        commissions: rows,
        totals: sumCommissionTotals(rows),
      };
    });
    res.json({ links, commissions, totals, byReferrer });
  } catch (err: any) {
    console.error('GET /api/referrals/admin/overview failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to load referral overview') });
  }
});

/** Admin only: mark commission settled. */
app.patch('/api/referrals/commissions/:id/settle', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    if (!canSettleReferralCommission(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing commission id' });
    const commission = await referralsRepo.settleCommission(id, userId);
    if (!commission) return res.status(404).json({ error: 'Commission not found' });
    res.json({ commission });
  } catch (err: any) {
    console.error('PATCH /api/referrals/commissions/:id/settle failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to settle commission') });
  }
});

function toClientPaymentClaim(c: Awaited<ReturnType<PaymentClaimsRepository['getById']>>) {
  if (!c) return null;
  return {
    id: c.id,
    userId: c.userId,
    clerkUserId: c.clerkUserId,
    userName: c.userName,
    userEmail: c.userEmail,
    planCode: c.planCode,
    amountNpr: c.amountNpr,
    listAmountNpr: c.listAmountNpr,
    promoCode: c.promoCode || undefined,
    promoDiscountNpr: c.promoDiscountNpr || undefined,
    paymentMethod: c.paymentMethod,
    transactionRef: c.transactionRef,
    screenshotUrl: c.screenshotUrl,
    status: c.status,
    userNotes: c.userNotes != null && String(c.userNotes).trim() ? String(c.userNotes).trim() : undefined,
    moderatorNotes:
      c.moderatorNotes != null && String(c.moderatorNotes).trim()
        ? String(c.moderatorNotes).trim()
        : undefined,
    submittedAt: c.submittedAt,
    verifiedAt: c.verifiedAt || undefined,
    verifiedBy: c.verifiedBy || undefined,
  };
}

/** Student: submit payment claim. Staff queue is server-backed (dynamic). */
app.post('/api/payment-claims', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    const planCode = typeof req.body?.planCode === 'string' ? req.body.planCode.trim() : '';
    const transactionRef =
      typeof req.body?.transactionRef === 'string' ? req.body.transactionRef.trim() : '';
    const screenshotUrl =
      typeof req.body?.screenshotUrl === 'string' ? req.body.screenshotUrl.trim() : '';
    const userNotesRaw =
      typeof req.body?.userNotes === 'string'
        ? req.body.userNotes
        : typeof req.body?.remarks === 'string'
          ? req.body.remarks
          : typeof req.body?.userRemarks === 'string'
            ? req.body.userRemarks
            : '';
    const userNotes = userNotesRaw.trim();
    const amountRaw = req.body?.amountNpr;
    const listAmountNpr = Math.round(
      typeof amountRaw === 'number' ? amountRaw : Number(amountRaw)
    );
    const paymentMethod = req.body?.paymentMethod;
    const promoRaw =
      typeof req.body?.promoCode === 'string'
        ? req.body.promoCode
        : typeof req.body?.couponCode === 'string'
          ? req.body.couponCode
          : '';

    if (!planCode) return res.status(400).json({ error: 'planCode is required' });
    if (!transactionRef) return res.status(400).json({ error: 'transactionRef is required' });
    if (!isPaymentMethod(paymentMethod)) {
      return res.status(400).json({ error: 'paymentMethod must be Fonepay, eSewa, Khalti, or Bank Transfer' });
    }
    if (!Number.isFinite(listAmountNpr) || listAmountNpr <= 0) {
      return res.status(400).json({ error: 'amountNpr must be a positive number' });
    }
    if (!screenshotUrl.startsWith('data:image/') && !/^https?:\/\//i.test(screenshotUrl)) {
      return res.status(400).json({
        error: 'Payment screenshot is required (attach an image of your payment receipt)',
      });
    }

    let payableNpr = listAmountNpr;
    let promoCode: string | null = null;
    let promoDiscountNpr = 0;

    const normalizedPromo = normalizePromoCode(promoRaw);
    if (promoRaw.trim() && !normalizedPromo) {
      return res.status(400).json({ error: 'Invalid promo code format' });
    }
    if (normalizedPromo) {
      const promo = await promoCodesRepo.getByCode(normalizedPromo);
      const applied = evaluatePromoForCheckout(promo, {
        planCode,
        listAmountNpr,
      });
      if (applied.ok === false) {
        return res.status(400).json({ error: applied.reason });
      }
      promoCode = applied.code;
      promoDiscountNpr = applied.discountNpr;
      payableNpr = applied.payableNpr;
    }

    const claim = await paymentClaimsRepo.insert({
      id: `pay-claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: profile.id || `usr-clerk-${userId}`,
      clerkUserId: userId,
      userName: profile.name,
      userEmail: profile.email,
      planCode,
      amountNpr: payableNpr,
      listAmountNpr,
      promoCode,
      promoDiscountNpr,
      paymentMethod,
      transactionRef,
      screenshotUrl,
      userNotes: userNotes || null,
    });

    res.status(201).json({ claim: toClientPaymentClaim(claim) });
  } catch (err: any) {
    console.error('POST /api/payment-claims failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to submit payment claim') });
  }
});

/**
 * List claims.
 * - Billing staff / Admin: all claims (FIFO pending first)
 * - Students: own claims only
 */
app.get('/api/payment-claims', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    const staff = canModeratePaymentClaims(profile.role, isBootstrapAdminEmail(profile.email));
    const rows = staff
      ? sortClaimsForQueue(await paymentClaimsRepo.listAll())
      : await paymentClaimsRepo.listByClerkUserId(userId);
    res.json({
      claims: rows.map((c) => toClientPaymentClaim(c)),
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('GET /api/payment-claims failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to load payment claims') });
  }
});

/** Billing staff: approve claim → activate plan + record referral commission. */
app.post('/api/payment-claims/:id/approve', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    if (!canModeratePaymentClaims(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Billing staff only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing claim id' });

    const existing = await paymentClaimsRepo.getById(id);
    if (!existing) return res.status(404).json({ error: 'Claim not found' });
    if (existing.status !== 'pending') {
      return res.status(409).json({ error: `Claim already ${existing.status}`, claim: toClientPaymentClaim(existing) });
    }

    const claim = await paymentClaimsRepo.resolve(id, {
      status: 'approved',
      verifiedBy: profile.name,
      verifiedByClerkId: userId,
      moderatorNotes: typeof req.body?.moderatorNotes === 'string' ? req.body.moderatorNotes : null,
    });
    if (!claim) {
      return res.status(409).json({ error: 'Claim was already resolved by another moderator' });
    }

    if (claim.promoCode) {
      try {
        const bumped = await promoCodesRepo.tryIncrementRedemption(claim.promoCode);
        if (!bumped) {
          console.warn(
            `Approve claim ${claim.id}: promo ${claim.promoCode} redemption not incremented (exhausted or inactive)`
          );
        }
      } catch (promoErr: any) {
        console.error('Approve claim: promo redemption failed:', promoErr?.message || promoErr);
      }
    }

    const entitlements = defaultEntitlementsForPlan(claim.planCode);
    let activatedUser = null as ReturnType<typeof mapUser> | null;
    try {
      const updated = await updatePublicMetadataAtomic({
        userId: claim.clerkUserId,
        getUser: (id) => clerk.users.getUser(id),
        updateUser: (id, data) => clerk.users.updateUser(id, data),
        mutator: (draft) => {
          const prevMocks =
            typeof draft.mocksRemaining === 'number' || draft.mocksRemaining === null
              ? (draft.mocksRemaining as number | null)
              : 0;
          const prevCoins =
            typeof draft.studyCoinBalance === 'number' ? (draft.studyCoinBalance as number) : 0;
          const nextMocks =
            entitlements.mocksGranted === null
              ? null
              : (prevMocks ?? 0) + entitlements.mocksGranted;
          return {
            ok: true,
            next: {
              ...draft,
              plan: entitlements.tier,
              mocksRemaining: nextMocks,
              studyCoinBalance: prevCoins + entitlements.coinsGranted,
            },
          };
        },
      });
      if ('user' in updated) {
        activatedUser = mapUser(updated.user as any);
      }
    } catch (activateErr: any) {
      console.error('Approve claim: Clerk activation failed:', activateErr?.message || activateErr);
    }

    let commission = null as any;
    let commissionRecorded = false;
    try {
      const attribution = await referralsRepo.getAttribution(claim.clerkUserId);
      if (attribution) {
        const commissionAmountNpr = computeCommissionAmountNpr(
          claim.amountNpr,
          REFERRAL_COMMISSION_RATE
        );
        const insert = await referralsRepo.insertCommission({
          id: `refc-${claim.id}`.slice(0, 64),
          claimId: claim.id,
          referredClerkId: claim.clerkUserId,
          referrerClerkId: attribution.referrerClerkId,
          conversionAmountNpr: claim.amountNpr,
          commissionRate: REFERRAL_COMMISSION_RATE,
          commissionAmountNpr,
        });
        if (insert.ok === true) {
          commission = insert.commission;
          commissionRecorded = true;
        } else {
          commission = insert.existing;
        }
      }
    } catch (commErr: any) {
      console.error('Approve claim: referral commission failed:', commErr?.message || commErr);
    }

    res.json({
      claim: toClientPaymentClaim(claim),
      activatedUser,
      entitlements,
      referralCommission: { recorded: commissionRecorded, commission },
    });
  } catch (err: any) {
    console.error('POST /api/payment-claims/:id/approve failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to approve claim') });
  }
});

/** Billing staff: reject claim. */
app.post('/api/payment-claims/:id/reject', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    if (!canModeratePaymentClaims(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Billing staff only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing claim id' });
    const reason =
      typeof req.body?.reason === 'string'
        ? req.body.reason.trim()
        : typeof req.body?.moderatorNotes === 'string'
          ? req.body.moderatorNotes.trim()
          : '';

    const claim = await paymentClaimsRepo.resolve(id, {
      status: 'rejected',
      verifiedBy: profile.name,
      verifiedByClerkId: userId,
      moderatorNotes: reason || 'Rejected',
    });
    if (!claim) {
      const existing = await paymentClaimsRepo.getById(id);
      if (!existing) return res.status(404).json({ error: 'Claim not found' });
      return res.status(409).json({ error: `Claim already ${existing.status}`, claim: toClientPaymentClaim(existing) });
    }
    res.json({ claim: toClientPaymentClaim(claim) });
  } catch (err: any) {
    console.error('POST /api/payment-claims/:id/reject failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to reject claim') });
  }
});

/** Billing staff: edit pending claim fields; user remarks editable on any status. */
app.patch('/api/payment-claims/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canModeratePaymentClaims(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Billing staff only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing claim id' });

    const existing = await paymentClaimsRepo.getById(id);
    if (!existing) return res.status(404).json({ error: 'Claim not found' });

    const body = req.body || {};
    const hasUserNotes = body.userNotes !== undefined;
    const userNotesValue =
      typeof body.userNotes === 'string' && body.userNotes.trim()
        ? body.userNotes.trim()
        : null;

    // Resolved claims: only User Remarks may change (not plan/amount/ref).
    if (existing.status !== 'pending') {
      const otherKeys = [
        'planCode',
        'amountNpr',
        'listAmountNpr',
        'promoCode',
        'promoDiscountNpr',
        'paymentMethod',
        'transactionRef',
        'screenshotUrl',
      ].filter((k) => body[k] !== undefined);
      if (otherKeys.length > 0) {
        return res.status(409).json({
          error: `Only user remarks can be edited on ${existing.status} claims`,
          claim: toClientPaymentClaim(existing),
        });
      }
      if (!hasUserNotes) {
        return res.status(400).json({ error: 'userNotes is required when editing a resolved claim' });
      }
      const claim = await paymentClaimsRepo.updateUserNotes(id, userNotesValue);
      if (!claim) return res.status(404).json({ error: 'Claim not found' });
      return res.json({ claim: toClientPaymentClaim(claim) });
    }

    const patch: Parameters<PaymentClaimsRepository['updatePending']>[1] = {};

    if (typeof body.planCode === 'string' && body.planCode.trim()) {
      patch.planCode = body.planCode.trim();
    }
    if (body.amountNpr !== undefined) {
      const amount = typeof body.amountNpr === 'number' ? body.amountNpr : Number(body.amountNpr);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'amountNpr must be a positive number' });
      }
      patch.amountNpr = Math.round(amount);
    }
    if (body.listAmountNpr !== undefined) {
      if (body.listAmountNpr === null || body.listAmountNpr === '') {
        patch.listAmountNpr = null;
      } else {
        const list =
          typeof body.listAmountNpr === 'number' ? body.listAmountNpr : Number(body.listAmountNpr);
        if (!Number.isFinite(list) || list <= 0) {
          return res.status(400).json({ error: 'listAmountNpr must be a positive number' });
        }
        patch.listAmountNpr = Math.round(list);
      }
    }
    if (body.promoCode !== undefined) {
      patch.promoCode =
        typeof body.promoCode === 'string' && body.promoCode.trim()
          ? body.promoCode.trim().toUpperCase()
          : null;
    }
    if (body.promoDiscountNpr !== undefined) {
      const d =
        typeof body.promoDiscountNpr === 'number'
          ? body.promoDiscountNpr
          : Number(body.promoDiscountNpr);
      if (!Number.isFinite(d) || d < 0) {
        return res.status(400).json({ error: 'promoDiscountNpr must be >= 0' });
      }
      patch.promoDiscountNpr = Math.round(d);
    }
    if (body.paymentMethod !== undefined) {
      if (!isPaymentMethod(body.paymentMethod)) {
        return res.status(400).json({
          error: 'paymentMethod must be Fonepay, eSewa, Khalti, or Bank Transfer',
        });
      }
      patch.paymentMethod = body.paymentMethod;
    }
    if (typeof body.transactionRef === 'string' && body.transactionRef.trim()) {
      patch.transactionRef = body.transactionRef.trim();
    }
    if (typeof body.screenshotUrl === 'string' && body.screenshotUrl.trim()) {
      const url = body.screenshotUrl.trim();
      if (!url.startsWith('data:image/') && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: 'screenshotUrl must be an image data URL or http(s) URL' });
      }
      patch.screenshotUrl = url;
    }
    if (hasUserNotes) {
      patch.userNotes = userNotesValue;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }

    const claim = await paymentClaimsRepo.updatePending(id, patch);
    if (!claim) {
      return res.status(409).json({ error: 'Claim is no longer pending' });
    }
    res.json({ claim: toClientPaymentClaim(claim) });
  } catch (err: any) {
    console.error('PATCH /api/payment-claims/:id failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to update claim') });
  }
});

/** Billing staff: delete a pending claim from the FIFO queue. */
app.delete('/api/payment-claims/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canModeratePaymentClaims(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Billing staff only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing claim id' });

    const existing = await paymentClaimsRepo.getById(id);
    if (!existing) return res.status(404).json({ error: 'Claim not found' });
    if (existing.status !== 'pending') {
      return res.status(409).json({
        error: `Only pending claims can be deleted (currently ${existing.status})`,
        claim: toClientPaymentClaim(existing),
      });
    }

    const ok = await paymentClaimsRepo.deletePending(id);
    if (!ok) return res.status(409).json({ error: 'Claim is no longer pending' });
    res.json({ ok: true, id });
  } catch (err: any) {
    console.error('DELETE /api/payment-claims/:id failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to delete claim') });
  }
});

function toClientPromoCode(p: NonNullable<Awaited<ReturnType<PromoCodesRepository['getById']>>>) {
  return {
    id: p.id,
    code: p.code,
    description: p.description || undefined,
    discountType: p.discountType,
    discountValue: p.discountValue,
    applicablePlanCodes: p.applicablePlanCodes,
    maxRedemptions: p.maxRedemptions,
    redemptionCount: p.redemptionCount,
    startsAt: p.startsAt || undefined,
    expiresAt: p.expiresAt || undefined,
    active: p.active,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    createdByName: p.createdByName || undefined,
  };
}

/** Any signed-in user: preview / validate a promo for checkout. */
app.post('/api/promo-codes/validate', requireAuth, async (req, res) => {
  try {
    const code = normalizePromoCode(typeof req.body?.code === 'string' ? req.body.code : '');
    const planCode = typeof req.body?.planCode === 'string' ? req.body.planCode.trim() : '';
    const listRaw = req.body?.amountNpr ?? req.body?.listAmountNpr;
    const listAmountNpr = Math.round(typeof listRaw === 'number' ? listRaw : Number(listRaw));

    if (!code) return res.status(400).json({ error: 'Enter a valid promo code' });
    if (!planCode) return res.status(400).json({ error: 'planCode is required' });
    if (!Number.isFinite(listAmountNpr) || listAmountNpr <= 0) {
      return res.status(400).json({ error: 'amountNpr must be a positive number' });
    }

    const promo = await promoCodesRepo.getByCode(code);
    const applied = evaluatePromoForCheckout(promo, { planCode, listAmountNpr });
    if (applied.ok === false) {
      return res.status(400).json({ error: applied.reason, valid: false });
    }
    res.json({ valid: true, ...applied });
  } catch (err: any) {
    console.error('POST /api/promo-codes/validate failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to validate promo') });
  }
});

/** Admin only: list promo codes. */
app.get('/api/promo-codes', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManagePromoCodes(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const rows = await promoCodesRepo.listAll();
    res.json({ promoCodes: rows.map(toClientPromoCode) });
  } catch (err: any) {
    console.error('GET /api/promo-codes failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to load promo codes') });
  }
});

/** Admin only: create promo code. */
app.post('/api/promo-codes', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    if (!canManagePromoCodes(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const parsed = validatePromoCodeCreateInput(req.body || {});
    if (parsed.ok === false) return res.status(400).json({ error: parsed.reason });

    const existing = await promoCodesRepo.getByCode(parsed.value.code);
    if (existing) {
      return res.status(409).json({ error: `Promo code ${parsed.value.code} already exists` });
    }

    const created = await promoCodesRepo.insert({
      id: `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...parsed.value,
      createdByClerkId: userId,
      createdByName: profile.name || profile.email || 'Admin',
    });
    res.status(201).json({ promoCode: toClientPromoCode(created) });
  } catch (err: any) {
    console.error('POST /api/promo-codes failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to create promo code') });
  }
});

/** Admin only: update promo code. */
app.patch('/api/promo-codes/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManagePromoCodes(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing promo id' });

    const existing = await promoCodesRepo.getById(id);
    if (!existing) return res.status(404).json({ error: 'Promo code not found' });

    const body = req.body || {};
    const patch: Parameters<PromoCodesRepository['update']>[1] = {};

    if (body.description !== undefined) {
      patch.description =
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim().slice(0, 500)
          : null;
    }
    if (body.discountType !== undefined || body.discountValue !== undefined) {
      const discountType = body.discountType ?? existing.discountType;
      const discountValue =
        body.discountValue !== undefined
          ? typeof body.discountValue === 'number'
            ? body.discountValue
            : Number(body.discountValue)
          : existing.discountValue;
      const check = validatePromoCodeCreateInput({
        code: existing.code,
        discountType,
        discountValue,
        applicablePlanCodes:
          body.applicablePlanCodes !== undefined
            ? body.applicablePlanCodes
            : existing.applicablePlanCodes,
        maxRedemptions:
          body.maxRedemptions !== undefined ? body.maxRedemptions : existing.maxRedemptions,
        startsAt: body.startsAt !== undefined ? body.startsAt : existing.startsAt,
        expiresAt: body.expiresAt !== undefined ? body.expiresAt : existing.expiresAt,
        active: body.active !== undefined ? body.active : existing.active,
        description: body.description !== undefined ? body.description : existing.description,
      });
      if (check.ok === false) return res.status(400).json({ error: check.reason });
      patch.discountType = check.value.discountType;
      patch.discountValue = check.value.discountValue;
      patch.applicablePlanCodes = check.value.applicablePlanCodes;
      patch.maxRedemptions = check.value.maxRedemptions ?? null;
      patch.startsAt = check.value.startsAt ?? null;
      patch.expiresAt = check.value.expiresAt ?? null;
      patch.active = check.value.active !== false;
      if (body.description !== undefined) patch.description = check.value.description ?? null;
    } else {
      if (body.applicablePlanCodes !== undefined) {
        const check = validatePromoCodeCreateInput({
          code: existing.code,
          discountType: existing.discountType,
          discountValue: existing.discountValue,
          applicablePlanCodes: body.applicablePlanCodes,
        });
        if (check.ok === false) return res.status(400).json({ error: check.reason });
        patch.applicablePlanCodes = check.value.applicablePlanCodes;
      }
      if (body.maxRedemptions !== undefined) {
        if (body.maxRedemptions === null || body.maxRedemptions === '') {
          patch.maxRedemptions = null;
        } else {
          const n =
            typeof body.maxRedemptions === 'number'
              ? body.maxRedemptions
              : Number(body.maxRedemptions);
          if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
            return res.status(400).json({ error: 'maxRedemptions must be a positive integer or empty' });
          }
          patch.maxRedemptions = n;
        }
      }
      if (body.startsAt !== undefined) {
        patch.startsAt =
          typeof body.startsAt === 'string' && body.startsAt.trim() ? body.startsAt.trim() : null;
      }
      if (body.expiresAt !== undefined) {
        patch.expiresAt =
          typeof body.expiresAt === 'string' && body.expiresAt.trim() ? body.expiresAt.trim() : null;
      }
      if (body.active !== undefined) {
        patch.active = Boolean(body.active);
      }
    }

    const updated = await promoCodesRepo.update(id, patch);
    if (!updated) return res.status(404).json({ error: 'Promo code not found' });
    res.json({ promoCode: toClientPromoCode(updated) });
  } catch (err: any) {
    console.error('PATCH /api/promo-codes/:id failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to update promo code') });
  }
});

/** Admin only: delete promo code. */
app.delete('/api/promo-codes/:id', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManagePromoCodes(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing promo id' });
    const ok = await promoCodesRepo.deleteById(id);
    if (!ok) return res.status(404).json({ error: 'Promo code not found' });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/promo-codes/:id failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to delete promo code') });
  }
});

function toClientSupportIssue(i: NonNullable<Awaited<ReturnType<SupportIssuesRepository['getById']>>>) {
  return {
    id: i.id,
    clerkUserId: i.clerkUserId,
    userName: i.userName,
    userEmail: i.userEmail,
    category: i.category,
    body: i.body,
    status: i.status,
    staffNotes: i.staffNotes || undefined,
    createdAt: i.createdAt,
    resolvedAt: i.resolvedAt || undefined,
    resolvedBy: i.resolvedBy || undefined,
  };
}

/** Signed-in user: submit a support / content issue. */
app.post('/api/support-issues', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    const category = req.body?.category;
    const body = normalizeIssueBody(typeof req.body?.body === 'string' ? req.body.body : '');

    if (!isSupportIssueCategory(category)) {
      return res.status(400).json({
        error: 'category must be technical, content, payment, or coins',
      });
    }
    if (body.length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const issue = await supportIssuesRepo.insert({
      id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clerkUserId: userId,
      userName: profile.name || 'Aspirant',
      userEmail: profile.email || '',
      category,
      body,
    });

    res.status(201).json({ issue: toClientSupportIssue(issue) });
  } catch (err: any) {
    console.error('POST /api/support-issues failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to submit issue') });
  }
});

/**
 * List issues.
 * - Staff: all (open FIFO first)
 * - Students: own issues only
 */
app.get('/api/support-issues', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    const staff = canTriageSupportIssues(profile.role, isBootstrapAdminEmail(profile.email));
    const rows = staff
      ? sortIssuesForQueue(await supportIssuesRepo.listAll())
      : await supportIssuesRepo.listByClerkUserId(userId);
    res.json({
      issues: rows.map((i) => toClientSupportIssue(i)),
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('GET /api/support-issues failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to load issues') });
  }
});

/** Staff: mark issue resolved. */
app.post('/api/support-issues/:id/resolve', requireAuth, async (req, res) => {
  try {
    const { userId, profile } = (req as any).auth;
    if (!canTriageSupportIssues(profile.role, isBootstrapAdminEmail(profile.email))) {
      return res.status(403).json({ error: 'Staff only' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing issue id' });

    const existing = await supportIssuesRepo.getById(id);
    if (!existing) return res.status(404).json({ error: 'Issue not found' });
    if (existing.status !== 'open') {
      return res
        .status(409)
        .json({ error: `Issue already ${existing.status}`, issue: toClientSupportIssue(existing) });
    }

    const issue = await supportIssuesRepo.resolve(id, {
      staffNotes: typeof req.body?.staffNotes === 'string' ? req.body.staffNotes.trim() : null,
      resolvedBy: profile.name,
      resolvedByClerkId: userId,
    });
    if (!issue) {
      return res.status(409).json({ error: 'Issue was already resolved by another moderator' });
    }

    res.json({ issue: toClientSupportIssue(issue) });
  } catch (err: any) {
    console.error('POST /api/support-issues/:id/resolve failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to resolve issue') });
  }
});

/** List formula sheets (any signed-in user). */
app.get('/api/formulas', requireAuth, async (_req, res) => {
  try {
    const sheets = await formulasRepo.list();
    res.json({
      sheets: sheets.map(toClientFormulaSheet),
      total: sheets.length,
      syncedAt: new Date().toISOString(),
      source: formulasRepo.driver,
    });
  } catch (err: any) {
    console.error('GET /api/formulas failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to load formulas') });
  }
});

/** Staff: list formula import batches. */
app.get('/api/formulas/batches', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const batches = await formulasRepo.listBatches();
    res.json({
      batches: batches.map(toClientFormulaBatch),
      syncedAt: new Date().toISOString(),
      source: formulasRepo.driver,
    });
  } catch (err: any) {
    console.error('GET /api/formulas/batches failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to load formula batches') });
  }
});

/** Staff: bulk import formula sheets as one batch (partial success). */
app.post('/api/formulas/import', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }

    const payload = Array.isArray(req.body) ? req.body : req.body?.sheets;
    const filename =
      typeof req.body?.filename === 'string' && req.body.filename.trim()
        ? req.body.filename.trim()
        : null;
    const label =
      typeof req.body?.label === 'string' && req.body.label.trim()
        ? req.body.label.trim()
        : filename || `Formula import ${new Date().toLocaleString()}`;

    const batchId = `fbatch-${Date.now()}`;
    const parsed = parseFormulaImportBatch(payload, { batchId });
    let successCount = 0;
    if (parsed.sheets.length > 0) {
      await formulasRepo.createBatch({
        id: batchId,
        label,
        filename,
        importedByEmail: profile.email,
        importedByName: profile.name,
        sheetCount: parsed.sheets.length,
        errorCount: parsed.errors.length,
      });
      successCount = await formulasRepo.insertMany(parsed.sheets);
    }

    const batches = await formulasRepo.listBatches();
    const sheets = await formulasRepo.list();
    res.json({
      successCount,
      errors: parsed.errors,
      batchId: successCount > 0 ? batchId : null,
      batches: batches.map(toClientFormulaBatch),
      sheets: sheets.map(toClientFormulaSheet),
      total: sheets.length,
      syncedAt: new Date().toISOString(),
      source: formulasRepo.driver,
    });
  } catch (err: any) {
    console.error('POST /api/formulas/import failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to import formulas') });
  }
});

/** Staff: delete a formula import batch and its sheets. */
app.delete('/api/formulas/batches/:batchId', requireAuth, async (req, res) => {
  try {
    const { profile } = (req as any).auth;
    if (!canManageQuestions(profile.role, profile.email)) {
      return res.status(403).json({ error: 'Questions moderator or Admin required' });
    }
    const existing = await formulasRepo.getBatch(req.params.batchId);
    if (!existing) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    const result = await formulasRepo.deleteBatch(req.params.batchId);
    res.json({
      deleted: true,
      batchId: req.params.batchId,
      deletedSheets: result.deletedSheets,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('DELETE /api/formulas/batches/:batchId failed:', err);
    res.status(500).json({ error: publicErrorMessage(err, 'Failed to delete formula batch') });
  }
});

async function boot() {
  try {
    // Clerk-side: block disposable inboxes at sign-up (Dashboard Rules equivalent).
    try {
      await clerk.instance.updateRestrictions({
        blockDisposableEmailDomains: true,
        blockEmailSubaddresses: true,
      });
      console.log('Clerk restrictions: disposable emails + email subaddresses blocked');
    } catch (err: any) {
      console.warn(
        'Could not update Clerk email restrictions (enable in Dashboard → Protect → Rules):',
        err?.message || err
      );
    }

    const repos = await createAppRepositories();
    questionsRepo = repos.questions;
    mocksRepo = repos.mocks;
    referralsRepo = repos.referrals;
    paymentClaimsRepo = repos.paymentClaims;
    supportIssuesRepo = repos.supportIssues;
    formulasRepo = repos.formulas;
    promoCodesRepo = repos.promoCodes;
    const total = await questionsRepo.countAll();
    const mockTotal = (await mocksRepo.list()).length;
    const formulaTotal = await formulasRepo.countAll();
    const promoTotal = (await promoCodesRepo.listAll()).length;

    // Serve Vite production build from the same Node process (Hostinger-friendly).
    const distDir = path.join(root, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir, { index: false, maxAge: '1h' }));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        res.sendFile(path.join(distDir, 'index.html'), (err) => {
          if (err) next(err);
        });
      });
    }

    app.listen(PORT, API_BIND_HOST, () => {
      console.log(`PrepX API listening on http://${API_BIND_HOST}:${PORT}`);
      console.log(
        `Questions DB: ${questionsRepo.driver} (${total} questions, ${mockTotal} mocks, ${formulaTotal} formula sheets, ${promoTotal} promo codes)`
      );
      if (fs.existsSync(distDir)) {
        console.log(`Serving SPA from ${distDir}`);
      } else {
        console.warn(
          `SPA dist not found at ${distDir}. Run npm run build so / serves the frontend.`
        );
      }
    });
  } catch (err: any) {
    console.error('Failed to start API (questions DB):', err?.message || err);
    process.exit(1);
  }
}

void boot();
