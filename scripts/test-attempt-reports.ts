/**
 * Attempt reports SQLite persistence smoke test.
 * Run: npx tsx scripts/test-attempt-reports.ts
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createSqliteAttemptReportsRepo } from '../server/db/sqliteAttemptReports.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const tmp = path.join(os.tmpdir(), `prepx-reports-${Date.now()}.sqlite`);
const repo = createSqliteAttemptReportsRepo(tmp);
await repo.ensureSchema();

const report = {
  id: 'rep-1',
  userId: 'u1',
  attemptId: 'att-1',
  mockId: 'mock-1',
  mockTitle: 'CEE Full Mock',
  examType: 'Nepal CEE',
  completedAt: '2026-08-05T10:00:00.000Z',
  overallScore: 112,
  maxScore: 200,
  accuracyPercentage: 60,
  totalAttempted: 180,
  correctCount: 120,
  wrongCount: 60,
  skippedCount: 20,
  timeSpentSec: 9000,
  predictedRank: 500,
  rankBand: [400, 600] as [number, number],
  percentile: 70,
  subjectScores: [],
  chapterScores: [],
  mistakeAnalysis: {
    wrongVsSkippedRatio: '3:1',
    slowCorrectCount: 2,
    speedSecPerQuestion: 50,
  },
  targetScore: 150,
  targetGap: 38,
  recommendations: [],
  shareToken: 'abc',
  paperQuestions: [{ id: 'q1' }],
  paperAnswers: { q1: 'A' },
};

const saved = await repo.insert({
  id: report.id,
  clerkUserId: 'clerk_1',
  userId: 'u1',
  attemptId: 'att-1',
  mockId: 'mock-1',
  mockTitle: 'CEE Full Mock',
  completedAt: report.completedAt,
  overallScore: 112,
  maxScore: 200,
  report,
});

assert(saved.id === 'rep-1', 'insert id');
assert(saved.overallScore === 112, 'score');
assert((saved.report as any).paperQuestions?.length === 1, 'paper kept');

const listed = await repo.listByClerkUserId('clerk_1');
assert(listed.length === 1, 'list by clerk');
assert(listed[0].report.mockTitle === 'CEE Full Mock', 'title');

const all = await repo.listAll();
assert(all.length === 1, 'list all');

await repo.close();
fs.unlinkSync(tmp);
console.log('test-attempt-reports: OK');
