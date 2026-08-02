/**
 * Regression harness: attempt sessions bind marks and are single-use.
 * Run: npx tsx scripts/verify-security-attempt-session.ts
 */
import {
  __getAttemptSessionForTests,
  __resetAttemptSessionsForTests,
  consumeAttemptSession,
  createAttemptSession,
} from '../server/attemptSessions.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function expectThrow(fn: () => void, status: number) {
  try {
    fn();
    throw new Error('expected throw');
  } catch (err: any) {
    if (err?.message === 'expected throw') throw err;
    assert(err?.status === status, `expected status ${status}, got ${err?.status}: ${err?.message}`);
  }
}

__resetAttemptSessionsForTests();

const ids = ['q1', 'q2', 'q3'];
const sessionId = createAttemptSession({
  userId: 'user_a',
  questionIds: ids,
  mockId: 'mock-1',
  correctMarks: 1,
  wrongMarks: -0.25,
  coinPriceCharged: 50,
});

const pending = __getAttemptSessionForTests(sessionId);
assert(pending?.correctMarks === 1, 'session stores correctMarks');
assert(pending?.coinPriceCharged === 50, 'session stores coin charge');

// Client-inflated marks are clamped at create time
const inflatedId = createAttemptSession({
  userId: 'user_a',
  questionIds: ['q9'],
  mockId: 'mock-x',
  correctMarks: 99,
  wrongMarks: -99,
});
assert(__getAttemptSessionForTests(inflatedId)?.correctMarks === 5, 'clamp correctMarks');
assert(__getAttemptSessionForTests(inflatedId)?.wrongMarks === -5, 'clamp wrongMarks');
consumeAttemptSession(inflatedId, 'user_a', ['q9']);

// Happy path consumes once
const s = consumeAttemptSession(sessionId, 'user_a', ids);
assert(s.mockId === 'mock-1', 'mock id');
assert(s.correctMarks === 1 && s.wrongMarks === -0.25, 'consumed marks');

// Replay must fail (coin farm / answer dump)
expectThrow(() => consumeAttemptSession(sessionId, 'user_a', ids), 403);

const sid2 = createAttemptSession({
  userId: 'user_a',
  questionIds: ids,
  mockId: 'mock-2',
  correctMarks: 1,
  wrongMarks: -0.25,
});
expectThrow(() => consumeAttemptSession(sid2, 'user_b', ids), 403);
expectThrow(() => consumeAttemptSession(sid2, 'user_a', ['q1', 'q2', 'qX']), 403);
consumeAttemptSession(sid2, 'user_a', ids);

console.log('verify-security-attempt-session: PASS');
