/**
 * Checkout promo codes — pure domain (unit-tested without DB).
 * Admin-managed offers applied against plan list price at claim time.
 */

export type PromoDiscountType = 'percent' | 'fixed';

export type PromoCodeRecord = {
  id: string;
  code: string;
  description: string | null;
  discountType: PromoDiscountType;
  discountValue: number;
  /** Empty array = all plans. Otherwise matched case-insensitively against planCode. */
  applicablePlanCodes: string[];
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdByClerkId: string | null;
  createdByName: string | null;
};

export type PromoApplyResult =
  | {
      ok: true;
      code: string;
      discountType: PromoDiscountType;
      discountValue: number;
      listAmountNpr: number;
      discountNpr: number;
      payableNpr: number;
    }
  | { ok: false; reason: string };

export function canManagePromoCodes(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  return role === 'Admin';
}

/** Normalize user-entered codes: trim, upper-case, allow A-Z 0-9 _ - */
export function normalizePromoCode(raw: string): string | null {
  const code = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!code || code.length < 3 || code.length > 32) return null;
  if (!/^[A-Z0-9_-]+$/.test(code)) return null;
  return code;
}

export function isPromoDiscountType(value: unknown): value is PromoDiscountType {
  return value === 'percent' || value === 'fixed';
}

export function parseApplicablePlanCodes(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((p) => String(p || '').trim())
      .filter(Boolean)
      .map((p) => p);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,|\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

export function planMatchesPromo(planCode: string, applicable: string[]): boolean {
  if (!applicable.length) return true;
  const needle = planCode.trim().toLowerCase();
  return applicable.some((p) => p.trim().toLowerCase() === needle);
}

/** Compute discount + payable from list price. Never returns payable < 1 NPR for paid claims. */
export function computePromoDiscount(
  listAmountNpr: number,
  discountType: PromoDiscountType,
  discountValue: number
): { discountNpr: number; payableNpr: number } {
  const list = Math.max(0, Math.round(listAmountNpr));
  if (list <= 0) return { discountNpr: 0, payableNpr: 0 };

  let discountNpr = 0;
  if (discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, discountValue));
    discountNpr = Math.round((list * pct) / 100);
  } else {
    discountNpr = Math.min(list, Math.max(0, Math.round(discountValue)));
  }

  // Keep at least NPR 1 payable so the claim stays a real payment verification.
  let payableNpr = list - discountNpr;
  if (payableNpr < 1 && list >= 1) {
    payableNpr = 1;
    discountNpr = list - 1;
  }
  return { discountNpr, payableNpr };
}

export function evaluatePromoForCheckout(
  promo: PromoCodeRecord | null | undefined,
  opts: {
    planCode: string;
    listAmountNpr: number;
    now?: Date;
  }
): PromoApplyResult {
  const listAmountNpr = Math.round(Number(opts.listAmountNpr));
  if (!Number.isFinite(listAmountNpr) || listAmountNpr <= 0) {
    return { ok: false, reason: 'Plan amount must be greater than zero' };
  }

  if (!promo) {
    return { ok: false, reason: 'Promo code not found' };
  }

  if (!promo.active) {
    return { ok: false, reason: 'This promo code is inactive' };
  }

  const now = opts.now ?? new Date();
  if (promo.startsAt) {
    const start = new Date(promo.startsAt);
    if (!Number.isNaN(start.getTime()) && now < start) {
      return { ok: false, reason: 'This promo code is not active yet' };
    }
  }
  if (promo.expiresAt) {
    const end = new Date(promo.expiresAt);
    if (!Number.isNaN(end.getTime()) && now > end) {
      return { ok: false, reason: 'This promo code has expired' };
    }
  }

  if (
    promo.maxRedemptions != null &&
    promo.maxRedemptions >= 0 &&
    promo.redemptionCount >= promo.maxRedemptions
  ) {
    return { ok: false, reason: 'This promo code has reached its redemption limit' };
  }

  if (!planMatchesPromo(opts.planCode, promo.applicablePlanCodes)) {
    return {
      ok: false,
      reason: `This promo does not apply to plan “${opts.planCode}”`,
    };
  }

  if (!isPromoDiscountType(promo.discountType)) {
    return { ok: false, reason: 'Promo code is misconfigured' };
  }
  if (!Number.isFinite(promo.discountValue) || promo.discountValue <= 0) {
    return { ok: false, reason: 'Promo code is misconfigured' };
  }
  if (promo.discountType === 'percent' && promo.discountValue > 100) {
    return { ok: false, reason: 'Promo code is misconfigured' };
  }

  const { discountNpr, payableNpr } = computePromoDiscount(
    listAmountNpr,
    promo.discountType,
    promo.discountValue
  );

  if (discountNpr <= 0) {
    return { ok: false, reason: 'Promo does not change the payable amount' };
  }

  return {
    ok: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    listAmountNpr,
    discountNpr,
    payableNpr,
  };
}

export type CreatePromoCodeInput = {
  id: string;
  code: string;
  description?: string | null;
  discountType: PromoDiscountType;
  discountValue: number;
  applicablePlanCodes?: string[];
  maxRedemptions?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
  createdByClerkId?: string | null;
  createdByName?: string | null;
};

export function validatePromoCodeCreateInput(raw: {
  code?: unknown;
  description?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  applicablePlanCodes?: unknown;
  maxRedemptions?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
  active?: unknown;
}): { ok: true; value: Omit<CreatePromoCodeInput, 'id'> } | { ok: false; reason: string } {
  const code = normalizePromoCode(typeof raw.code === 'string' ? raw.code : '');
  if (!code) {
    return {
      ok: false,
      reason: 'Code must be 3–32 characters (letters, numbers, _ or -)',
    };
  }
  if (!isPromoDiscountType(raw.discountType)) {
    return { ok: false, reason: 'discountType must be percent or fixed' };
  }
  const discountValue =
    typeof raw.discountValue === 'number' ? raw.discountValue : Number(raw.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, reason: 'discountValue must be a positive number' };
  }
  if (raw.discountType === 'percent' && discountValue > 100) {
    return { ok: false, reason: 'Percent discount cannot exceed 100' };
  }

  let maxRedemptions: number | null = null;
  if (raw.maxRedemptions != null && raw.maxRedemptions !== '') {
    const n = typeof raw.maxRedemptions === 'number' ? raw.maxRedemptions : Number(raw.maxRedemptions);
    if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
      return { ok: false, reason: 'maxRedemptions must be a positive integer or empty' };
    }
    maxRedemptions = n;
  }

  const startsAt =
    typeof raw.startsAt === 'string' && raw.startsAt.trim() ? raw.startsAt.trim() : null;
  const expiresAt =
    typeof raw.expiresAt === 'string' && raw.expiresAt.trim() ? raw.expiresAt.trim() : null;
  if (startsAt && Number.isNaN(new Date(startsAt).getTime())) {
    return { ok: false, reason: 'startsAt must be a valid date' };
  }
  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    return { ok: false, reason: 'expiresAt must be a valid date' };
  }
  if (startsAt && expiresAt && new Date(startsAt) > new Date(expiresAt)) {
    return { ok: false, reason: 'startsAt must be before expiresAt' };
  }

  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim().slice(0, 500)
      : null;

  return {
    ok: true,
    value: {
      code,
      description,
      discountType: raw.discountType,
      discountValue: Math.round(discountValue * 100) / 100,
      applicablePlanCodes: parseApplicablePlanCodes(raw.applicablePlanCodes),
      maxRedemptions,
      startsAt,
      expiresAt,
      active: raw.active === false ? false : true,
    },
  };
}
