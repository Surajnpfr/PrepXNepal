/**
 * Promo codes domain + SQLite repo tests.
 * Run: npx tsx scripts/test-promo-codes.ts
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  canManagePromoCodes,
  computePromoDiscount,
  evaluatePromoForCheckout,
  normalizePromoCode,
  validatePromoCodeCreateInput,
  type PromoCodeRecord,
} from '../server/promoCodesDomain.ts';
import { createSqlitePromoCodesRepo } from '../server/db/sqlitePromoCodes.ts';
import { createSqlitePaymentClaimsRepo } from '../server/db/sqlitePaymentClaims.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canManagePromoCodes('Admin'), 'admin can manage');
assert(canManagePromoCodes(undefined, true), 'bootstrap can manage');
assert(!canManagePromoCodes('Moderator (Billing)'), 'billing cannot manage');
assert(!canManagePromoCodes('Student'), 'student cannot manage');

assert(normalizePromoCode(' cee20 ') === 'CEE20', 'normalize upper');
assert(normalizePromoCode('ab') === null, 'too short');
assert(normalizePromoCode('BAD CODE!') === null, 'invalid chars');

const pct = computePromoDiscount(149, 'percent', 20);
assert(pct.discountNpr === 30 && pct.payableNpr === 119, `percent off got ${JSON.stringify(pct)}`);

const fixed = computePromoDiscount(149, 'fixed', 50);
assert(fixed.discountNpr === 50 && fixed.payableNpr === 99, 'fixed off');

const almostFree = computePromoDiscount(100, 'percent', 100);
assert(almostFree.payableNpr === 1 && almostFree.discountNpr === 99, 'keep min payable 1');

const parsed = validatePromoCodeCreateInput({
  code: 'LAUNCH20',
  discountType: 'percent',
  discountValue: 20,
  applicablePlanCodes: 'Premium, Unlimited',
  maxRedemptions: 100,
});
assert(parsed.ok, 'create input ok');
if (parsed.ok) {
  assert(parsed.value.code === 'LAUNCH20', 'code');
  assert(parsed.value.applicablePlanCodes.length === 2, 'plans');
}

const basePromo: PromoCodeRecord = {
  id: 'p1',
  code: 'LAUNCH20',
  description: null,
  discountType: 'percent',
  discountValue: 20,
  applicablePlanCodes: ['Premium'],
  maxRedemptions: 2,
  redemptionCount: 0,
  startsAt: null,
  expiresAt: null,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdByClerkId: null,
  createdByName: null,
};

const ok = evaluatePromoForCheckout(basePromo, { planCode: 'Premium', listAmountNpr: 149 });
assert(ok.ok && ok.payableNpr === 119, 'apply premium');

const wrongPlan = evaluatePromoForCheckout(basePromo, {
  planCode: 'Unlimited',
  listAmountNpr: 999,
});
assert(!wrongPlan.ok, 'plan mismatch');

const exhausted = evaluatePromoForCheckout(
  { ...basePromo, redemptionCount: 2 },
  { planCode: 'Premium', listAmountNpr: 149 }
);
assert(!exhausted.ok, 'exhausted');

const tmp = path.join(os.tmpdir(), `prepx-promo-${Date.now()}.sqlite`);
const promoRepo = createSqlitePromoCodesRepo(tmp);
const claimsRepo = createSqlitePaymentClaimsRepo(tmp);
await promoRepo.ensureSchema();
await claimsRepo.ensureSchema();

const created = await promoRepo.insert({
  id: 'promo-1',
  code: 'CEE10',
  discountType: 'fixed',
  discountValue: 10,
  applicablePlanCodes: [],
  maxRedemptions: 1,
  active: true,
});
assert(created.code === 'CEE10', 'insert');

const byCode = await promoRepo.getByCode('CEE10');
assert(byCode?.id === 'promo-1', 'getByCode');

const claim = await claimsRepo.insert({
  id: 'pay-promo-1',
  userId: 'usr-1',
  clerkUserId: 'user_1',
  userName: 'Stu',
  userEmail: 's@ex.com',
  planCode: 'Premium',
  amountNpr: 139,
  listAmountNpr: 149,
  promoCode: 'CEE10',
  promoDiscountNpr: 10,
  paymentMethod: 'Fonepay',
  transactionRef: 'REF-P',
  screenshotUrl: 'data:image/png;base64,xx',
});
assert(claim.promoCode === 'CEE10' && claim.amountNpr === 139, 'claim stores promo');
assert(claim.listAmountNpr === 149, 'list amount');

const bumped = await promoRepo.tryIncrementRedemption('CEE10');
assert(bumped?.redemptionCount === 1, 'redeem once');
const again = await promoRepo.tryIncrementRedemption('CEE10');
assert(again === null, 'max redemptions blocks second');

await promoRepo.close();
await claimsRepo.close();
fs.unlinkSync(tmp);

console.log('promo codes OK');
