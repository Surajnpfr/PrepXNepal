import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  DEFAULT_CEE_ALLOCATION,
  allocationDrawPlan,
  formatShortageError,
  parseAllocation,
  parseDynamicMockCreate,
  parseFixedMockImportBatch,
  sampleFromAllocation,
  totalFromAllocation,
} from '../server/mocksDomain.ts';
import { createSqliteQuestionsRepo } from '../server/db/sqliteQuestions.ts';
import { createSqliteMocksRepo } from '../server/db/sqliteMocks.ts';
import type { QuestionRecord } from '../server/questionsDomain.ts';

function testDefaultAllocationTotal() {
  assert.equal(totalFromAllocation(DEFAULT_CEE_ALLOCATION), 200);
  assert.equal((DEFAULT_CEE_ALLOCATION.chapters || []).length, 29);
  const plan = allocationDrawPlan(DEFAULT_CEE_ALLOCATION);
  assert.equal(
    plan.reduce((s, p) => s + p.count, 0),
    200
  );
  assert.ok(plan.every((p) => p.chapter), 'CEE plan should be unit/chapter draws');
}

function testParseAllocationRejectsChapterOverQuota() {
  const result = parseAllocation({
    subjects: { Physics: 10 },
    chapters: [{ subject: 'Physics', chapter: 'SHM', count: 12 }],
  });
  assert.equal(result.ok, false);
}

function testParseAllocationEmptySubjectsUsesDefaultForFull() {
  const result = parseAllocation({ subjects: {}, chapters: [] }, { scope: 'full' });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(totalFromAllocation(result.allocation), 200);
}

function testFixedImportRejectsMixedSubjects() {
  const result = parseFixedMockImportBatch([
    {
      title: 'Physics Only',
      scope: 'subject',
      subject: 'Physics',
      questions: [
        {
          subject: 'Physics',
          chapter: 'SHM',
          question: 'Q1?',
          options: { A: 'a', B: 'b', C: 'c', D: 'd' },
          correctAnswer: 'A',
        },
        {
          subject: 'Chemistry',
          chapter: 'Mole',
          question: 'Q2?',
          options: { A: 'a', B: 'b', C: 'c', D: 'd' },
          correctAnswer: 'B',
        },
      ],
    },
  ]);
  assert.equal(result.mocks.length, 0);
  assert.ok(result.errors[0]?.includes('Physics'));
}

function testFixedImportPartialSuccess() {
  const result = parseFixedMockImportBatch([
    {
      title: 'Good Mock',
      scope: 'full',
      questions: [
        {
          subject: 'Physics',
          chapter: 'SHM',
          question: 'Q1?',
          options: { A: 'a', B: 'b', C: 'c', D: 'd' },
          correctAnswer: 'A',
        },
      ],
    },
    { title: 'Bad', scope: 'full' },
  ]);
  assert.equal(result.mocks.length, 1);
  assert.equal(result.errors.length, 1);
  assert.equal(result.mocks[0].totalQuestions, 1);
}

function testDynamicCreateDefaultFull() {
  const parsed = parseDynamicMockCreate({
    title: 'Dyn Full',
    scope: 'full',
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.mock.mode, 'dynamic');
    assert.equal(parsed.mock.totalQuestions, 200);
  }
}

async function testSampleShortage() {
  const pool: QuestionRecord[] = [];
  const result = await sampleFromAllocation(
    { subjects: { Physics: 2 }, chapters: [] },
    async () => pool
  );
  assert.equal(result.ok, false);
  if (result.ok === false) {
    assert.equal(result.shortages[0].needed, 2);
    assert.equal(result.shortages[0].available, 0);
    assert.ok(formatShortageError(result.shortages).includes('Physics'));
  }
}

