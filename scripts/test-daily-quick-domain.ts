/**
 * Daily Quick domain tests (no DB).
 * Run: npx tsx scripts/test-daily-quick-domain.ts
 */
import {
  applyDailyQuickApproval,
  buildDailyQuickQuestionDraft,
  canApproveDailyQuick,
  canUploadDailyQuick,
  isDailyQuickQuestion,
  listDailyQuickQueue,
  pickActiveDailyQuickSet,
  validateDailyQuickCreate,
  type DailyQuickSubject,
} from '../server/dailyQuickDomain.ts';
import type { QuestionRecord } from '../server/questionsDomain.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canUploadDailyQuick('QAD'), 'qad can upload');
assert(canUploadDailyQuick('Admin'), 'admin can upload');
assert(!canUploadDailyQuick('Content Manager'), 'cm cannot upload');
assert(!canUploadDailyQuick('Billing'), 'billing cannot upload');

assert(canApproveDailyQuick('Admin'), 'admin can approve');
assert(canApproveDailyQuick(undefined, true), 'bootstrap can approve');
assert(!canApproveDailyQuick('QAD'), 'qad cannot approve');

const badSubject = validateDailyQuickCreate({
  subject: 'MAT',
  question: 'x?',
  options: { A: '1', B: '2', C: '3', D: '4' },
  correctAnswer: 'A',
  explanation: 'because',
});
assert(badSubject.ok === false, 'MAT rejected');

const ok = validateDailyQuickCreate({
  subject: 'Physics',
  question: 'What is F = ma?',
  options: { A: 'Newton 2', B: 'Newton 1', C: 'Newton 3', D: 'Energy' },
  correctAnswer: 'A',
  explanation: 'Second law of motion.',
});
assert(ok.ok === true, 'valid create');
if (ok.ok) {
  const draft = buildDailyQuickQuestionDraft(ok, 'dq-1');
  assert(draft.status === 'pending_review', 'starts pending');
  assert(draft.chapter === 'Daily Quick', 'chapter set');
  assert(draft.tags.includes('daily-quick'), 'tagged');
  assert(isDailyQuickQuestion(draft), 'recognized');
}

function q(
  id: string,
  subject: DailyQuickSubject,
  status: QuestionRecord['status'],
  updatedAt: string
): QuestionRecord {
  return {
    id,
    subject,
    chapter: 'Daily Quick',
    stem: `${subject} stem`,
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctOptionKey: 'A',
    explanation: 'e',
    tags: ['daily-quick'],
    language: 'en',
    status,
    source: 'daily-quick',
    flagCount: 0,
    createdAt: updatedAt,
    updatedAt,
  };
}

const pool = [
  q('p1', 'Physics', 'published', '2026-01-01T00:00:00.000Z'),
  q('p2', 'Physics', 'published', '2026-06-01T00:00:00.000Z'),
  q('c1', 'Chemistry', 'published', '2026-05-01T00:00:00.000Z'),
  q('b1', 'Botany', 'pending_review', '2026-07-01T00:00:00.000Z'),
  q('z1', 'Zoology', 'published', '2026-04-01T00:00:00.000Z'),
];

const active = pickActiveDailyQuickSet(pool);
assert(active.length === 3, `active count ${active.length}`);
assert(active.find((x) => x.subject === 'Physics')?.id === 'p2', 'latest physics');
assert(!active.find((x) => x.subject === 'Botany'), 'pending botany excluded');

const queue = listDailyQuickQueue(pool);
assert(queue[0].status === 'pending_review', 'pending first in queue');

const approved = applyDailyQuickApproval(pool[3]);
assert(!('error' in approved) && approved.status === 'published', 'approve works');

const already = applyDailyQuickApproval(pool[0]);
assert('error' in already, 'already published rejected');

console.log('test-daily-quick-domain: OK');
