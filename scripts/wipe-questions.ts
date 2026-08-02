/**
 * Wipe all questions + import batches.
 * Usage: npx tsx scripts/wipe-questions.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createQuestionsRepository } from '../server/db/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

async function main() {
  const repo = await createQuestionsRepository();
  const before = await repo.countAll();
  const batches = await repo.listBatches();
  let deletedFromBatches = 0;
  for (const b of batches) {
    const r = await repo.deleteBatch(b.id);
    deletedFromBatches += r.deletedQuestions;
  }
  const left = await repo.list();
  let deletedLoose = 0;
  for (const q of left) {
    if (await repo.deleteOne(q.id)) deletedLoose += 1;
  }
  const after = await repo.countAll();
  const batchesAfter = await repo.listBatches();
  console.log(
    JSON.stringify(
      {
        driver: repo.driver,
        before,
        deletedFromBatches,
        deletedLoose,
        after,
        batchesLeft: batchesAfter.length,
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
