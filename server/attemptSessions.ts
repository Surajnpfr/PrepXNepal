import { randomUUID } from 'crypto';

export type AttemptSession = {
  userId: string;
  questionIds: string[];
  mockId: string;
  correctMarks: number;
  wrongMarks: number;
  /** Coins already deducted at start for coinPrice mocks; 0 if quota-only. */
  coinPriceCharged: number;
  expiresAt: number;
};

export type AttemptSessionCreateInput = {
  userId: string;
  questionIds: string[];
  mockId: string;
  correctMarks: number;
  wrongMarks: number;
  coinPriceCharged?: number;
  ttlMs?: number;
};

const attemptSessions = new Map<string, AttemptSession>();
export const ATTEMPT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Test-only: clear all sessions. */
export function __resetAttemptSessionsForTests() {
  attemptSessions.clear();
}

export function __getAttemptSessionForTests(id: string): AttemptSession | undefined {
  return attemptSessions.get(id);
}

function clampMarks(correctMarks: number, wrongMarks: number): { correctMarks: number; wrongMarks: number } {
  return {
    correctMarks: Math.min(5, Math.max(0, correctMarks)),
    wrongMarks: Math.max(-5, Math.min(0, wrongMarks)),
  };
}

export function createAttemptSession(input: AttemptSessionCreateInput): string {
  const id = randomUUID();
  const marks = clampMarks(input.correctMarks, input.wrongMarks);
  attemptSessions.set(id, {
    userId: input.userId,
    questionIds: [...input.questionIds],
    mockId: input.mockId,
    correctMarks: marks.correctMarks,
    wrongMarks: marks.wrongMarks,
    coinPriceCharged: Math.max(0, Math.floor(input.coinPriceCharged || 0)),
    expiresAt: Date.now() + (input.ttlMs ?? ATTEMPT_SESSION_TTL_MS),
  });
  if (attemptSessions.size > 4000) {
    const now = Date.now();
    for (const [k, v] of attemptSessions) {
      if (v.expiresAt < now) attemptSessions.delete(k);
    }
  }
  return id;
}

/** Return live session id for user+mock if present (weekly one-attempt resume). */
export function findActiveAttemptSession(
  userId: string,
  mockId: string
): { sessionId: string; session: AttemptSession } | null {
  const now = Date.now();
  for (const [sessionId, session] of attemptSessions) {
    if (session.expiresAt < now) {
      attemptSessions.delete(sessionId);
      continue;
    }
    if (session.userId === userId && session.mockId === mockId) {
      return { sessionId, session };
    }
  }
  return null;
}

export function consumeAttemptSession(
  sessionId: string,
  userId: string,
  questionIds: string[]
): AttemptSession {
  const session = attemptSessions.get(sessionId);
  if (!session) {
    const err: any = new Error('Invalid or expired attempt session. Restart the mock.');
    err.status = 403;
    throw err;
  }
  if (session.userId !== userId) {
    const err: any = new Error('Attempt session does not belong to this user');
    err.status = 403;
    throw err;
  }
  if (session.expiresAt < Date.now()) {
    attemptSessions.delete(sessionId);
    const err: any = new Error('Attempt session expired. Restart the mock.');
    err.status = 403;
    throw err;
  }
  if (
    session.questionIds.length !== questionIds.length ||
    session.questionIds.some((id, i) => id !== questionIds[i])
  ) {
    const err: any = new Error('Paper does not match the started attempt session');
    err.status = 403;
    throw err;
  }
  attemptSessions.delete(sessionId);
  return session;
}
