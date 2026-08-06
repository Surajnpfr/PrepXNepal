/**
 * SQLite referral repo smoke test (temp file).
 * Run: npx tsx scripts/test-referrals-repo.ts
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createSqliteReferralsRepo } from '../server/db/sqliteReferrals.ts';
import {
  REFERRAL_COMMISSION_RATE,
  computeCommissionAmountNpr,
} from '../server/referralsDomain.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const tmp = path.join(os.tmpdir(), `prepx-ref-test-${Date.now()}.sqlite`);
const repo = createSqliteReferralsRepo(tmp);
await repo.ensureSchema();

const link = await repo.ensureLink({
  ownerClerkId: 'user_mod_a',
  code: 'pxmoda1',
  ownerEmail: 'moda@example.com',
  ownerName: 'Mod A',
  ownerRole: 'Billing',
});
assert(link.code === 'pxmoda1', 'link code');

const first = await repo.attributeFirstTouch({
  referredClerkId: 'user_student',
  referrerClerkId: link.ownerClerkId,
  code: link.code,
});
assert(first.created === true, 'first attribution created');

const second = await repo.attributeFirstTouch({
  referredClerkId: 'user_student',
  referrerClerkId: 'user_other',
  code: 'othercode',
});
assert(second.created === false, 'first-touch wins');
assert(second.attribution.referrerClerkId === 'user_mod_a', 'referrer unchanged');

const amount = 149;
const insert = await repo.insertCommission({
  id: 'refc-claim-1',
  claimId: 'pay-claim-1',
  referredClerkId: 'user_student',
  referrerClerkId: 'user_mod_a',
  conversionAmountNpr: amount,
  commissionRate: REFERRAL_COMMISSION_RATE,
  commissionAmountNpr: computeCommissionAmountNpr(amount),
});
assert(insert.ok === true, 'commission inserted');
if (insert.ok) {
  assert(insert.commission.commissionAmountNpr === 45, 'commission 45');
}

const dup = await repo.insertCommission({
  id: 'refc-claim-1b',
  claimId: 'pay-claim-1',
  referredClerkId: 'user_student',
  referrerClerkId: 'user_mod_a',
  conversionAmountNpr: amount,
  commissionRate: REFERRAL_COMMISSION_RATE,
  commissionAmountNpr: 45,
});
assert(dup.ok === false && dup.reason === 'duplicate_claim', 'duplicate claim blocked');

const settled = await repo.settleCommission(
  insert.ok ? insert.commission.id : 'refc-claim-1',
  'user_admin'
);
assert(settled?.status === 'settled', 'settled');

await repo.close();
fs.unlinkSync(tmp);
console.log('test-referrals-repo: OK');
