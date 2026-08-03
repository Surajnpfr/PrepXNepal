/**
 * Notification sync tests (payment claim → student inbox).
 * Run: npx tsx scripts/test-notifications-sync.ts
 */
import {
  createNotification,
  prependNotification,
  syncPaymentClaimNotifications,
} from '../src/lib/notifications.ts';
import type { PaymentClaim } from '../src/types.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const userId = 'usr-clerk-student1';
const clerkUserId = 'user_student1';

const pending: PaymentClaim = {
  id: 'pay-1',
  userId,
  clerkUserId,
  userName: 'Student',
  userEmail: 's@ex.com',
  planCode: 'Premium',
  amountNpr: 149,
  paymentMethod: 'Fonepay',
  transactionRef: 'TX1',
  screenshotUrl: 'data:image/png;base64,xx',
  status: 'pending',
  submittedAt: new Date().toISOString(),
};

let list = syncPaymentClaimNotifications([], {
  userId,
  clerkUserId,
  claims: [pending],
});
assert(list.length === 1, 'pending notif created');
assert(list[0].refId === 'pay-1-pending', 'pending ref');
assert(list[0].read === false, 'unread');

list = syncPaymentClaimNotifications(list, {
  userId,
  clerkUserId,
  claims: [pending],
});
assert(list.length === 1, 'pending deduped');

const approved = { ...pending, status: 'approved' as const, verifiedAt: new Date().toISOString() };
list = syncPaymentClaimNotifications(list, {
  userId,
  clerkUserId,
  claims: [approved],
});
assert(list.length === 2, 'approved creates second notif');
assert(list.some((n) => n.refId === 'pay-1-approved'), 'approved ref present');
assert(list.find((n) => n.refId === 'pay-1-approved')?.title.includes('approved'), 'approved title');

const rejected = {
  ...pending,
  status: 'rejected' as const,
  moderatorNotes: 'Wrong amount',
  verifiedAt: new Date().toISOString(),
};
list = syncPaymentClaimNotifications(list, {
  userId,
  clerkUserId,
  claims: [rejected],
});
assert(list.some((n) => n.refId === 'pay-1-rejected'), 'rejected ref');
assert(
  list.find((n) => n.refId === 'pay-1-rejected')?.desc.includes('Wrong amount'),
  'rejection reason in desc'
);

// Other user's claims ignored
list = syncPaymentClaimNotifications([], {
  userId,
  clerkUserId,
  claims: [{ ...pending, userId: 'other', clerkUserId: 'user_other' }],
});
assert(list.length === 0, 'other user ignored');

const base = prependNotification(
  [],
  createNotification({
    userId,
    kind: 'payment',
    title: 'x',
    desc: 'y',
    refId: 'pay-1-pending',
  })
);
const again = prependNotification(
  base,
  createNotification({
    userId,
    kind: 'payment',
    title: 'x2',
    desc: 'y2',
    refId: 'pay-1-pending',
  })
);
assert(again.length === 1, 'prepend dedupe');

console.log('test-notifications-sync: OK');
