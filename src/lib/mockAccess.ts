/**
 * Free-plan mock access (client mirror of server/mockAccessDomain.ts).
 * Server enforcement is authoritative; UI uses this to lock non-SetA/B/C cards.
 */

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

export function isFreePlanAllowedMock(mockId: string | null | undefined): boolean {
  const id = (mockId || '').trim();
  return (FREE_PLAN_ALLOWED_MOCK_IDS as readonly string[]).includes(id);
}

/** Catalog: can Free user Study / Give Mock this paper? */
export function canFreePlanAccessMock(
  plan: string | null | undefined,
  mockId: string | null | undefined
): boolean {
  if (!isFreePlan(plan)) return true;
  return isFreePlanAllowedMock(mockId);
}
