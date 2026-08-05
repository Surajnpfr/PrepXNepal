/**
 * Plan entitlements domain tests.
 * Run: npx tsx scripts/test-plan-entitlements.ts
 */
import assert from 'node:assert/strict';
import {
  PLAN_ENTITLEMENTS_SEED,
  defaultMocksForPlan,
  parsePlanEntitlements,
} from '../server/planEntitlementsDomain.ts';

assert.equal(PLAN_ENTITLEMENTS_SEED.freeMocks, 3);
assert.equal(PLAN_ENTITLEMENTS_SEED.premiumMocks, 15);
assert.equal(defaultMocksForPlan('Free'), 3);
assert.equal(defaultMocksForPlan('Premium'), 15);
assert.equal(defaultMocksForPlan('Unlimited'), null);

const ok = parsePlanEntitlements({ freeMocks: 5, premiumMocks: 20 });
assert.equal(ok.ok, true);
if (ok.ok) {
  assert.deepEqual(ok.value, { freeMocks: 5, premiumMocks: 20 });
}

const zero = parsePlanEntitlements({ freeMocks: 0, premiumMocks: 0 });
assert.equal(zero.ok, true);

const max = parsePlanEntitlements({ freeMocks: 10_000, premiumMocks: 10_000 });
assert.equal(max.ok, true);

assert.equal(parsePlanEntitlements({ freeMocks: -1, premiumMocks: 10 }).ok, false);
assert.equal(parsePlanEntitlements({ freeMocks: 1, premiumMocks: 10_001 }).ok, false);
assert.equal(parsePlanEntitlements({ freeMocks: 1.5, premiumMocks: 10 }).ok, false);
assert.equal(parsePlanEntitlements({ freeMocks: '1', premiumMocks: 10 }).ok, false);
assert.equal(parsePlanEntitlements(null).ok, false);
assert.equal(parsePlanEntitlements({}).ok, false);

console.log('planEntitlementsDomain tests passed');
