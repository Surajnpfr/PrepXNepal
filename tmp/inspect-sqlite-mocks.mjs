import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const p = 'data/prepx-questions.sqlite';
console.log('exists', fs.existsSync(p), fs.existsSync(p) ? fs.statSync(p).size : 0);
const db = new DatabaseSync(p);
const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
  .all();
console.log(
  'TABLES',
  tables.map((t) => t.name).join(', ')
);
for (const t of ['mock_tests', 'mock_questions', 'mock_import_batches', 'questions']) {
  try {
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
    console.log(`${t}: ${row.c}`);
  } catch {
    console.log(`${t}: missing`);
  }
}
console.log(
  'SAMPLE',
  db
    .prepare(
      `SELECT id, title, mode, scope, total_questions, is_published FROM mock_tests LIMIT 5`
    )
    .all()
);
db.close();
