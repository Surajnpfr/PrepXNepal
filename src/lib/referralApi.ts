import type {
  ReferralAttribution,
  ReferralCommission,
  ReferralLink,
  ReferralTotals,
  StaffReferralBundle,
} from '../types';

async function authHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string }).error || `Request failed (${res.status})`;
}

export async function ensureMyReferralLink(
  getToken: () => Promise<string | null>
): Promise<ReferralLink> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/referrals/me/ensure', { method: 'POST', headers });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.link as ReferralLink;
}

export async function fetchMyReferrals(
  getToken: () => Promise<string | null>
): Promise<StaffReferralBundle> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/referrals/me', { headers });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function attributeReferral(
  getToken: () => Promise<string | null>,
  code: string
): Promise<{ attribution: ReferralAttribution; created: boolean }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/referrals/attribute', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function recordReferralCommission(
  getToken: () => Promise<string | null>,
  input: { claimId: string; referredClerkId: string; amountNpr: number }
): Promise<{
  recorded: boolean;
  reason?: string;
  message?: string;
  commission?: ReferralCommission;
}> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/referrals/commissions', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchReferralAdminOverview(
  getToken: () => Promise<string | null>
): Promise<{
  links: ReferralLink[];
  commissions: ReferralCommission[];
  totals: ReferralTotals;
  byReferrer: StaffReferralBundle[];
}> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/referrals/admin/overview', { headers });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function settleReferralCommission(
  getToken: () => Promise<string | null>,
  commissionId: string
): Promise<ReferralCommission> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/referrals/commissions/${encodeURIComponent(commissionId)}/settle`, {
    method: 'PATCH',
    headers,
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.commission as ReferralCommission;
}

export function buildReferralUrl(code: string, origin = window.location.origin): string {
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}
