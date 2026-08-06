/**
 * Weekly open mock + mock-scoped leaderboard domain invariants.
 * Root: schedule + one-attempt rules live here, not as UI-only filters.
 */

import type { MockRecord } from './mocksDomain.ts';

export type WeeklyWindowStatus = 'open' | 'closed' | 'upcoming' | 'unscheduled';

export const WEEKLY_MOCK_SHAPE_ERROR =
  'Weekly open mock must be a published fixed full-syllabus paper with opensAt before closesAt.';

export const WEEKLY_WINDOW_CLOSED_ERROR =
  'This week’s open mock is outside its time window. Check the leaderboard for results.';

export const WEEKLY_ALREADY_ATTEMPTED_ERROR =
  'You have already used your single attempt for this week’s open mock.';

export const WEEKLY_STUDY_BLOCKED_ERROR =
  'Study mode is disabled for the weekly open mock (one timed attempt only).';

export function parseIsoOrNull(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function weeklyWindowStatus(
  mock: Pick<MockRecord, 'opensAt' | 'closesAt'>,
  nowMs: number = Date.now()
): WeeklyWindowStatus {
  const opens = mock.opensAt ? Date.parse(mock.opensAt) : NaN;
  const closes = mock.closesAt ? Date.parse(mock.closesAt) : NaN;
  if (Number.isNaN(opens) || Number.isNaN(closes)) return 'unscheduled';
  if (nowMs < opens) return 'upcoming';
  if (nowMs > closes) return 'closed';
  return 'open';
}

export function isWeeklyWindowOpen(
  mock: Pick<MockRecord, 'opensAt' | 'closesAt'>,
  nowMs: number = Date.now()
): boolean {
  return weeklyWindowStatus(mock, nowMs) === 'open';
}

/**
 * Validate weekly open mock shape when flagging isWeeklyOpen=true.
 */
export function assertWeeklyMockShape(
  mock: Pick<
    MockRecord,
    'mode' | 'scope' | 'isPublished' | 'opensAt' | 'closesAt' | 'isWeeklyOpen'
  >
): { ok: true } | { ok: false; error: string } {
  if (!mock.isWeeklyOpen) return { ok: true };
  if (mock.mode !== 'fixed' || mock.scope !== 'full' || !mock.isPublished) {
    return { ok: false, error: WEEKLY_MOCK_SHAPE_ERROR };
  }
  if (!mock.opensAt || !mock.closesAt) {
    return { ok: false, error: WEEKLY_MOCK_SHAPE_ERROR };
  }
  const opens = Date.parse(mock.opensAt);
  const closes = Date.parse(mock.closesAt);
  if (Number.isNaN(opens) || Number.isNaN(closes) || opens >= closes) {
    return { ok: false, error: WEEKLY_MOCK_SHAPE_ERROR };
  }
  return { ok: true };
}

/**
 * Resolve which weekly mock to show on leaderboard / home:
 * prefer in-window isWeeklyOpen; else most recently closed weekly; else upcoming weekly.
 */
export function resolveWeeklyMock(
  mocks: MockRecord[],
  nowMs: number = Date.now()
): MockRecord | null {
  const weekly = mocks.filter((m) => m.isWeeklyOpen);
  if (weekly.length === 0) return null;

  const open = weekly.find((m) => weeklyWindowStatus(m, nowMs) === 'open');
  if (open) return open;

  const closed = weekly
    .filter((m) => weeklyWindowStatus(m, nowMs) === 'closed')
    .sort((a, b) => Date.parse(b.closesAt || '') - Date.parse(a.closesAt || ''));
  if (closed[0]) return closed[0];

  const upcoming = weekly
    .filter((m) => weeklyWindowStatus(m, nowMs) === 'upcoming')
    .sort((a, b) => Date.parse(a.opensAt || '') - Date.parse(b.opensAt || ''));
  return upcoming[0] || weekly[0] || null;
}

export type LeaderboardAttemptRow = {
  clerkUserId: string;
  overallScore: number;
  completedAt: string;
  displayName: string;
  avatarUrl: string;
  email?: string;
  /** Profile full name when stored on the attempt. */
  fullName?: string;
  /** Account username (email local-part); never the full email. */
  username?: string;
  /** Staff attempts: hidden from public board and student export ranks. */
  excludeFromLeaderboard?: boolean;
};

/**
 * Rank attempts: higher score first; earlier completion wins ties.
 * Includes score 0. Drops staff (`excludeFromLeaderboard`).
 */
export function rankWeeklyAttempts(
  rows: LeaderboardAttemptRow[],
  viewerClerkId?: string
): Array<LeaderboardAttemptRow & { rank: number; isYou: boolean }> {
  const eligible = rows.filter((r) => !r.excludeFromLeaderboard);
  const sorted = [...eligible].sort((a, b) => {
    const scoreA = Number(a.overallScore) || 0;
    const scoreB = Number(b.overallScore) || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    const timeA = Date.parse(a.completedAt) || 0;
    const timeB = Date.parse(b.completedAt) || 0;
    return timeA - timeB;
  });
  return sorted.map((r, idx) => ({
    ...r,
    overallScore: Number(r.overallScore) || 0,
    rank: idx + 1,
    isYou: Boolean(viewerClerkId && r.clerkUserId === viewerClerkId),
  }));
}

/** Locale datetime for professional exports (matches staff-facing UI). */
export function formatExportDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('en-US');
}

