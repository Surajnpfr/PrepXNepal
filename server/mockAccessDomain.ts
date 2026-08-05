/**
 * Free-plan mock access invariant.
 * Free quota may only be used on SetA / SetB / SetC so multi-account farming
 * cannot clear every paper in the catalog.
 */

/** Stable mock ids from Set*.json imports (`mock-set-${slug}`). */
export const FREE_PLAN_ALLOWED_MOCK_IDS = [
  'mock-set-seta',
  'mock-set-setb',
  'mock-set-setc',
] as const;

/** @deprecated Prefer FREE_PLAN_ALLOWED_MOCK_IDS — kept for older call sites. */
export const FREE_PLAN_ALLOWED_MOCK_ID = FREE_PLAN_ALLOWED_MOCK_IDS[0];

export const FREE_PLAN_ALLOWED_MOCK_LABEL = 'SetA, SetB, and SetC';

export const FREE_PLAN_MOCK_ACCESS_ERROR =
  'Free plan includes SetA, SetB, and SetC only. Upgrade to Premium or Unlimited for other mocks and practice tests.';

export function isFreePlan(plan: string | null | undefined): boolean {
  return (plan || 'Free') === 'Free';
}

/** True when this mock is one of the Free-plan entitlement papers. */
export function isFreePlanAllowedMock(mockId: string | null | undefined): boolean {
  const id = (mockId || '').trim();
  return (FREE_PLAN_ALLOWED_MOCK_IDS as readonly string[]).includes(id);
}

/**
 * Free users may only open SetA / SetB / SetC (Give Mock / Study).
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

/** Dynamic practice is never a Set paper — Free plan cannot generate practice. */
export function assertFreePlanPracticeAccess(
  plan: string | null | undefined,
  opts?: { staffBypass?: boolean }
): { ok: true } | { ok: false; error: string; status: 403 } {
  if (opts?.staffBypass) return { ok: true };
  if (!isFreePlan(plan)) return { ok: true };
  return { ok: false, error: FREE_PLAN_MOCK_ACCESS_ERROR, status: 403 };
}
