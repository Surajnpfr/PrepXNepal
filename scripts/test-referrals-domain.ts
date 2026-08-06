/**
 * Referral domain + policy regression tests (no live Clerk/DB).
 * Run: npx tsx scripts/test-referrals-domain.ts
 */
import {
  REFERRAL_COMMISSION_RATE,
  canRecordReferralCommission,
  canSettleReferralCommission,
  computeCommissionAmountNpr,
  isReferralStaffRole,
  normalizeReferralCode,
  sumCommissionTotals,
} from '../server/referralsDomain.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(REFERRAL_COMMISSION_RATE === 0.3, 'rate is 30%');
assert(computeCommissionAmountNpr(149) === 45, '149 * 0.3 rounds to 45');
assert(computeCommissionAmountNpr(100) === 30, '100 * 0.3 = 30');
assert(computeCommissionAmountNpr(1) === 0, '1 * 0.3 rounds to 0');

try {
  computeCommissionAmountNpr(-1);
  throw new Error('expected negative amount to throw');
} catch (err: any) {
  assert(String(err.message).includes('non-negative'), 'rejects negative amount');
}

assert(normalizeReferralCode('PxAb12') === 'pxab12', 'normalize lowercases');
assert(normalizeReferralCode('ab') === null, 'too short rejected');
assert(normalizeReferralCode('bad code!') === null, 'invalid chars rejected');

assert(isReferralStaffRole('Admin'), 'admin is staff');
assert(isReferralStaffRole('Content Manager'), 'content manager is staff');
assert(isReferralStaffRole('Billing'), 'billing is staff');
assert(isReferralStaffRole('QAD'), 'qad is staff');
assert(isReferralStaffRole('Moderator (Questions)'), 'legacy questions mod aliases');
assert(!isReferralStaffRole('Student'), 'student not staff');
assert(isReferralStaffRole('Student', true), 'bootstrap elevates');

assert(canRecordReferralCommission('Admin'), 'admin can record');
assert(canRecordReferralCommission('Billing'), 'billing can record');
assert(canRecordReferralCommission('Moderator (Billing)'), 'legacy billing aliases');
assert(!canRecordReferralCommission('Content Manager'), 'content manager cannot record');
assert(!canRecordReferralCommission('Student'), 'student cannot record');

assert(canSettleReferralCommission('Admin'), 'admin can settle');
assert(!canSettleReferralCommission('Billing'), 'billing cannot settle');
assert(canSettleReferralCommission('Student', true), 'bootstrap can settle');

const totals = sumCommissionTotals([
  {
    conversionAmountNpr: 149,
    commissionAmountNpr: 45,
    status: 'pending',
  },
  {
    conversionAmountNpr: 100,
    commissionAmountNpr: 30,
    status: 'settled',
  },
]);
assert(totals.conversionCount === 2, 'count');
assert(totals.totalConversionNpr === 249, 'gross');
assert(totals.totalCommissionNpr === 75, 'commission total');
assert(totals.pendingCommissionNpr === 45, 'pending');
assert(totals.settledCommissionNpr === 30, 'settled');

console.log('test-referrals-domain: OK');
