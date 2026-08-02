import type { UserProfile } from '../types';

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function claimPlannerReward(
  getToken: () => Promise<string | null>,
  dateKey: string
): Promise<{ coinReward: number; user: UserProfile }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/coins/planner-complete', {
    method: 'POST',
    headers,
    body: JSON.stringify({ dateKey }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Planner reward failed (${res.status})`);
  }
  return res.json();
}

export async function redeemCatalogItem(
  getToken: () => Promise<string | null>,
  itemId: string
): Promise<{ redeemed: string; coinCost: number; user: UserProfile }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/coins/redeem', {
    method: 'POST',
    headers,
    body: JSON.stringify({ itemId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Redeem failed (${res.status})`);
  }
  return res.json();
}
