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

await repo.close();
fs.unlinkSync(tmp);
console.log('test-payment-claims: OK');
