import type { PlanTier, PricingPlan } from '../types';

/**
 * Public display names for the three canonical tiers.
 * Internal PlanTier codes stay Free | Premium | Unlimited so Clerk metadata,
 * payment claims, and entitlements for existing subscribers keep working.
 */
export const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  Free: 'Free',
  Premium: 'Standard',
  Unlimited: 'Premium',
};

/** Map a stored plan tier/code to the user-facing plan name. */
export function planDisplayName(plan: string | null | undefined): string {
  if (!plan) return PLAN_DISPLAY_NAMES.Free;
  if (plan === 'Free' || plan === 'Premium' || plan === 'Unlimited') {
    return PLAN_DISPLAY_NAMES[plan];
  }
  return plan;
}

/**
 * Sync marketing `name` on seeded Free/Premium/Unlimited cards to the
 * public display labels without changing `tier` or `code`.
 */
export function applyPlanDisplayNames(plans: PricingPlan[]): PricingPlan[] {
  return plans.map((p) => {
    const display = PLAN_DISPLAY_NAMES[p.tier];
    if (!display || p.name === display) return p;
    return { ...p, name: display };
  });
}
