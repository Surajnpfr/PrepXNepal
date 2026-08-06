/**
 * Payment claims domain — pure helpers for the dynamic moderation queue.
 */

import {
  PLAN_ENTITLEMENTS_SEED,
  type PlanEntitlements,
} from './planEntitlementsDomain.ts';
import { canManageBillingRole } from './userRoles.ts';

export type PaymentClaimStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'Fonepay' | 'eSewa' | 'Khalti' | 'Bank Transfer';

export type PaymentClaimRecord = {
  id: string;
  userId: string;
  clerkUserId: string;
  userName: string;
  userEmail: string;
  planCode: string;
  /** Payable amount after promo (what the student should have paid). */
  amountNpr: number;
  /** List / catalog price before promo. Defaults to amountNpr when no promo. */
  listAmountNpr: number;
  promoCode: string | null;
  promoDiscountNpr: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  screenshotUrl: string;
  status: PaymentClaimStatus;
  userNotes: string | null;
  moderatorNotes: string | null;
  submittedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verifiedByClerkId: string | null;
};

export const PAYMENT_METHODS = new Set<PaymentMethod>([
  'Fonepay',
  'eSewa',
  'Khalti',
  'Bank Transfer',
]);

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && PAYMENT_METHODS.has(value as PaymentMethod);
}

export function canModeratePaymentClaims(
  role: string | undefined,
  isBootstrap = false
): boolean {
  return canManageBillingRole(role, isBootstrap);
}

/** Pending first (oldest first = FIFO), then others newest-first. */
export function sortClaimsForQueue(claims: PaymentClaimRecord[]): PaymentClaimRecord[] {
  const pending = claims
    .filter((c) => c.status === 'pending')
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const rest = claims
    .filter((c) => c.status !== 'pending')
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return [...pending, ...rest];
}

export function defaultEntitlementsForPlan(
  planCode: string,
  entitlements: PlanEntitlements = PLAN_ENTITLEMENTS_SEED
): {
  tier: 'Free' | 'Premium' | 'Unlimited';
  mocksGranted: number | null;
  coinsGranted: number;
} {
  const code = planCode.trim().toLowerCase();
  if (code === 'unlimited' || code.includes('unlimited')) {
    return { tier: 'Unlimited', mocksGranted: null, coinsGranted: 500 };
  }
  if (code === 'premium' || code.includes('premium') || code.includes('pro')) {
    return { tier: 'Premium', mocksGranted: entitlements.premiumMocks, coinsGranted: 100 };
  }
  if (code === 'free' || code.includes('free')) {
    return { tier: 'Free', mocksGranted: entitlements.freeMocks, coinsGranted: 20 };
  }
  return { tier: 'Premium', mocksGranted: entitlements.premiumMocks, coinsGranted: 100 };
}
