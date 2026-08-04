import type { PlanEntitlements } from './planEntitlements';

/** Public read — no auth required (display quotas on Pricing). */
export async function fetchPlanEntitlements(): Promise<PlanEntitlements> {
  const res = await fetch('/api/plan-entitlements');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch plan entitlements (${res.status})`);
  }
  const data = await res.json();
  return data.entitlements as PlanEntitlements;
}

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function putPlanEntitlements(
  getToken: () => Promise<string | null>,
  entitlements: PlanEntitlements
): Promise<PlanEntitlements> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/plan-entitlements', {
    method: 'PUT',
    headers,
    body: JSON.stringify(entitlements),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to update plan entitlements (${res.status})`);
  }
  const data = await res.json();
  return data.entitlements as PlanEntitlements;
}
