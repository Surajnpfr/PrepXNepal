/**
 * Formula library domain + SQLite repo tests (question-batch pattern).
 * Run: npx tsx scripts/test-formulas-import.ts
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseFormulaImportBatch } from '../server/formulasDomain.ts';
import { createSqliteFormulasRepo } from '../server/db/sqliteFormulas.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const bad = parseFormulaImportBatch({ not: 'array' });
assert(bad.sheets.length === 0 && bad.errors.length === 1, 'non-array rejected');

const batchId = 'fbatch-1';
const partial = parseFormulaImportBatch(
  [
    {
      subject: 'Physics',
      title: 'Mechanics',
      chapter: 'Mechanics',
      formulas: [{ name: 'F', formula: 'F = ma' }],
    },
    { subject: 'Nope', title: 'x', chapter: 'y', formulas: [{ name: 'a', formula: 'b' }] },
    {
      subject: 'Chemistry',
      title: 'Thermo',
      chapter: 'Physical Chemistry',
      formulas: [],
    },
  ],
  { batchId }
);
assert(partial.sheets.length === 1, 'one valid sheet');
assert(partial.errors.length === 2, 'two row errors');
assert(partial.sheets[0].batchId === batchId, 'batch id attached');

const tmp = path.join(
  os.tmpdir(),
  `prepx-formulas-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`
);
const repo = createSqliteFormulasRepo(tmp);
await repo.ensureSchema();

await repo.createBatch({
  id: batchId,
  label: 'Test formulas',
  filename: 'formulas.json',
  importedByEmail: 'admin@example.com',
  importedByName: 'Admin',
  sheetCount: partial.sheets.length,
  errorCount: partial.errors.length,
});
const inserted = await repo.insertMany(partial.sheets);
assert(inserted === 1, 'inserted one sheet');

const listed = await repo.list();
assert(listed.length === 1, 'list has one');
assert(listed[0].formulas[0].formula === 'F = ma', 'formula persisted');

const batches = await repo.listBatches();
assert(batches.length === 1 && batches[0].sheetCount === 1, 'batch listed');

const deleted = await repo.deleteBatch(batchId);
assert(deleted.deletedSheets === 1, 'deleted sheets');
assert((await repo.list()).length === 0, 'sheets cleared');
assert((await repo.listBatches()).length === 0, 'batches cleared');

await repo.close();
fs.unlinkSync(tmp);

console.log('test-formulas-import: OK');
