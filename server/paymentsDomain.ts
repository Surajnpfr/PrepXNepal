/**
 * Payment claims domain — pure helpers for the dynamic moderation queue.
 */

export type PaymentClaimStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'eSewa' | 'Khalti' | 'Bank Transfer';

export type PaymentClaimRecord = {
  id: string;
  userId: string;
  clerkUserId: string;
  userName: string;
  userEmail: string;
  planCode: string;
  amountNpr: number;
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

export const PAYMENT_METHODS = new Set<PaymentMethod>(['eSewa', 'Khalti', 'Bank Transfer']);

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && PAYMENT_METHODS.has(value as PaymentMethod);
}

export function canModeratePaymentClaims(
  role: string | undefined,
  isBootstrap = false
): boolean {
  if (isBootstrap) return true;
  return role === 'Admin' || role === 'Moderator (Billing)';
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

export function defaultEntitlementsForPlan(planCode: string): {
  tier: 'Free' | 'Premium' | 'Unlimited';
  mocksGranted: number | null;
  coinsGranted: number;
} {
  const code = planCode.trim().toLowerCase();
  if (code === 'unlimited' || code.includes('unlimited')) {
    return { tier: 'Unlimited', mocksGranted: null, coinsGranted: 200 };
  }
  if (code === 'premium' || code.includes('premium') || code.includes('pro')) {
    return { tier: 'Premium', mocksGranted: 10, coinsGranted: 100 };
  }
  return { tier: 'Premium', mocksGranted: 10, coinsGranted: 100 };
}
