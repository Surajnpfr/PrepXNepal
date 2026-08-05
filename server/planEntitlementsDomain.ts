/**
 * Domain invariants for Free/Premium mock quota defaults.
 * Per-user Clerk publicMetadata.mocksRemaining overrides these after first write.
 */

export const MOCKS_QUOTA_MIN = 0;
export const MOCKS_QUOTA_MAX = 10_000;

export type PlanEntitlements = {
  freeMocks: number;
  premiumMocks: number;
};

/** Seed defaults — Free gets 3 mocks; Standard (Premium) gets 15. */
export const PLAN_ENTITLEMENTS_SEED: PlanEntitlements = {
  freeMocks: 3,
  premiumMocks: 15,
};

export type PlanTierName = 'Free' | 'Premium' | 'Unlimited' | string;

function isQuotaInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n);
}

/** Validate and normalize entitlements payload. */
export function parsePlanEntitlements(input: unknown):
  | { ok: true; value: PlanEntitlements }
  | { ok: false; error: string } {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Expected entitlements object' };
  }
  const raw = input as Record<string, unknown>;
  const freeMocks = raw.freeMocks;
  const premiumMocks = raw.premiumMocks;

  if (!isQuotaInt(freeMocks) || freeMocks < MOCKS_QUOTA_MIN || freeMocks > MOCKS_QUOTA_MAX) {
    return {
      ok: false,
      error: `freeMocks must be an integer ${MOCKS_QUOTA_MIN}…${MOCKS_QUOTA_MAX}`,
    };
  }
  if (
    !isQuotaInt(premiumMocks) ||
    premiumMocks < MOCKS_QUOTA_MIN ||
    premiumMocks > MOCKS_QUOTA_MAX
  ) {
    return {
      ok: false,
      error: `premiumMocks must be an integer ${MOCKS_QUOTA_MIN}…${MOCKS_QUOTA_MAX}`,
    };
  }

  return {
    ok: true,
    value: { freeMocks, premiumMocks },
  };
}

/** Inferred mocks when Clerk metadata.mocksRemaining is absent. */
export function defaultMocksForPlan(
  plan: PlanTierName,
  entitlements: PlanEntitlements = PLAN_ENTITLEMENTS_SEED
): number | null {
  if (plan === 'Unlimited') return null;
  if (plan === 'Premium') return entitlements.premiumMocks;
  return entitlements.freeMocks;
}