export function usernameFromEmail(email: string | undefined): string {
  const raw = (email || '').trim();
  if (!raw || !raw.includes('@')) return '';
  return raw.split('@')[0].trim();
}

export function fullNameFromProfile(name: string | undefined): string {
  const trimmed = (name || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'clerk user') return '';
  return trimmed;
}

/**
 * Resolve Full Name + Username for export without exposing email.
 * Prefers fields stored on the attempt; falls back for older reports.
 */
export function resolveExportIdentity(row: {
  fullName?: string;
  username?: string;
  displayName?: string;
  email?: string;
}): { fullName: string; username: string } {
  const fromEmail = usernameFromEmail(row.email);
  const username =
    (row.username || '').trim() || fromEmail || 'aspirant';
  const storedFull = (row.fullName || '').trim();
  const display = (row.displayName || '').trim();
  let fullName = storedFull;
  if (!fullName && display && display.toLowerCase() !== username.toLowerCase()) {
    fullName = display;
  }
  if (!fullName) fullName = display || username || 'Aspirant';
  return { fullName, username };
}

export type WeeklyExportMeta = {
  title: string;
  opensAt: string | null;
  closesAt: string | null;
  status: string;
  exportedAt: string;
};

export type WeeklyExportTableRow = {
  rank: number;
  fullName: string;
  username: string;
  /** Staff CSV only — never included in PDF/JSON public fields. */
  email?: string;
  score: number;
  completedAt: string;
};

/**
 * Staff CSV export with email (PDF uses a separate JSON path without email).
 * Meta preamble + comma-separated Rank, Full Name, Username, Email, Score, Completed At.
 */
export function formatWeeklyLeaderboardCsv(
  meta: WeeklyExportMeta,
  rows: WeeklyExportTableRow[]
): string {
  const escape = (v: string) => {
    const s = String(v ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const windowLine = [
    meta.opensAt ? `Opens: ${formatExportDateTime(meta.opensAt)}` : null,
    meta.closesAt ? `Closes: ${formatExportDateTime(meta.closesAt)}` : null,
    `Status: ${meta.status}`,
    `Exported: ${formatExportDateTime(meta.exportedAt)}`,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const preamble = [
    '# PrepX Nepal — Weekly Open Mock Results',
    `# Weekly Set: ${meta.title || 'Weekly mock'}`,
    `# ${windowLine}`,
  ];

  const headers = ['Rank', 'Full Name', 'Username', 'Email', 'Score', 'Completed At'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        String(r.rank),
        escape(r.fullName || 'Aspirant'),
        escape(r.username || 'aspirant'),
        escape((r.email || '').trim()),
        String(Number(r.score) || 0),
        escape(formatExportDateTime(r.completedAt)),
      ].join(',')
    );
  }

  return [...preamble, ...lines].join('\n') + '\n';
}

export function displayNameFromParts(name: string | undefined, email: string | undefined): string {
  const trimmed = fullNameFromProfile(name);
  if (trimmed) return trimmed;
  const user = usernameFromEmail(email);
  if (user) return user;
  return 'Aspirant';
}
