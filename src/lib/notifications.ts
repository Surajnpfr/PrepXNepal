import type {
  AppNotification,
  AttemptReport,
  CoinTransaction,
  MockTest,
  NotificationKind,
  PaymentClaim,
} from '../types';

const STORAGE_KEY = 'prepx_notifications';
const SEEN_MOCKS_KEY = 'prepx_seen_mock_ids';
const MAX_NOTIFICATIONS = 50;

function seenMocksKeyFor(userId: string): string {
  return `${SEEN_MOCKS_KEY}:${userId}`;
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotifications(list: AppNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_NOTIFICATIONS)));
}

export function createNotification(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  desc: string;
  hrefTab?: string;
  refId?: string;
  read?: boolean;
  createdAt?: string;
}): AppNotification {
  return {
    id: `ntf-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    desc: input.desc,
    createdAt: input.createdAt || new Date().toISOString(),
    read: input.read ?? false,
    hrefTab: input.hrefTab,
    refId: input.refId,
  };
}

/** Prepends a notification; dedupes by kind+refId when refId is set. */
export function prependNotification(
  list: AppNotification[],
  next: AppNotification
): AppNotification[] {
  if (next.refId) {
    const exists = list.some(
      (n) => n.userId === next.userId && n.kind === next.kind && n.refId === next.refId
    );
    if (exists) return list;
  }
  return [next, ...list].slice(0, MAX_NOTIFICATIONS);
}

export function formatRelativeTime(isoOrLocale: string, now = Date.now()): string {
  const parsed = Date.parse(isoOrLocale);
  if (Number.isNaN(parsed)) return isoOrLocale;
  const diffSec = Math.max(0, Math.floor((now - parsed) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(parsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * When the inbox is empty, seed from recent local activity so Progress/Coins/Payments
 * already completed still show as real notifications (not hardcoded demos).
 */
export function bootstrapFromActivity(input: {
  userId: string;
  reports: AttemptReport[];
  transactions: CoinTransaction[];
  claims: PaymentClaim[];
}): AppNotification[] {
  const out: AppNotification[] = [];

  input.reports.slice(0, 5).forEach((r) => {
    out.push(
      createNotification({
        userId: input.userId,
        kind: 'mock_complete',
        title: `Scored ${r.overallScore}/${r.maxScore} on ${r.mockTitle}`,
        desc: `Accuracy ${r.accuracyPercentage}%`,
        hrefTab: 'reports',
        refId: r.id,
        createdAt: toIsoGuess(r.completedAt),
        read: true,
      })
    );
  });

  input.transactions.slice(0, 5).forEach((t) => {
    const gained = t.delta > 0;
    out.push(
      createNotification({
        userId: input.userId,
        kind: 'coins',
        title: gained ? `+${t.delta} Study Coins` : `${t.delta} Study Coins`,
        desc: t.reason,
        hrefTab: 'coins',
        refId: t.id,
        createdAt: toIsoGuess(t.createdAt),
        read: true,
      })
    );
  });

  input.claims.slice(0, 3).forEach((c) => {
    const statusRef =
      c.status === 'approved'
        ? `${c.id}-approved`
        : c.status === 'rejected'
          ? `${c.id}-rejected`
          : `${c.id}-pending`;
    out.push(
      createNotification({
        userId: input.userId,
        kind: 'payment',
        title:
          c.status === 'approved'
            ? 'Payment claim approved'
            : c.status === 'rejected'
              ? 'Payment claim rejected'
              : 'Payment claim submitted',
        desc:
          c.status === 'rejected' && c.moderatorNotes
            ? `${c.planCode} · Rs. ${c.amountNpr} · ${c.moderatorNotes}`
            : `${c.planCode} · Rs. ${c.amountNpr} · ${c.status}`,
        hrefTab: 'payment',
        refId: statusRef,
        createdAt: toIsoGuess(c.verifiedAt || c.submittedAt),
        read: c.status !== 'pending',
      })
    );
  });

  return out
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_NOTIFICATIONS);
}

function toIsoGuess(value: string): string {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

/**
 * Derive payment notifications from server claims on the *student* device.
 * Staff approve/reject cannot write into another browser's localStorage.
 * Status transitions use distinct refIds so approve/reject still notify after submit.
 */
export function syncPaymentClaimNotifications(
  list: AppNotification[],
  input: {
    userId: string;
    clerkUserId?: string;
    claims: PaymentClaim[];
  }
): AppNotification[] {
  const mine = input.claims.filter(
    (c) =>
      c.userId === input.userId ||
      (input.clerkUserId && c.clerkUserId === input.clerkUserId)
  );
  let next = list;
  for (const claim of mine) {
    const statusRef =
      claim.status === 'approved'
        ? `${claim.id}-approved`
        : claim.status === 'rejected'
          ? `${claim.id}-rejected`
          : `${claim.id}-pending`;

    const title =
      claim.status === 'approved'
        ? 'Payment claim approved'
        : claim.status === 'rejected'
          ? 'Payment claim rejected'
          : 'Payment claim submitted';

    const desc =
      claim.status === 'rejected' && claim.moderatorNotes?.trim()
        ? `${claim.planCode} · Rs. ${claim.amountNpr} · ${claim.moderatorNotes}`
        : claim.status === 'approved'
          ? `${claim.planCode} plan activated · Rs. ${claim.amountNpr}`
          : `${claim.planCode} · Rs. ${claim.amountNpr} · pending review`;

    next = prependNotification(
      next,
      createNotification({
        userId: input.userId,
        kind: 'payment',
        title,
        desc,
        hrefTab: 'payment',
        refId: statusRef,
        createdAt: toIsoGuess(claim.verifiedAt || claim.submittedAt),
        read: false,
      })
    );
  }
  return next;
}

export function loadSeenMockIds(userId?: string): string[] {
  try {
    const key = userId ? seenMocksKeyFor(userId) : SEEN_MOCKS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Migrate legacy global key once when a userId is provided.
      if (userId) {
        const legacy = localStorage.getItem(SEEN_MOCKS_KEY);
        if (legacy) {
          localStorage.setItem(key, legacy);
          return JSON.parse(legacy) as string[];
        }
      }
      return [];
    }
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSeenMockIds(ids: string[], userId?: string): void {
  const key = userId ? seenMocksKeyFor(userId) : SEEN_MOCKS_KEY;
  localStorage.setItem(key, JSON.stringify(ids));
}

/** Returns notifications for newly appeared fixed mocks; updates seen-id set. */
export function detectNewCatalogMocks(
  userId: string,
  mocks: MockTest[]
): { notifications: AppNotification[]; seenIds: string[] } {
  const fixed = mocks.filter((m) => m.mode === 'fixed' || !m.mode);
  const currentIds = fixed.map((m) => m.id);
  const seen = loadSeenMockIds(userId);

  if (seen.length === 0) {
    // First catalog load — remember without flooding inbox.
    return { notifications: [], seenIds: currentIds };
  }

  const seenSet = new Set(seen);
  const fresh = fixed.filter((m) => !seenSet.has(m.id));
  const notifications = fresh.slice(0, 5).map((m) =>
    createNotification({
      userId,
      kind: 'catalog',
      title: `New mock: ${m.title}`,
      desc: `${m.totalQuestions || m.questions?.length || 200} Qs · open catalog to start`,
      hrefTab: 'catalog',
      refId: m.id,
    })
  );

  return { notifications, seenIds: Array.from(new Set([...seen, ...currentIds])) };
}
