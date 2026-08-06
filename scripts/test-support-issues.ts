/**
 * Support issues domain + SQLite queue tests.
 * Run: npx tsx scripts/test-support-issues.ts
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  canTriageSupportIssues,
  normalizeIssueBody,
  sortIssuesForQueue,
  type SupportIssueRecord,
} from '../server/supportDomain.ts';
import { createSqliteSupportIssuesRepo } from '../server/db/sqliteSupportIssues.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canTriageSupportIssues('Admin'), 'admin');
assert(canTriageSupportIssues('Content Manager'), 'content manager');
assert(canTriageSupportIssues('Billing'), 'billing');
assert(canTriageSupportIssues('QAD'), 'qad');
assert(!canTriageSupportIssues('Student'), 'student cannot');
assert(normalizeIssueBody('  hello   world  ') === 'hello world', 'normalize spaces');
assert(normalizeIssueBody('This is a long enough issue description').includes('long enough'), 'normalize keep');

{
  const { isSupportIssueCategory } = await import('../server/supportDomain.ts');
  assert(isSupportIssueCategory('feedback'), 'feedback category allowed');
  assert(isSupportIssueCategory('technical'), 'technical category allowed');
  assert(!isSupportIssueCategory('spam'), 'unknown category rejected');
}

const base = {
  clerkUserId: 'user_a',
  userName: 'A',
  userEmail: 'a@ex.com',
  category: 'technical' as const,
  body: 'Timer froze on question 12 during mock',
  staffNotes: null,
  resolvedAt: null,
  resolvedBy: null,
  resolvedByClerkId: null,
};

const sorted = sortIssuesForQueue([
  { ...base, id: '1', status: 'resolved', createdAt: '2026-01-01T10:00:00.000Z' },
  { ...base, id: '2', status: 'open', createdAt: '2026-01-01T12:00:00.000Z' },
  { ...base, id: '3', status: 'open', createdAt: '2026-01-01T11:00:00.000Z' },
] as SupportIssueRecord[]);

assert(sorted[0].id === '3' && sorted[1].id === '2', 'open FIFO oldest first');
assert(sorted[2].id === '1', 'resolved after open');

const tmp = path.join(os.tmpdir(), `prepx-issues-${Date.now()}.sqlite`);
const repo = createSqliteSupportIssuesRepo(tmp);
await repo.ensureSchema();

const created = await repo.insert({
  id: 'issue-1',
  clerkUserId: 'user_s',
  userName: 'Stu',
  userEmail: 's@ex.com',
  category: 'content',
  body: 'Wrong key on Physics Q5 — should be option B',
});
assert(created.status === 'open', 'insert open');

const resolved = await repo.resolve('issue-1', {
  resolvedBy: 'Mod',
  resolvedByClerkId: 'user_m',
  staffNotes: 'Fixed in bank',
});
assert(resolved?.status === 'resolved', 'resolved');
assert((await repo.resolve('issue-1', { resolvedBy: 'X', resolvedByClerkId: 'y' })) === null, 'idempotent');

await repo.close();
fs.unlinkSync(tmp);

console.log('test-support-issues: OK');
