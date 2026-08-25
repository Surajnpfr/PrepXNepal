/**
 * Nepal CEE exam schedule helpers.
 * Official date is TBA; public window is tentative Ashoj–Kartik until MEC announces.
 */

/** Shown when the student (or product) has no official exam date. */
export const TENTATIVE_EXAM_WINDOW = 'Ashoj–Kartik';
export const TENTATIVE_EXAM_LABEL = `Tentative · ${TENTATIVE_EXAM_WINDOW}`;

/** PrepX product season tied to MEC CEE year. */
export const CEE_SEASON_YEAR = 2026;

/**
 * Inclusive calendar end of paid-plan validity for the CEE 2026 season.
 * Covers the tentative Ashoj–Kartik exam window; plans remain valid through this date.
 * (Update when MEC publishes the official exam date / close of the 2026 cycle.)
 */
export const SUBSCRIPTION_VALID_UNTIL_ISO = '2026-11-30';

/** Student-facing validity line for Standard / Premium (paid) plans. */
export const SUBSCRIPTION_VALIDITY_LABEL =
  'Valid until CEE 2026 finishes (through Kartik 2026)';

/** Short price-card suffix for paid plans. */
export const SUBSCRIPTION_VALIDITY_SHORT = 'until CEE 2026';

/**
 * Legacy mapper default that was never an official MEC date.
 * Treat as unset so existing profiles don't show a fake countdown.
 */
const LEGACY_PLACEHOLDER_EXAM_DATES = new Set(['2026-09-15']);

export function isExamDateSet(examDate?: string | null): boolean {
  const raw = (examDate || '').trim();
  if (!raw) return false;
  if (LEGACY_PLACEHOLDER_EXAM_DATES.has(raw)) return false;
  const t = new Date(raw).getTime();
  return !Number.isNaN(t);
}

export function daysUntilExamDate(examDate: string): number {
  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) return 0;
  const now = new Date();
  return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatExamDateShort(examDate: string): string {
  return new Date(examDate).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** End-of-day Nepal-ish cutoff for the CEE 2026 subscription season. */
export function subscriptionSeasonEndsAt(): Date {
  // Local calendar date end — 2026-11-30 23:59:59.999 local
  return new Date(`${SUBSCRIPTION_VALID_UNTIL_ISO}T23:59:59.999`);
}

/** True while paid Standard/Premium entitlements are in the CEE 2026 validity window. */
export function isSubscriptionSeasonActive(now: Date = new Date()): boolean {
  return now.getTime() <= subscriptionSeasonEndsAt().getTime();
}

/**
 * Paid plans (Premium tier / Unlimited tier) are season-bound.
 * Free remains available outside the season window.
 * Optional per-user planExpiresAt (e.g. 100% promo 2-month session) wins when set.
 */
export function isPaidPlanSeasonValid(
  plan: string | null | undefined,
  now: Date = new Date(),
  planExpiresAt?: string | null
): boolean {
  const p = plan || 'Free';
  if (p === 'Free') return true;
  if (planExpiresAt) {
    const exp = new Date(planExpiresAt).getTime();
    if (!Number.isNaN(exp)) return now.getTime() <= exp;
  }
  return isSubscriptionSeasonActive(now);
}
