/**
 * Seed the local/default questions DB from SAMPLE_QUESTIONS in mockData.
 * Usage: npm run db:seed
 * Respects DB_HOST (MySQL) or falls back to SQLite under data/.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createQuestionsRepository } from '../server/db/index.ts';
import { parseImportBatch } from '../server/questionsDomain.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

async function main() {
  // Dynamic import keeps seed optional if mockData grows heavy.
  const { INITIAL_MOCK_TESTS } = await import('../src/data/mockData.ts');
  const sample = INITIAL_MOCK_TESTS.flatMap((m) => m.questions || []);
  const unique = new Map(sample.map((q) => [q.id, q]));
  const payload = [...unique.values()].map((q) => ({
    id: q.id,
    subject: q.subject,
    chapter: q.chapter,
    stem: q.stem,
    options: q.options,
    correctOptionKey: q.correctOptionKey,
    explanation: q.explanation,
    tags: q.tags,
    language: q.language,
    status: q.status,
    source: q.source,
  }));

  const batchId = `batch-seed-${Date.now()}`;
  const parsed = parseImportBatch(payload, { batchId });
  const repo = await createQuestionsRepository();
  const before = await repo.countAll();
  if (parsed.questions.length > 0) {
    await repo.createBatch({
      id: batchId,
      label: 'Seed sample bank',
      filename: 'mockData.ts',
      importedByEmail: 'seed@local',
      importedByName: 'Seed Script',
      questionCount: parsed.questions.length,
      errorCount: parsed.errors.length,
    });
  }
  const inserted = await repo.insertMany(parsed.questions);
  const after = await repo.countAll();
  const stats = await repo.countsBySubject();
  const batches = await repo.listBatches();
  console.log(
    JSON.stringify(
      {
        driver: repo.driver,
        batchId,
        parseErrors: parsed.errors,
        attempted: parsed.questions.length,
        inserted,
        before,
        after,
        batches: batches.length,
        bySubject: stats.filter((s) => s.count > 0),
      },
      null,
      2
    )
  );
  await repo.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
