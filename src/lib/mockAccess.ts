/**
 * Free-plan mock access (client mirror of server/mockAccessDomain.ts).
 * Server enforcement is authoritative; UI uses this to lock non-SetA cards.
 */

export const FREE_PLAN_ALLOWED_MOCK_ID = 'mock-set-seta';
export const FREE_PLAN_ALLOWED_MOCK_LABEL = 'SetA';
export const FREE_PLAN_MOCK_ACCESS_ERROR =
  'Free plan includes SetA only. Upgrade to Premium or Unlimited for other mocks and practice tests.';

export function isFreePlan(plan: string | null | undefined): boolean {
  return (plan || 'Free') === 'Free';
}

export function isFreePlanAllowedMock(mockId: string | null | undefined): boolean {
  return (mockId || '').trim() === FREE_PLAN_ALLOWED_MOCK_ID;
}

/** Catalog: can Free user Study / Give Mock this paper? */
export function canFreePlanAccessMock(
  plan: string | null | undefined,
  mockId: string | null | undefined
): boolean {
  if (!isFreePlan(plan)) return true;
  return isFreePlanAllowedMock(mockId);
}
