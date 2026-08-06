import assert from 'node:assert/strict';
import {
  assertWeeklyMockShape,
  formatWeeklyLeaderboardCsv,
  isWeeklyWindowOpen,
  rankWeeklyAttempts,
  resolveExportIdentity,
  resolveWeeklyMock,
  weeklyWindowStatus,
  WEEKLY_MOCK_SHAPE_ERROR,
} from '../server/weeklyMockDomain.ts';
import { assertFreePlanMockAccess } from '../server/mockAccessDomain.ts';

const now = Date.parse('2026-08-06T12:00:00.000Z');

assert.equal(
  weeklyWindowStatus(
    { opensAt: '2026-08-06T10:00:00.000Z', closesAt: '2026-08-06T18:00:00.000Z' },
    now
  ),
  'open'
);
assert.equal(
  weeklyWindowStatus(
    { opensAt: '2026-08-07T10:00:00.000Z', closesAt: '2026-08-07T18:00:00.000Z' },
    now
  ),
  'upcoming'
);
assert.equal(
  weeklyWindowStatus(
    { opensAt: '2026-08-01T10:00:00.000Z', closesAt: '2026-08-05T18:00:00.000Z' },
    now
  ),
  'closed'
);
assert.equal(isWeeklyWindowOpen({ opensAt: null, closesAt: null }, now), false);

const shapeOk = assertWeeklyMockShape({
  mode: 'fixed',
  scope: 'full',
  isPublished: true,
  opensAt: '2026-08-06T10:00:00.000Z',
  closesAt: '2026-08-06T18:00:00.000Z',
  isWeeklyOpen: true,
});
assert.equal(shapeOk.ok, true);

const shapeBad = assertWeeklyMockShape({
  mode: 'dynamic',
  scope: 'full',
  isPublished: true,
  opensAt: '2026-08-06T10:00:00.000Z',
  closesAt: '2026-08-06T18:00:00.000Z',
  isWeeklyOpen: true,
});
assert.equal(shapeBad.ok, false);
if (!shapeBad.ok) assert.equal(shapeBad.error, WEEKLY_MOCK_SHAPE_ERROR);

const mocks = [
  {
    id: 'old',
    title: 'Old',
    examType: 'Nepal CEE' as const,
    mode: 'fixed' as const,
    scope: 'full' as const,
    durationSec: 10800,
    totalQuestions: 200,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    isWeeklyOpen: true,
    opensAt: '2026-07-01T00:00:00.000Z',
    closesAt: '2026-07-07T00:00:00.000Z',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'current',
    title: 'Current',
    examType: 'Nepal CEE' as const,
    mode: 'fixed' as const,
    scope: 'full' as const,
    durationSec: 10800,
    totalQuestions: 200,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    isWeeklyOpen: true,
    opensAt: '2026-08-06T10:00:00.000Z',
    closesAt: '2026-08-06T18:00:00.000Z',
    createdAt: '',
    updatedAt: '',
  },
];
const resolved = resolveWeeklyMock(mocks, now);
assert.equal(resolved?.id, 'current');

const ranked = rankWeeklyAttempts(
  [
    {
      clerkUserId: 'u1',
      overallScore: 140,
      completedAt: '2026-08-06T11:00:00.000Z',
      displayName: 'A',
      avatarUrl: '',
    },
    {
      clerkUserId: 'u2',
      overallScore: 150,
      completedAt: '2026-08-06T11:30:00.000Z',
      displayName: 'B',
      avatarUrl: '',
    },
    {
      clerkUserId: 'u3',
      overallScore: 150,
      completedAt: '2026-08-06T11:00:00.000Z',
      displayName: 'C',
      avatarUrl: '',
      excludeFromLeaderboard: true,
    },
    {
      clerkUserId: 'u4',
      overallScore: 150,
      completedAt: '2026-08-06T11:10:00.000Z',
      displayName: 'D',
      avatarUrl: '',
    },
  ],
  'u1'
);
// 150: earlier finish wins (u4 before u2); staff u3 excluded; then u1 at 140
assert.equal(ranked[0].clerkUserId, 'u4');
assert.equal(ranked[0].rank, 1);
assert.equal(ranked[1].clerkUserId, 'u2');
assert.equal(ranked[2].clerkUserId, 'u1');
assert.equal(ranked[2].isYou, true);
assert.equal(ranked.length, 3);

// Score 0 still ranks (students only)
const withZero = rankWeeklyAttempts([
  {
    clerkUserId: 'z1',
    overallScore: 0,
    completedAt: '2026-08-06T12:00:00.000Z',
    displayName: 'Zero',
    avatarUrl: '',
  },
  {
    clerkUserId: 'z2',
    overallScore: 10,
    completedAt: '2026-08-06T12:00:00.000Z',
    displayName: 'Ten',
    avatarUrl: '',
  },
]);
assert.equal(withZero[0].clerkUserId, 'z2');
assert.equal(withZero[1].clerkUserId, 'z1');
assert.equal(withZero[1].overallScore, 0);

assert.equal(assertFreePlanMockAccess('Free', 'mock-set-sett', { weeklyOpenBypass: true }).ok, true);
assert.equal(assertFreePlanMockAccess('Free', 'mock-set-sett').ok, false);

const table = formatWeeklyLeaderboardCsv(
  {
    title: 'Top SetA',
    opensAt: '2026-08-06T07:51:00.000Z',
    closesAt: '2026-08-06T10:51:00.000Z',
    status: 'closed',
    exportedAt: '2026-08-06T09:17:55.000Z',
  },
  [
    {
      rank: 1,
      fullName: 'Suraj Kumar',
      username: 'suraj_k',
      email: 'suraj@example.com',
      score: 120,
      completedAt: '2026-08-06T08:00:00.000Z',
    },
  ]
);
assert.ok(table.includes('# PrepX Nepal — Weekly Open Mock Results'));
assert.ok(table.includes('# Weekly Set: Top SetA'));
assert.ok(table.includes('Opens:'));
assert.ok(table.includes('Closes:'));
assert.ok(table.includes('Status: closed'));
assert.ok(table.includes('Exported:'));
assert.ok(table.includes('Rank,Full Name,Username,Email,Score,Completed At'));
assert.ok(table.includes('Suraj Kumar'));
assert.ok(table.includes('suraj_k'));
assert.ok(table.includes('suraj@example.com'));
assert.ok(table.includes(',120,'));

const id = resolveExportIdentity({
  fullName: 'Suraj Kumar',
  username: 'suraj_k',
  displayName: 'Suraj Kumar',
  email: 'secret@example.com',
});
assert.equal(id.fullName, 'Suraj Kumar');
assert.equal(id.username, 'suraj_k');
const idLegacy = resolveExportIdentity({
  displayName: 'Suraj Kumar',
  email: 'secret@example.com',
});
assert.equal(idLegacy.fullName, 'Suraj Kumar');
assert.equal(idLegacy.username, 'secret');
assert.ok(!idLegacy.username.includes('@'));
console.log('weeklyMockDomain tests passed');
