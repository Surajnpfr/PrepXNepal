/**
 * Site-wide Admin notices — pure domain (unit-tested without DB).
 */

export type NoticeRecord = {
  id: string;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaHrefTab: string | null;
  active: boolean;
  priority: number;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByClerkId: string | null;
  createdByName: string | null;
};

export function canManageNotices(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  return role === 'Admin';
}

export function isNoticeActive(notice: NoticeRecord, now: Date = new Date()): boolean {
  if (!notice.active) return false;
  if (notice.startsAt) {
    const start = new Date(notice.startsAt);
    if (!Number.isNaN(start.getTime()) && now < start) return false;
  }
  if (notice.expiresAt) {
    const end = new Date(notice.expiresAt);
    if (!Number.isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

/** Highest priority, then newest updatedAt. */
export function pickActiveNotice(
  notices: NoticeRecord[],
  now: Date = new Date()
): NoticeRecord | null {
  const active = notices.filter((n) => isNoticeActive(n, now));
  if (!active.length) return null;
  active.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
  return active[0];
}

export type CreateNoticeInput = {
  id: string;
  title: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaHrefTab?: string | null;
  active?: boolean;
  priority?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  createdByClerkId?: string | null;
  createdByName?: string | null;
};

export type UpdateNoticeInput = {
  title?: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaHrefTab?: string | null;
  active?: boolean;
  priority?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
};

function parseOptionalDate(
  raw: unknown,
  field: string
): { ok: true; value: string | null } | { ok: false; reason: string } {
  if (raw == null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string') return { ok: false, reason: `${field} must be a date string` };
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  if (Number.isNaN(new Date(trimmed).getTime())) {
    return { ok: false, reason: `${field} must be a valid date` };
  }
  return { ok: true, value: trimmed };
}

export function validateNoticeCreateInput(raw: {
  title?: unknown;
  body?: unknown;
  ctaLabel?: unknown;
  ctaHrefTab?: unknown;
  active?: unknown;
  priority?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
}): { ok: true; value: Omit<CreateNoticeInput, 'id'> } | { ok: false; reason: string } {
  const title =
    typeof raw.title === 'string' ? raw.title.trim().slice(0, 200) : '';
  if (!title) return { ok: false, reason: 'Title is required' };

  const body =
    typeof raw.body === 'string' && raw.body.trim()
      ? raw.body.trim().slice(0, 1000)
      : null;
  const ctaLabel =
    typeof raw.ctaLabel === 'string' && raw.ctaLabel.trim()
      ? raw.ctaLabel.trim().slice(0, 64)
      : null;
  const ctaHrefTab =
    typeof raw.ctaHrefTab === 'string' && raw.ctaHrefTab.trim()
      ? raw.ctaHrefTab.trim().slice(0, 64)
      : null;

  let priority = 0;
  if (raw.priority != null && raw.priority !== '') {
    const n = typeof raw.priority === 'number' ? raw.priority : Number(raw.priority);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { ok: false, reason: 'priority must be an integer' };
    }
    priority = n;
  }

  const starts = parseOptionalDate(raw.startsAt, 'startsAt');
  if (starts.ok === false) return starts;
  const expires = parseOptionalDate(raw.expiresAt, 'expiresAt');
  if (expires.ok === false) return expires;
  if (starts.value && expires.value && new Date(starts.value) > new Date(expires.value)) {
    return { ok: false, reason: 'startsAt must be before expiresAt' };
  }

  return {
    ok: true,
    value: {
      title,
      body,
      ctaLabel,
      ctaHrefTab,
      active: raw.active === false ? false : true,
      priority,
      startsAt: starts.value,
      expiresAt: expires.value,
    },
  };
}

export function validateNoticeUpdateInput(raw: {
  title?: unknown;
  body?: unknown;
  ctaLabel?: unknown;
  ctaHrefTab?: unknown;
  active?: unknown;
  priority?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
}): { ok: true; value: UpdateNoticeInput } | { ok: false; reason: string } {
  const patch: UpdateNoticeInput = {};

  if (raw.title !== undefined) {
    const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 200) : '';
    if (!title) return { ok: false, reason: 'Title cannot be empty' };
    patch.title = title;
  }
  if (raw.body !== undefined) {
    patch.body =
      typeof raw.body === 'string' && raw.body.trim()
        ? raw.body.trim().slice(0, 1000)
        : null;
  }
  if (raw.ctaLabel !== undefined) {
    patch.ctaLabel =
      typeof raw.ctaLabel === 'string' && raw.ctaLabel.trim()
        ? raw.ctaLabel.trim().slice(0, 64)
        : null;
  }
  if (raw.ctaHrefTab !== undefined) {
    patch.ctaHrefTab =
      typeof raw.ctaHrefTab === 'string' && raw.ctaHrefTab.trim()
        ? raw.ctaHrefTab.trim().slice(0, 64)
        : null;
  }
  if (raw.active !== undefined) {
    patch.active = Boolean(raw.active);
  }
  if (raw.priority !== undefined) {
    const n = typeof raw.priority === 'number' ? raw.priority : Number(raw.priority);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { ok: false, reason: 'priority must be an integer' };
    }
    patch.priority = n;
  }
  if (raw.startsAt !== undefined) {
    const starts = parseOptionalDate(raw.startsAt, 'startsAt');
    if (starts.ok === false) return starts;
    patch.startsAt = starts.value;
  }
  if (raw.expiresAt !== undefined) {
    const expires = parseOptionalDate(raw.expiresAt, 'expiresAt');
    if (expires.ok === false) return expires;
    patch.expiresAt = expires.value;
  }

  const start = patch.startsAt;
  const end = patch.expiresAt;
  if (start && end && new Date(start) > new Date(end)) {
    return { ok: false, reason: 'startsAt must be before expiresAt' };
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, reason: 'No fields to update' };
  }

  return { ok: true, value: patch };
}
