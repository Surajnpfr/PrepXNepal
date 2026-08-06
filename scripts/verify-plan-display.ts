/**
 * Verifies plan display labels without changing entitlement tier codes.
 * Run: npx tsx scripts/verify-plan-display.ts
 */
import assert from 'node:assert/strict';
import {
  PLAN_DISPLAY_NAMES,
  applyPlanDisplayNames,
  planDisplayName,
} from '../src/lib/planDisplay';
import {
  isPaidPlanSeasonValid,
  isSubscriptionSeasonActive,
  SUBSCRIPTION_VALID_UNTIL_ISO,
  SUBSCRIPTION_VALIDITY_LABEL,
} from '../src/lib/examSchedule';
import { applyEntitlementsToPlans, PLAN_ENTITLEMENTS_SEED } from '../src/lib/planEntitlements';
import type { PricingPlan } from '../src/types';

assert.equal(planDisplayName('Free'), 'Free');
assert.equal(planDisplayName('Premium'), 'Standard');
assert.equal(planDisplayName('Unlimited'), 'Premium');
assert.equal(PLAN_DISPLAY_NAMES.Premium, 'Standard');
assert.equal(PLAN_DISPLAY_NAMES.Unlimited, 'Premium');

const legacy: PricingPlan[] = [
  {
    id: 'plan-free',
    code: 'Free',
    name: 'Free Aspirant',
    tier: 'Free',
    priceNpr: 0,
    mocksGranted: 3,
    coinsGranted: 20,
    description: '',
    features: [],
    status: 'active',
  },
  {
    id: 'plan-premium-standard',
    code: 'Premium',
    name: 'Standard Premium',
    tier: 'Premium',
    priceNpr: 149,
    mocksGranted: 15,
    coinsGranted: 100,
    description: '',
    features: [],
    status: 'active',
  },
  {
    id: 'plan-unlimited-elite',
    code: 'Unlimited',
    name: 'Unlimited Elite Pass',
    tier: 'Unlimited',
    priceNpr: 999,
    mocksGranted: null,
    coinsGranted: 500,
    description: '',
    features: [],
    status: 'active',
  },
];

const migrated = applyPlanDisplayNames(legacy);
assert.equal(migrated[0].name, 'Free');
assert.equal(migrated[0].tier, 'Free');
assert.equal(migrated[0].code, 'Free');
assert.equal(migrated[1].name, 'Standard');
assert.equal(migrated[1].tier, 'Premium');
assert.equal(migrated[1].code, 'Premium');
assert.equal(migrated[2].name, 'Premium');
assert.equal(migrated[2].tier, 'Unlimited');
assert.equal(migrated[2].code, 'Unlimited');

assert.equal(SUBSCRIPTION_VALID_UNTIL_ISO, '2026-11-30');
assert.ok(SUBSCRIPTION_VALIDITY_LABEL.includes('CEE 2026'));
assert.equal(isPaidPlanSeasonValid('Free', new Date('2027-01-01')), true);
assert.equal(isPaidPlanSeasonValid('Premium', new Date('2026-11-30T12:00:00')), true);
assert.equal(isPaidPlanSeasonValid('Unlimited', new Date('2026-12-01')), false);
assert.equal(isSubscriptionSeasonActive(new Date('2026-06-01')), true);

const withBenefits = applyEntitlementsToPlans(legacy, PLAN_ENTITLEMENTS_SEED);
assert.ok(
  withBenefits[1].features.some((f) => /Valid until CEE 2026/i.test(f)),
  'Standard plan lists CEE 2026 validity'
);
assert.ok(
  withBenefits[2].features.some((f) => /Valid until CEE 2026/i.test(f)),
  'Premium plan lists CEE 2026 validity'
);
assert.ok(
  !withBenefits[0].features.some((f) => /Valid until CEE 2026/i.test(f)),
  'Free plan does not claim paid season validity'
);

console.log('OK: display Free/Standard/Premium; tier codes Free/Premium/Unlimited unchanged');
console.log('OK: subscription validity until CEE 2026');
