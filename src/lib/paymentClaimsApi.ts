import type { PaymentClaim } from '../types';

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

export async function fetchPaymentClaims(
  getToken: () => Promise<string | null>
): Promise<{ claims: PaymentClaim[]; syncedAt: string }> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/payment-claims', { headers });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function submitPaymentClaim(
  getToken: () => Promise<string | null>,
  input: {
    planCode: string;
    amountNpr: number;
    paymentMethod: PaymentClaim['paymentMethod'];
    transactionRef: string;
    screenshotUrl?: string;
    userNotes?: string;
  }
): Promise<PaymentClaim> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/payment-claims', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.claim as PaymentClaim;
}

export async function approvePaymentClaim(
  getToken: () => Promise<string | null>,
  claimId: string
): Promise<{
  claim: PaymentClaim;
  activatedUser?: unknown;
  referralCommission?: { recorded: boolean; commission?: { commissionAmountNpr?: number } };
}> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/payment-claims/${encodeURIComponent(claimId)}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function rejectPaymentClaim(
  getToken: () => Promise<string | null>,
  claimId: string,
  reason: string
): Promise<PaymentClaim> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/payment-claims/${encodeURIComponent(claimId)}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.claim as PaymentClaim;
}
