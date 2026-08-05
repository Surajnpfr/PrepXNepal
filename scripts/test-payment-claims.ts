/**
 * Payment claims domain + SQLite FIFO tests.
 * Run: npx tsx scripts/test-payment-claims.ts
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  canModeratePaymentClaims,
  defaultEntitlementsForPlan,
  sortClaimsForQueue,
  type PaymentClaimRecord,
} from '../server/paymentsDomain.ts';
import { createSqlitePaymentClaimsRepo } from '../server/db/sqlitePaymentClaims.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canModeratePaymentClaims('Admin'), 'admin can moderate');
assert(canModeratePaymentClaims('Moderator (Billing)'), 'billing can moderate');
assert(!canModeratePaymentClaims('Moderator (Questions)'), 'q mod cannot');
assert(!canModeratePaymentClaims('Student'), 'student cannot');

assert(defaultEntitlementsForPlan('Unlimited').mocksGranted === null, 'unlimited mocks');
assert(defaultEntitlementsForPlan('Unlimited').coinsGranted === 500, 'unlimited coins');
assert(defaultEntitlementsForPlan('Premium').coinsGranted === 100, 'premium coins');
assert(defaultEntitlementsForPlan('Premium').mocksGranted === 10, 'premium mocks seed');
assert(defaultEntitlementsForPlan('Free').mocksGranted === 3, 'free mocks seed');
assert(defaultEntitlementsForPlan('Free', { freeMocks: 4, premiumMocks: 12 }).mocksGranted === 4, 'free override');
assert(
  defaultEntitlementsForPlan('Premium', { freeMocks: 1, premiumMocks: 25 }).mocksGranted === 25,
  'premium override'
);

const base = {
  userId: 'usr-clerk-a',
  clerkUserId: 'user_a',
  userName: 'A',
  userEmail: 'a@ex.com',
  planCode: 'Premium',
  amountNpr: 149,
  listAmountNpr: 149,
  promoCode: null,
  promoDiscountNpr: 0,
  paymentMethod: 'Fonepay' as const,
  transactionRef: 'REF1',
  screenshotUrl: '',
  userNotes: null,
  moderatorNotes: null,
  verifiedAt: null,
  verifiedBy: null,
  verifiedByClerkId: null,
};

const sorted = sortClaimsForQueue([
  {
    ...base,
    id: '1',
    status: 'approved',
    submittedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    ...base,
    id: '2',
    status: 'pending',
    submittedAt: '2026-01-01T12:00:00.000Z',
  },
  {
    ...base,
    id: '3',
    status: 'pending',
    submittedAt: '2026-01-01T11:00:00.000Z',
  },
] as PaymentClaimRecord[]);

assert(sorted[0].id === '3' && sorted[1].id === '2', 'pending FIFO oldest first');
assert(sorted[2].id === '1', 'resolved after pending');

const tmp = path.join(os.tmpdir(), `prepx-claims-${Date.now()}.sqlite`);
const repo = createSqlitePaymentClaimsRepo(tmp);
await repo.ensureSchema();

const c1 = await repo.insert({
  id: 'pay-1',
  userId: 'usr-clerk-s',
  clerkUserId: 'user_s',
  userName: 'Stu',
  userEmail: 's@ex.com',
  planCode: 'Premium',
  amountNpr: 149,
  paymentMethod: 'Khalti',
  transactionRef: 'TX-1',
  screenshotUrl: '',
});
assert(c1.status === 'pending', 'inserted pending');

const approved = await repo.resolve('pay-1', {
  status: 'approved',
  verifiedBy: 'Mod',
  verifiedByClerkId: 'user_mod',
});
assert(approved?.status === 'approved', 'approved');

const again = await repo.resolve('pay-1', {
  status: 'rejected',
  verifiedBy: 'Mod2',
  verifiedByClerkId: 'user_mod2',
});
assert(again === null, 'cannot re-resolve');

const c2 = await repo.insert({
  id: 'pay-2',
  userId: 'usr-clerk-s',
  clerkUserId: 'user_s',
  userName: 'Stu',
  userEmail: 's@ex.com',
  planCode: 'Premium',
  amountNpr: 149,
  paymentMethod: 'eSewa',
  transactionRef: 'TX-EDIT',
  screenshotUrl: '',
});
assert(c2.status === 'pending', 'second claim pending');

const updated = await repo.updatePending('pay-2', {
  planCode: 'Unlimited',
  amountNpr: 999,
  transactionRef: 'TX-EDITED',
  userNotes: 'staff corrected amount',
  promoCode: 'SAVE10',
  promoDiscountNpr: 50,
  listAmountNpr: 1049,
});
assert(updated?.planCode === 'Unlimited', 'plan updated');
assert(updated?.amountNpr === 999, 'amount updated');
assert(updated?.transactionRef === 'TX-EDITED', 'ref updated');
assert(updated?.userNotes === 'staff corrected amount', 'notes updated');
assert(updated?.promoCode === 'SAVE10', 'promo updated');
assert(updated?.listAmountNpr === 1049, 'list amount updated');
assert(updated?.status === 'pending', 'still pending after edit');

const resetList = await repo.updatePending('pay-2', { listAmountNpr: null });
// Domain maps null list → payable amount when reading.
assert(resetList?.listAmountNpr === resetList?.amountNpr, 'null list falls back to amount');

const noEditResolved = await repo.updatePending('pay-1', { amountNpr: 1 });
assert(noEditResolved === null, 'cannot edit resolved claim');

const deleted = await repo.deletePending('pay-2');
assert(deleted === true, 'pending deleted');
assert((await repo.getById('pay-2')) === null, 'gone after delete');

const noDeleteResolved = await repo.deletePending('pay-1');
assert(noDeleteResolved === false, 'cannot delete resolved claim');

const notesOnApproved = await repo.updateUserNotes(
  'pay-1',
  'Staff follow-up note after approval'
);
assert(notesOnApproved?.status === 'approved', 'approved status preserved');
assert(
  notesOnApproved?.userNotes === 'Staff follow-up note after approval',
  'remarks editable on approved'
);

const clearNotes = await repo.updateUserNotes('pay-1', null);
assert(clearNotes?.userNotes == null, 'remarks cleared on approved');

await repo.close();
fs.unlinkSync(tmp);
console.log('test-payment-claims: OK');
