/**
 * Client-side seed for Free/Premium mock defaults (mirrors server/planEntitlementsDomain).
 * Runtime Free/Premium values come from GET /api/plan-entitlements after boot.
 */

import type { PricingPlan } from '../types';
import { SUBSCRIPTION_VALIDITY_LABEL } from './examSchedule';

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

export const WEEKLY_MOCK_FEATURE = '1 Weekly Mock test';
export const DYNAMIC_MOCK_FEATURE = 'Dynamic Mock tests';
export const SUBSCRIPTION_VALIDITY_FEATURE = SUBSCRIPTION_VALIDITY_LABEL;

/**
 * Marketing benefits: weekly mock on every tier; dynamic mocks only on
 * Unlimited (public display name: Premium); paid plans carry CEE 2026 validity.
 */
export function syncPlanBenefitFeatures(plan: PricingPlan): PricingPlan {
  const without = (plan.features || []).filter(
    (f) =>
      !/weekly\s+mock/i.test(f) &&
      !/dynamic\s+mock/i.test(f) &&
      !/valid until CEE/i.test(f) &&
      !/until CEE 2026/i.test(f)
  );

  const mockCreditIdx = without.findIndex((f) =>
    /\d+\s*(Free|Premium)\s+Mock|Unlimited Mock/i.test(f)
  );
  const features = [...without];
  const insertAt = mockCreditIdx >= 0 ? mockCreditIdx + 1 : 0;
  features.splice(insertAt, 0, WEEKLY_MOCK_FEATURE);

  if (plan.tier === 'Unlimited') {
    const weeklyIdx = features.indexOf(WEEKLY_MOCK_FEATURE);
    features.splice(weeklyIdx + 1, 0, DYNAMIC_MOCK_FEATURE);
  }

  if (plan.tier === 'Premium' || plan.tier === 'Unlimited') {
    if (!features.some((f) => /valid until CEE/i.test(f))) {
      features.push(SUBSCRIPTION_VALIDITY_FEATURE);
    }
  }

  return { ...plan, features };
}

/** Apply Free/Premium mock defaults onto pricing cards (counts + feature copy). */
export function applyEntitlementsToPlans(
  plans: PricingPlan[],
  entitlements: PlanEntitlements
): PricingPlan[] {
  return plans.map((p) => {
    let next = p;
    if (p.tier === 'Free') {
      next = {
        ...p,
        mocksGranted: entitlements.freeMocks,
        features: syncMockFeatureLine(p.features || [], entitlements.freeMocks, 'free'),
      };
    } else if (p.tier === 'Premium') {
      next = {
        ...p,
        mocksGranted: entitlements.premiumMocks,
        features: syncMockFeatureLine(p.features || [], entitlements.premiumMocks, 'premium'),
      };
    }
    return syncPlanBenefitFeatures(next);
  });
}
