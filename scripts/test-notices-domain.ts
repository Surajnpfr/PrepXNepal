/**
 * Notices domain unit tests (no DB).
 * Run: npx tsx scripts/test-notices-domain.ts
 */
import {
  canManageNotices,
  isNoticeActive,
  pickActiveNotice,
  validateNoticeCreateInput,
  validateNoticeUpdateInput,
  type NoticeRecord,
} from '../server/noticesDomain.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canManageNotices('Admin'), 'admin can manage');
assert(canManageNotices(undefined, true), 'bootstrap can manage');
assert(!canManageNotices('Billing'), 'billing cannot manage');
assert(!canManageNotices('Student'), 'student cannot manage');

const now = new Date('2026-06-15T12:00:00.000Z');

function baseNotice(overrides: Partial<NoticeRecord> = {}): NoticeRecord {
  return {
    id: 'n1',
    title: 'Hello',
    body: null,
    ctaLabel: null,
    ctaHrefTab: null,
    active: true,
    priority: 0,
    startsAt: null,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdByClerkId: null,
    createdByName: null,
    ...overrides,
  };
}

assert(isNoticeActive(baseNotice(), now), 'always-on active');
assert(!isNoticeActive(baseNotice({ active: false }), now), 'inactive flag');
assert(
  !isNoticeActive(baseNotice({ startsAt: '2026-07-01T00:00:00.000Z' }), now),
  'before start'
);
assert(
  isNoticeActive(baseNotice({ startsAt: '2026-06-01T00:00:00.000Z' }), now),
  'after start'
);
assert(
  !isNoticeActive(baseNotice({ expiresAt: '2026-06-01T00:00:00.000Z' }), now),
  'after expiry'
);
assert(
  isNoticeActive(baseNotice({ expiresAt: '2026-07-01T00:00:00.000Z' }), now),
  'before expiry'
);
assert(
  isNoticeActive(
    baseNotice({
      startsAt: '2026-06-01T00:00:00.000Z',
      expiresAt: '2026-07-01T00:00:00.000Z',
    }),
    now
  ),
  'inside window'
);

const low = baseNotice({
  id: 'low',
  priority: 1,
  updatedAt: '2026-06-14T00:00:00.000Z',
});
const high = baseNotice({
  id: 'high',
  priority: 10,
  updatedAt: '2026-06-01T00:00:00.000Z',
});
const highNewer = baseNotice({
  id: 'high-newer',
  priority: 10,
  updatedAt: '2026-06-14T12:00:00.000Z',
});
const inactiveHigh = baseNotice({ id: 'off', priority: 99, active: false });

assert(pickActiveNotice([low, high, inactiveHigh], now)?.id === 'high', 'pick by priority');
assert(
  pickActiveNotice([high, highNewer], now)?.id === 'high-newer',
  'tie-break newer updatedAt'
);
assert(pickActiveNotice([inactiveHigh], now) === null, 'none active');

const created = validateNoticeCreateInput({
  title: '  Sale  ',
  body: ' 20% off ',
  ctaLabel: 'Buy',
  ctaHrefTab: 'payment',
  priority: 5,
  active: true,
});
assert(created.ok, 'create ok');
if (created.ok) {
  assert(created.value.title === 'Sale', 'trim title');
  assert(created.value.body === '20% off', 'trim body');
  assert(created.value.priority === 5, 'priority');
}

const missingTitle = validateNoticeCreateInput({ title: '   ' });
assert(!missingTitle.ok, 'title required');

const badPriority = validateNoticeCreateInput({ title: 'x', priority: 1.5 });
assert(!badPriority.ok, 'priority integer');

const badWindow = validateNoticeCreateInput({
  title: 'x',
  startsAt: '2026-07-01T00:00:00.000Z',
  expiresAt: '2026-06-01T00:00:00.000Z',
});
assert(!badWindow.ok, 'starts before expires');

const updated = validateNoticeUpdateInput({ title: 'Updated', active: false });
assert(updated.ok, 'update ok');
if (updated.ok) {
  assert(updated.value.title === 'Updated', 'update title');
  assert(updated.value.active === false, 'update active');
}

const emptyPatch = validateNoticeUpdateInput({});
assert(!emptyPatch.ok, 'empty patch rejected');

const emptyTitle = validateNoticeUpdateInput({ title: '  ' });
assert(!emptyTitle.ok, 'empty title rejected');

console.log('test-notices-domain: all assertions passed');
