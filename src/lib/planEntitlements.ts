/**
 * Client-side seed for Free/Premium mock defaults (mirrors server/planEntitlementsDomain).
 * Runtime Free/Premium values come from GET /api/plan-entitlements after boot.
 */

export const MOCKS_QUOTA_MIN = 0;
export const MOCKS_QUOTA_MAX = 10_000;

export type PlanEntitlements = {
  freeMocks: number;
  premiumMocks: number;
};

export const PLAN_ENTITLEMENTS_SEED: PlanEntitlements = {
  freeMocks: 1,
  premiumMocks: 10,
};

export function defaultMocksForPlan(
  plan: string,
  entitlements: PlanEntitlements = PLAN_ENTITLEMENTS_SEED
): number | null {
  if (plan === 'Unlimited') return null;
  if (plan === 'Premium') return entitlements.premiumMocks;
  return entitlements.freeMocks;
}
