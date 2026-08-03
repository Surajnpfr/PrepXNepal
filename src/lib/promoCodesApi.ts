import type { PaymentClaim } from '../types';

export type PromoCode = {
  id: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  applicablePlanCodes: string[];
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt?: string;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
};

export type PromoValidation = {
  valid: true;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  listAmountNpr: number;
  discountNpr: number;
  payableNpr: number;
};

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

export async function validatePromoCode(
  getToken: () => Promise<string | null>,
  input: { code: string; planCode: string; amountNpr: number }
): Promise<PromoValidation> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/promo-codes/validate', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchPromoCodes(
  getToken: () => Promise<string | null>
): Promise<PromoCode[]> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/promo-codes', { headers });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data.promoCodes || []) as PromoCode[];
}

export async function createPromoCode(
  getToken: () => Promise<string | null>,
  input: {
    code: string;
    description?: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    applicablePlanCodes?: string[];
    maxRedemptions?: number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    active?: boolean;
  }
): Promise<PromoCode> {
  const headers = await authHeaders(getToken);
  const res = await fetch('/api/promo-codes', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.promoCode as PromoCode;
}

export async function updatePromoCode(
  getToken: () => Promise<string | null>,
  id: string,
  patch: Partial<{
    description: string | null;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    applicablePlanCodes: string[];
    maxRedemptions: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    active: boolean;
  }>
): Promise<PromoCode> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/promo-codes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.promoCode as PromoCode;
}

export async function deletePromoCode(
  getToken: () => Promise<string | null>,
  id: string
): Promise<void> {
  const headers = await authHeaders(getToken);
  const res = await fetch(`/api/promo-codes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(await readError(res));
}

/** Re-export for callers that only need PaymentClaim typing alongside promos. */
export type { PaymentClaim };
