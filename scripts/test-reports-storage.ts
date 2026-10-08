/**
 * Compact reports cache + migration smoke test (Node memory localStorage shim).
 * Run: npx tsx scripts/test-reports-storage.ts
 */
import assert from 'node:assert/strict';
import type { AttemptReport, Question } from '../src/types.ts';
import {
  REPORTS_CACHE_MAX_BYTES,
  REPORTS_SCHEMA_VERSION,
  REPORTS_SCHEMA_VERSION_KEY,
  REPORTS_STORAGE_KEY,
  compactAttemptReport,
  loadPastReportsFromStorage,
  normalizeReportForCache,
  paperStorageKey,
  persistReportsCache,
} from '../src/lib/reportsStorage.ts';
import { clearFailedWriteGuard, estimateJsonBytes } from '../src/lib/safeStorage.ts';

type Store = Map<string, string>;

function installLocalStorageShim(store: Store) {
  const localStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      const next = new Map(store);
      next.set(key, String(value));
      let total = 0;
      for (const v of next.values()) total += v.length;
      // Soft quota for tests (~256KB) so oversized paper+reports can be simulated separately.
      if (total > 256 * 1024) {
        const err = new Error('Setting the value exceeded the quota.');
        err.name = 'QuotaExceededError';
        throw err;
      }
      store.clear();
      for (const [k, v] of next) store.set(k, v);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  (globalThis as any).localStorage = localStorage;
  return localStorage;
}

function sampleQuestion(id: string, bulky = false): Question {
  return {
    id,
    subject: 'Physics',
    chapter: 'Mechanics',
    stem: bulky ? `Stem ${id} `.repeat(200) : `Stem ${id}`,
    options: {
      A: bulky ? 'A'.repeat(400) : 'A',
      B: bulky ? 'B'.repeat(400) : 'B',
      C: bulky ? 'C'.repeat(400) : 'C',
      D: bulky ? 'D'.repeat(400) : 'D',
    },
    correctOptionKey: 'A',
    explanation: bulky ? 'Explain '.repeat(300) : 'Explain',
    tags: ['t'],
    language: 'en',
    status: 'published',
  };
}

function sampleReport(overrides: Partial<AttemptReport> = {}): AttemptReport {
  return {
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
    rankBand: [400, 600],
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
    paperQuestions: [sampleQuestion('q1'), sampleQuestion('q2')],
    paperAnswers: { q1: 'A', q2: 'B' },
    ...overrides,
  };
}

const store: Store = new Map();
installLocalStorageShim(store);
clearFailedWriteGuard();

// 1) Compact strips paperQuestions but keeps answers
const compact = compactAttemptReport(sampleReport());
assert.equal(compact.paperQuestions, undefined);
assert.deepEqual(compact.paperAnswers, { q1: 'A', q2: 'B' });

// 2) Normalize caches paper under prepx_paper_* and returns compact report
store.clear();
clearFailedWriteGuard();
const normalized = normalizeReportForCache(sampleReport());
assert.equal(normalized.paperQuestions, undefined);
const paperRaw = store.get(paperStorageKey('mock-1'));
assert.ok(paperRaw);
const paper = JSON.parse(paperRaw!) as Question[];
assert.equal(paper.length, 2);

// 3) Persist writes compact payload only
store.clear();
clearFailedWriteGuard();
const fat = sampleReport({
  paperQuestions: Array.from({ length: 40 }, (_, i) => sampleQuestion(`q${i}`, true)),
});
const fatBytes = estimateJsonBytes([fat]);
const compactBytes = estimateJsonBytes([compactAttemptReport(fat)]);
assert.ok(fatBytes > compactBytes, 'compact should be smaller');
const write = persistReportsCache([normalizeReportForCache(fat)]);
assert.equal(write.ok, true);
const storedReports = JSON.parse(store.get(REPORTS_STORAGE_KEY)!) as AttemptReport[];
assert.equal(storedReports[0].paperQuestions, undefined);
assert.equal(Number(store.get(REPORTS_SCHEMA_VERSION_KEY)), REPORTS_SCHEMA_VERSION);

// 4) Migration extracts embedded papers from legacy prepx_reports
store.clear();
clearFailedWriteGuard();
const legacy = [
  sampleReport({ id: 'rep-a', mockId: 'mock-a' }),
  sampleReport({ id: 'rep-b', mockId: 'mock-b', paperQuestions: [sampleQuestion('qx')] }),
];
store.set(REPORTS_STORAGE_KEY, JSON.stringify(legacy));
const migrated = loadPastReportsFromStorage();
assert.equal(migrated.length, 2);
assert.ok(migrated.every((r) => !r.paperQuestions?.length));
assert.ok(store.get(paperStorageKey('mock-a')));
assert.ok(store.get(paperStorageKey('mock-b')));
assert.equal(Number(store.get(REPORTS_SCHEMA_VERSION_KEY)), REPORTS_SCHEMA_VERSION);

// Second load must not remigrate destructively
const again = loadPastReportsFromStorage();
assert.equal(again.length, 2);

// 5) Size guard rejects pathological payloads without deleting previous valid cache
store.clear();
clearFailedWriteGuard();
const small = [normalizeReportForCache(sampleReport({ id: 'keep-me' }))];
assert.equal(persistReportsCache(small).ok, true);
const previous = store.get(REPORTS_STORAGE_KEY)!;
const hugeAnswers: Record<string, 'A'> = {};
for (let i = 0; i < 200_000; i++) hugeAnswers[`q${i}`] = 'A';
const pathological: AttemptReport = {
  ...compactAttemptReport(sampleReport({ id: 'too-big' })),
  paperAnswers: hugeAnswers as AttemptReport['paperAnswers'],
};
assert.ok(estimateJsonBytes([pathological]) > REPORTS_CACHE_MAX_BYTES);
const blocked = persistReportsCache([pathological]);
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, 'oversized');
assert.equal(store.get(REPORTS_STORAGE_KEY), previous, 'previous value preserved');

console.log('test-reports-storage: OK');
