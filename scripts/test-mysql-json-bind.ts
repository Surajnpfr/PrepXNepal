/**
 * Hostinger uses MariaDB — CAST(? AS JSON) is invalid there and breaks mock import.
 * JSON columns accept JSON strings bound as plain ?.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'server/db/mysqlQuestions.ts',
  'server/db/mysqlMocks.ts',
  'server/db/mysqlPromoCodes.ts',
];

for (const rel of files) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  assert.equal(
    src.includes('CAST(? AS JSON)'),
    false,
    `${rel} must not use CAST(? AS JSON) (MariaDB incompatible)`
  );
}

console.log('MariaDB JSON bind regression OK');
