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
  resizeAllocationToTotal,
  sampleFromAllocation,
  serializeFixedMockAsSetJson,
  setExportFilename,
  toSetExportQuestion,
  totalFromAllocation,
  ceeAllocationForSubject,
  ceeAllocationForChapter,
} from '../server/mocksDomain.ts';
import { createSqliteQuestionsRepo } from '../server/db/sqliteQuestions.ts';
import { createSqliteMocksRepo } from '../server/db/sqliteMocks.ts';
import type { QuestionRecord } from '../server/questionsDomain.ts';
import { parseImportBatch } from '../server/questionsDomain.ts';

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

  const del = await mRepo.deleteOne('mock-fixed-1');
  assert.equal(del.deleted, true);
  assert.equal(del.questionIds.length, 3);
  const stillLinked = await mRepo.filterQuestionIdsLinkedToMocks(del.questionIds);
  assert.equal(stillLinked.length, 0, 'links cleared after mock delete');
  assert.equal((await qRepo.getByIds(del.questionIds)).length, 3, 'bank rows remain until purge');
  for (const qid of del.questionIds) {
    assert.equal(await qRepo.deleteOne(qid), true, `orphan ${qid} removable from bank`);
  }
  assert.equal((await qRepo.getByIds(del.questionIds)).length, 0, 'bank purged');

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
  assert.equal(listed.length, 1);

  await qRepo.close();
  await mRepo.close();
}

function makeSampleQuestion(i: number, subject: 'Physics' | 'Mixed' = 'Physics') {
  return {
    subject,
    chapter: subject === 'Mixed' ? 'GK' : 'Mechanics',
    question: `Sample question ${i + 1}?`,
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctAnswer: 'A' as const,
  };
}

function testQuestionBankSetRequiresExactly200() {
  const tooFew = parseFixedMockImportBatch(
    [makeSampleQuestion(0), makeSampleQuestion(1, 'Mixed'), makeSampleQuestion(2, 'Mixed')],
    { filename: 'SetA.json' }
  );
  assert.equal(tooFew.mocks.length, 0);
  assert.ok(tooFew.errors[0]?.includes('exactly 200'), tooFew.errors[0]);

  const exactly = parseFixedMockImportBatch(
    Array.from({ length: 200 }, (_, i) => makeSampleQuestion(i, i % 5 === 0 ? 'Mixed' : 'Physics')),
    { filename: 'SetA.json' }
  );
  assert.equal(exactly.errors.length, 0, exactly.errors.join('; '));
  assert.equal(exactly.mocks.length, 1);
  assert.equal(exactly.mocks[0].title, 'SetA');
  assert.equal(exactly.mocks[0].id, 'mock-set-seta');
  assert.equal(exactly.mocks[0].totalQuestions, 200);
  assert.equal(exactly.mocks[0].questions[0].id, 'q-set-seta-001');
  assert.equal(exactly.mocks[0].questions[199].id, 'q-set-seta-200');
  assert.equal(exactly.mocks[0].questions[5].subject, 'Mixed');

  const tooMany = parseFixedMockImportBatch(
    Array.from({ length: 201 }, (_, i) => makeSampleQuestion(i)),
    { filename: 'SetB.json' }
  );
  assert.equal(tooMany.mocks.length, 0);
  assert.ok(tooMany.errors[0]?.includes('exactly 200'), tooMany.errors[0]);
}

function testSetExportShapeAndFilename() {
  assert.equal(setExportFilename('SetA.json', 'ignored'), 'SetA.json');
  assert.equal(setExportFilename(null, 'CEE Set 1'), 'CEE Set 1.json');
  assert.equal(setExportFilename('bad/name?.json', 'x'), 'bad-name-.json');

  const q: QuestionRecord = {
    id: 'q1',
    subject: 'Physics',
    chapter: 'SHM',
    stem: 'Stem?',
    options: { A: '1', B: '2', C: '3', D: '4' },
    correctOptionKey: 'B',
    explanation: 'Because B',
    tags: ['CEE'],
    language: 'en',
    status: 'published',
    source: 'SetA',
    flagCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const exported = toSetExportQuestion(q);
  assert.equal(exported.question, 'Stem?');
  assert.equal(exported.correctAnswer, 'B');
  assert.equal(exported.subject, 'Physics');

  const arr = serializeFixedMockAsSetJson([q]);
  assert.equal(arr.length, 1);
  const reimport = parseImportBatch(arr);
  assert.equal(reimport.questions.length, 1, reimport.errors.join('; '));
  assert.equal(reimport.questions[0].stem, 'Stem?');
  assert.equal(reimport.questions[0].correctOptionKey, 'B');
}

function testResizeAllocationToTotal() {
  const physics = ceeAllocationForSubject('Physics');
  const full = totalFromAllocation(physics);
  assert.ok(full > 0);
  const resized = resizeAllocationToTotal(physics, 20);
  assert.equal(totalFromAllocation(resized), 20);
  assert.ok((resized.chapters || []).every((c) => c.count >= 0));

  const chapter = ceeAllocationForChapter('Physics', 'Mechanics');
  const chapterN = resizeAllocationToTotal(chapter, 7);
  assert.equal(totalFromAllocation(chapterN), 7);

  const mixed = resizeAllocationToTotal({ subjects: { Mixed: 0 }, chapters: [] }, 12);
  assert.equal(totalFromAllocation(mixed), 12);
  assert.equal(mixed.subjects.Mixed, 12);
}

async function main() {
  testDefaultAllocationTotal();
  testParseAllocationRejectsChapterOverQuota();
  testParseAllocationEmptySubjectsUsesDefaultForFull();
  testFixedImportRejectsMixedSubjects();
  testFixedImportPartialSuccess();
  testQuestionBankSetRequiresExactly200();
  testSetExportShapeAndFilename();
  testResizeAllocationToTotal();
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
