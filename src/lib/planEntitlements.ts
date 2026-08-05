/**
 * Client-side seed for Free/Premium mock defaults (mirrors server/planEntitlementsDomain).
 * Runtime Free/Premium values come from GET /api/plan-entitlements after boot.
 */

import type { PricingPlan } from '../types';

export const MOCKS_QUOTA_MIN = 0;
export const MOCKS_QUOTA_MAX = 10_000;

export type PlanEntitlements = {
  freeMocks: number;
  premiumMocks: number;
};

export const PLAN_ENTITLEMENTS_SEED: PlanEntitlements = {
  freeMocks: 3,
  premiumMocks: 15,
};

export function defaultMocksForPlan(
  plan: string,
  entitlements: PlanEntitlements = PLAN_ENTITLEMENTS_SEED
): number | null {
  if (plan === 'Unlimited') return null;
  if (plan === 'Premium') return entitlements.premiumMocks;
  return entitlements.freeMocks;
}

/** Keep plan card feature bullets aligned with mocksGranted. */
function syncMockFeatureLine(
  features: string[],
  count: number,
  kind: 'free' | 'premium'
): string[] {
  const re =
    kind === 'free'
      ? /\d+\s*Free\s+Mock/i
      : /\d+\s*Premium\s+Mock/i;
  const label =
    kind === 'free'
      ? `${count} Free Mock Test Credit${count === 1 ? '' : 's'}`
      : `${count} Premium Mock Test Credits`;
  return features.map((f) => (re.test(f) ? label : f));
}

/** Apply Free/Premium mock defaults onto pricing cards (counts + feature copy). */
export function applyEntitlementsToPlans(
  plans: PricingPlan[],
  entitlements: PlanEntitlements
): PricingPlan[] {
  return plans.map((p) => {
    if (p.tier === 'Free') {
      return {
        ...p,
        mocksGranted: entitlements.freeMocks,
        features: syncMockFeatureLine(p.features || [], entitlements.freeMocks, 'free'),
      };
    }
    if (p.tier === 'Premium') {
      return {
        ...p,
        mocksGranted: entitlements.premiumMocks,
        features: syncMockFeatureLine(p.features || [], entitlements.premiumMocks, 'premium'),
      };
    }
    return p;
  });
}
