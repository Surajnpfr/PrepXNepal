/**
 * Staff referral commissions — pure domain (unit-tested without DB/Clerk).
 */

export const REFERRAL_COMMISSION_RATE = 0.3;

export type ReferralCommissionStatus = 'pending' | 'settled';

export type ReferralLinkRecord = {
  ownerClerkId: string;
  code: string;
  ownerEmail: string;
  ownerName: string;
  ownerRole: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReferralAttributionRecord = {
  referredClerkId: string;
  referrerClerkId: string;
  code: string;
  attributedAt: string;
};

export type ReferralCommissionRecord = {
  id: string;
  claimId: string;
  referredClerkId: string;
  referrerClerkId: string;
  conversionAmountNpr: number;
  commissionRate: number;
  commissionAmountNpr: number;
  status: ReferralCommissionStatus;
  createdAt: string;
  settledAt: string | null;
  settledByClerkId: string | null;
};

export type ReferralTotals = {
  totalConversionNpr: number;
  totalCommissionNpr: number;
  pendingCommissionNpr: number;
  settledCommissionNpr: number;
  conversionCount: number;
};

const STAFF_ROLES = new Set([
  'Admin',
  'Moderator (Questions)',
  'Moderator (Billing)',
]);

export function isReferralStaffRole(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  return Boolean(role && STAFF_ROLES.has(role));
}

export function canRecordReferralCommission(
  role: string | undefined,
  isBootstrap = false
): boolean {
  if (isBootstrap) return true;
  return role === 'Admin' || role === 'Moderator (Billing)';
}

export function canSettleReferralCommission(
  role: string | undefined,
  isBootstrap = false
): boolean {
  if (isBootstrap) return true;
  return role === 'Admin';
}

/** Round NPR commission to nearest rupee. */
export function computeCommissionAmountNpr(
  conversionAmountNpr: number,
  rate: number = REFERRAL_COMMISSION_RATE
): number {
  if (!Number.isFinite(conversionAmountNpr) || conversionAmountNpr < 0) {
    throw new Error('conversionAmountNpr must be a non-negative number');
  }
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error('commission rate must be between 0 and 1');
  }
  return Math.round(conversionAmountNpr * rate);
}

export function sumCommissionTotals(
  rows: Pick<
    ReferralCommissionRecord,
    'conversionAmountNpr' | 'commissionAmountNpr' | 'status'
  >[]
): ReferralTotals {
  let totalConversionNpr = 0;
  let totalCommissionNpr = 0;
  let pendingCommissionNpr = 0;
  let settledCommissionNpr = 0;
  for (const r of rows) {
    totalConversionNpr += r.conversionAmountNpr;
    totalCommissionNpr += r.commissionAmountNpr;
    if (r.status === 'settled') settledCommissionNpr += r.commissionAmountNpr;
    else pendingCommissionNpr += r.commissionAmountNpr;
  }
  return {
    totalConversionNpr,
    totalCommissionNpr,
    pendingCommissionNpr,
    settledCommissionNpr,
    conversionCount: rows.length,
  };
}

/** Short stable-looking code from clerk id + random suffix. */
export function generateReferralCode(ownerClerkId: string): string {
  const base = ownerClerkId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase() || 'staff';
  const rand = Math.random().toString(36).slice(2, 6);
  return `px${base}${rand}`.slice(0, 16);
}

export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase();
  if (!/^[a-z0-9_-]{4,32}$/.test(code)) return null;
  return code;
}
