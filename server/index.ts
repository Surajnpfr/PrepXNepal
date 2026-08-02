import express from 'express';
import dotenv from 'dotenv';
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
import type { MocksRepository, QuestionsRepository } from './db/types.ts';
import { consumeAttemptSession, createAttemptSession } from './attemptSessions.ts';
import type { AttemptSession } from './attemptSessions.ts';
import { updatePublicMetadataAtomic, type PublicMeta } from './clerkMeta.ts';
import {
  assertPatchBodyAllowed,
  isAllowedPlannerDateKey,
  publicErrorMessage,
} from './userPatchPolicy.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

const PORT = Number(process.env.API_PORT || 3001);
const SECRET_KEY = process.env.CLERK_SECRET_KEY;
const BOOTSTRAP_ADMIN_EMAIL =
  process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || 'surajnepal2058@gmail.com';
const API_BIND_HOST = process.env.API_BIND_HOST || '127.0.0.1';
const MOCK_COMPLETE_COINS = 20;
const CLERK_AUTHORIZED_PARTIES = (process.env.CLERK_AUTHORIZED_PARTIES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!SECRET_KEY) {
  console.error('CLERK_SECRET_KEY is missing. Add it to .env.local');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: SECRET_KEY });
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

let questionsRepo: QuestionsRepository;
let mocksRepo: MocksRepository;

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

async function boot() {
  try {
    const repos = await createAppRepositories();
    questionsRepo = repos.questions;
    mocksRepo = repos.mocks;
    const total = await questionsRepo.countAll();
    const mockTotal = (await mocksRepo.list()).length;
    app.listen(PORT, API_BIND_HOST, () => {
      console.log(`PrepX API listening on http://${API_BIND_HOST}:${PORT}`);
      console.log(`Questions DB: ${questionsRepo.driver} (${total} questions, ${mockTotal} mocks)`);
    });
  } catch (err: any) {
    console.error('Failed to start API (questions DB):', err?.message || err);
    process.exit(1);
  }
}

void boot();
