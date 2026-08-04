/**
 * Free-plan mock access invariant.
 * Free quota may only be used on SetA so multi-account farming cannot clear every paper.
 */

/** Stable mock id from SetA.json import (`mock-set-${slug}`). */
export const FREE_PLAN_ALLOWED_MOCK_ID = 'mock-set-seta';

export const FREE_PLAN_ALLOWED_MOCK_LABEL = 'SetA';

export const FREE_PLAN_MOCK_ACCESS_ERROR =
  'Free plan includes SetA only. Upgrade to Premium or Unlimited for other mocks and practice tests.';

export function isFreePlan(plan: string | null | undefined): boolean {
  return (plan || 'Free') === 'Free';
}

/** True when this mock is the Free-plan entitlement paper. */
export function isFreePlanAllowedMock(mockId: string | null | undefined): boolean {
  return (mockId || '').trim() === FREE_PLAN_ALLOWED_MOCK_ID;
}

/**
 * Free users may only open SetA (Give Mock / Study).
 * Premium / Unlimited / staff bypass are unrestricted here.
 */
export function assertFreePlanMockAccess(
  plan: string | null | undefined,
  mockId: string | null | undefined,
  opts?: { staffBypass?: boolean }
): { ok: true } | { ok: false; error: string; status: 403 } {
  if (opts?.staffBypass) return { ok: true };
  if (!isFreePlan(plan)) return { ok: true };
  if (isFreePlanAllowedMock(mockId)) return { ok: true };
  return { ok: false, error: FREE_PLAN_MOCK_ACCESS_ERROR, status: 403 };
}

/** Dynamic practice is never SetA — Free plan cannot generate practice. */
export function assertFreePlanPracticeAccess(
  plan: string | null | undefined,
  opts?: { staffBypass?: boolean }
): { ok: true } | { ok: false; error: string; status: 403 } {
  if (opts?.staffBypass) return { ok: true };
  if (!isFreePlan(plan)) return { ok: true };
  return { ok: false, error: FREE_PLAN_MOCK_ACCESS_ERROR, status: 403 };
}
