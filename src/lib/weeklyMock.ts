/** Client helpers for weekly open mock window status. */

export type WeeklyWindowStatus = 'open' | 'closed' | 'upcoming' | 'unscheduled';

export function weeklyWindowStatus(
  opensAt?: string | null,
  closesAt?: string | null,
  nowMs: number = Date.now()
): WeeklyWindowStatus {
  if (!opensAt || !closesAt) return 'unscheduled';
  const opens = Date.parse(opensAt);
  const closes = Date.parse(closesAt);
  if (Number.isNaN(opens) || Number.isNaN(closes)) return 'unscheduled';
  if (nowMs < opens) return 'upcoming';
  if (nowMs > closes) return 'closed';
  return 'open';
}

export function resolveWeeklyMockFromList<T extends {
  id: string;
  title: string;
  isWeeklyOpen?: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
}>(mocks: T[], nowMs: number = Date.now()): T | null {
  const weekly = mocks.filter((m) => m.isWeeklyOpen);
  if (weekly.length === 0) return null;
  const open = weekly.find((m) => weeklyWindowStatus(m.opensAt, m.closesAt, nowMs) === 'open');
  if (open) return open;
  const closed = weekly
    .filter((m) => weeklyWindowStatus(m.opensAt, m.closesAt, nowMs) === 'closed')
    .sort((a, b) => Date.parse(b.closesAt || '') - Date.parse(a.closesAt || ''));
  if (closed[0]) return closed[0];
  const upcoming = weekly
    .filter((m) => weeklyWindowStatus(m.opensAt, m.closesAt, nowMs) === 'upcoming')
    .sort((a, b) => Date.parse(a.opensAt || '') - Date.parse(b.opensAt || ''));
  return upcoming[0] || weekly[0] || null;
}

export function formatWindowLabel(opensAt?: string | null, closesAt?: string | null): string {
  if (!opensAt || !closesAt) return 'Window not set';
  const o = new Date(opensAt);
  const c = new Date(closesAt);
  if (Number.isNaN(o.getTime()) || Number.isNaN(c.getTime())) return 'Invalid window';
  return `${o.toLocaleString()} → ${c.toLocaleString()}`;
}
