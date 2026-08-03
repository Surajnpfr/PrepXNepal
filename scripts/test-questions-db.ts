import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseImportBatch, parseQuestionUpdate } from '../server/questionsDomain.ts';
import { createSqliteQuestionsRepo } from '../server/db/sqliteQuestions.ts';

function testParseImportRejectsNonArray() {
  const result = parseImportBatch({ not: 'array' });
  assert.equal(result.questions.length, 0);
  assert.ok(result.errors[0]?.includes('array'));
}

function testParseImportPartialSuccess() {
  const result = parseImportBatch(
    [
      {
        subject: 'Physics',
        chapter: 'Electrostatics',
        question: 'Stem A?',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correctAnswer: 'A',
      },
      { subject: 'Nope', chapter: 'X' },
      {
        subject: 'Chemistry',
        chapter: 'Mole',
        stem: 'Stem B?',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correctOptionKey: 'B',
        tags: ['CEE'],
      },
    ],
    { batchId: 'batch-test' }
  );
  assert.equal(result.questions.length, 2);
  assert.equal(result.errors.length, 1);
  assert.equal(result.questions[0].batchId, 'batch-test');
  assert.equal(result.questions[1].correctOptionKey, 'B');
}

async function testSqliteBatchEditDelete() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prepx-q-'));
  const dbPath = path.join(dir, 'test.sqlite');
  const repo = createSqliteQuestionsRepo(dbPath);
  await repo.ensureSchema();

  const batch = await repo.createBatch({
    id: 'batch-1',
    label: 'CEE Physics Pack',
    filename: 'physics.json',
    importedByEmail: 'mod@example.com',
    importedByName: 'Mod',
    questionCount: 2,
    errorCount: 0,
  });
  assert.equal(batch.id, 'batch-1');

  const parsed = parseImportBatch(
    [
      {
        subject: 'Physics',
        chapter: 'SHM',
        question: 'Q1?',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'B',
      },
      {
        subject: 'Physics',
        chapter: 'Optics',
        question: 'Q2?',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'C',
      },
    ],
    { batchId: 'batch-1' }
  );
  await repo.insertMany(parsed.questions);
  assert.equal(await repo.countAll(), 2);

  const listed = await repo.list({ batchId: 'batch-1' });
  assert.equal(listed.length, 2);

  const update = parseQuestionUpdate(listed[0].id, {
    subject: 'Physics',
    chapter: 'SHM Updated',
    question: 'Q1 edited?',
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctAnswer: 'A',
    explanation: 'edited',
    status: 'pending_review',
  });
  assert.equal(update.ok, true);
  if (update.ok) {
    const saved = await repo.updateOne({ ...update.question, batchId: 'batch-1' });
    assert.ok(saved);
    assert.equal(saved?.chapter, 'SHM Updated');
    assert.equal(saved?.correctOptionKey, 'A');
    assert.equal(saved?.batchId, 'batch-1');
  }

  assert.equal(await repo.deleteOne(listed[1].id), true);
  assert.equal(await repo.countAll(), 1);

  const renamed = await repo.updateBatchMeta('batch-1', { filename: 'cee-physics-v2.json' });
  assert.ok(renamed);
  assert.equal(renamed?.filename, 'cee-physics-v2.json');
  assert.equal(renamed?.label, 'CEE Physics Pack');

  const renamedLabel = await repo.updateBatchMeta('batch-1', {
    filename: 'new-pack.json',
    label: 'New Pack',
  });
  assert.equal(renamedLabel?.filename, 'new-pack.json');
  assert.equal(renamedLabel?.label, 'New Pack');

  const delBatch = await repo.deleteBatch('batch-1');
  assert.equal(delBatch.deletedQuestions, 1);
  assert.equal(await repo.countAll(), 0);
  assert.equal((await repo.listBatches()).length, 0);

  await repo.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

async function main() {
  testParseImportRejectsNonArray();
  testParseImportPartialSuccess();
  await testSqliteBatchEditDelete();
  console.log('test-questions-db: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