async function testSamplePartialFill() {
  const pool: QuestionRecord[] = [
    {
      id: 'q-1',
      subject: 'Physics',
      chapter: 'SHM',
      stem: 'Q?',
      options: { A: 'a', B: 'b', C: 'c', D: 'd' },
      correctOptionKey: 'A',
      explanation: 'e',
      tags: [],
      language: 'en',
      status: 'published',
      flagCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const result = await sampleFromAllocation(
    { subjects: { Physics: 50 }, chapters: [] },
    async ({ excludeIds }) => pool.filter((q) => !excludeIds.includes(q.id)),
    { allowPartial: true }
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.questions.length, 1);
    assert.ok(result.shortages.length >= 1);
  }
}

async function testSampleSuccessAndSqliteRoundTrip() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prepx-mocks-'));
  const dbPath = path.join(dir, 'test.sqlite');
  const qRepo = createSqliteQuestionsRepo(dbPath);
  const mRepo = createSqliteMocksRepo(dbPath);
  await qRepo.ensureSchema();
  await mRepo.ensureSchema();

  const nowQs = Array.from({ length: 5 }, (_, i) => ({
    id: `q-${i}`,
    subject: 'Physics' as const,
    chapter: 'SHM',
    stem: `Stem ${i}?`,
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctOptionKey: 'A' as const,
    explanation: 'e',
    tags: [],
    language: 'en' as const,
    status: 'published' as const,
    flagCount: 0,
  }));
  await qRepo.insertMany(nowQs);

  const sampled = await sampleFromAllocation(
    { subjects: { Physics: 3 }, chapters: [] },
    async ({ subject, chapter, excludeIds }) =>
      qRepo.listPool({ subject, chapter, excludeIds, status: 'published' })
  );
  assert.equal(sampled.ok, true);
  if (sampled.ok) assert.equal(sampled.questions.length, 3);

  const fixed = await mRepo.insertFixed({
    id: 'mock-fixed-1',
    title: 'Fixed Phy',
    examType: 'Nepal CEE',
    mode: 'fixed',
    scope: 'subject',
    subject: 'Physics',
    durationSec: 1800,
    totalQuestions: 3,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    questionIds: ['q-0', 'q-1', 'q-2'],
  });
  assert.equal(fixed.questionIds?.length, 3);

  const dyn = await mRepo.insertDynamic({
    id: 'mock-dyn-1',
    title: 'Dyn Phy',
    examType: 'Nepal CEE',
    mode: 'dynamic',
    scope: 'subject',
    subject: 'Physics',
    durationSec: 1800,
    totalQuestions: 3,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    allocation: { subjects: { Physics: 3 }, chapters: [] },
  });
  assert.equal(dyn.mode, 'dynamic');
  assert.equal(dyn.allocation?.subjects.Physics, 3);

  const listed = await mRepo.list({ publishedOnly: true });
  assert.equal(listed.length, 2);

  await qRepo.close();
  await mRepo.close();
}

function testQuestionBankSetFileWrapsAsOneMock() {
  const result = parseFixedMockImportBatch(
    [
      {
        subject: 'Physics',
        chapter: 'Mechanics',
        question: 'Q1?',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'A',
      },
      {
        subject: 'Chemistry',
        chapter: 'Organic Chemistry',
        question: 'Q2?',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'B',
      },
    ],
    { filename: 'SetA.json' }
  );
  assert.equal(result.errors.length, 0, result.errors.join('; '));
  assert.equal(result.mocks.length, 1);
  assert.equal(result.mocks[0].title, 'SetA');
  assert.equal(result.mocks[0].id, 'mock-set-seta');
  assert.equal(result.mocks[0].totalQuestions, 2);
}

async function main() {
  testDefaultAllocationTotal();
  testParseAllocationRejectsChapterOverQuota();
  testParseAllocationEmptySubjectsUsesDefaultForFull();
  testFixedImportRejectsMixedSubjects();
  testFixedImportPartialSuccess();
  testQuestionBankSetFileWrapsAsOneMock();
  testDynamicCreateDefaultFull();
  await testSampleShortage();
  await testSamplePartialFill();
  await testSampleSuccessAndSqliteRoundTrip();
  // Add a minimal practice-route domain check (same parser the API uses)
  const practice = parseDynamicMockCreate({
    title: 'My Dynamic Full Mock',
    scope: 'full',
    allocation: { subjects: { Physics: 2, Chemistry: 0, Zoology: 0, Botany: 0, MAT: 0 } },
  });
  assert.equal(practice.ok, true);

  console.log('All mock domain/repo tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
