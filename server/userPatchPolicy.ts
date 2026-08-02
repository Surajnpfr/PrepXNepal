/**
 * Authorization policy for PATCH /api/users/:clerkId.
 * Pure functions — unit-tested without Clerk.
 */

export const STUDENT_SELF_PATCH_KEYS = [
  'targetScore',
  'targetExam',
  'examDate',
  'preferredLanguage',
  'darkTheme',
] as const;

/** Billing/Admin may set these on *other* users only (never self, except bootstrap). */
export const ENTITLEMENT_PATCH_KEYS = [
  'plan',
  'mocksRemaining',
  'studyCoinBalance',
] as const;

/** Score fields are server-owned; Admin/Billing may correct others only. */
export const SCORE_PATCH_KEYS = ['lastMockScore', 'lastPercentile'] as const;

export type PatchActor = {
  role: string;
  email: string;
  userId: string;
  isBootstrap: boolean;
};

export function canManageBilling(actor: PatchActor): boolean {
  return (
    actor.isBootstrap ||
    actor.role === 'Admin' ||
    actor.role === 'Moderator (Billing)'
  );
}

export function isStaffActor(actor: PatchActor): boolean {
  return (
    actor.isBootstrap ||
    actor.role === 'Admin' ||
    actor.role === 'Moderator (Questions)' ||
    actor.role === 'Moderator (Billing)'
  );
}

/**
 * Resolve which body keys the actor may write for a given target.
 * Deny-by-default.
 */
export function allowedPatchKeysFor(
  actor: PatchActor,
  targetUserId: string
): ReadonlySet<string> {
  const isSelf = actor.userId === targetUserId;
  const keys = new Set<string>();

  if (isSelf) {
    for (const k of STUDENT_SELF_PATCH_KEYS) keys.add(k);
    // Bootstrap may also self-manage entitlements for ops recovery.
    if (actor.isBootstrap) {
      keys.add('role');
      for (const k of ENTITLEMENT_PATCH_KEYS) keys.add(k);
      for (const k of SCORE_PATCH_KEYS) keys.add(k);
    }
    return keys;
  }

  // Cross-user updates: Billing/Admin/bootstrap only.
  if (!canManageBilling(actor)) {
    return keys; // empty → any field rejected
  }

  for (const k of STUDENT_SELF_PATCH_KEYS) keys.add(k);
  for (const k of ENTITLEMENT_PATCH_KEYS) keys.add(k);
  for (const k of SCORE_PATCH_KEYS) keys.add(k);
  if (actor.isBootstrap) keys.add('role');
  return keys;
}

export function assertPatchBodyAllowed(
  actor: PatchActor,
  targetUserId: string,
  bodyKeys: string[]
): { ok: true } | { ok: false; error: string; status: number } {
  const isSelf = actor.userId === targetUserId;

  if (!isSelf && !canManageBilling(actor)) {
    return { ok: false, error: 'Cannot update another user', status: 403 };
  }

  if (!isSelf && !isStaffActor(actor)) {
    return { ok: false, error: 'Cannot update another user', status: 403 };
  }

  const allowed = allowedPatchKeysFor(actor, targetUserId);
  if (allowed.size === 0 && bodyKeys.length > 0) {
    return { ok: false, error: 'Cannot update another user', status: 403 };
  }

  for (const key of bodyKeys) {
    if (!allowed.has(key)) {
      return { ok: false, error: `Field not allowed: ${key}`, status: 403 };
    }
  }

  if (bodyKeys.includes('role') && !actor.isBootstrap) {
    return { ok: false, error: 'Only bootstrap admin can change roles', status: 403 };
  }

  return { ok: true };
}

/** Nepal Civil time (UTC+5:45) calendar date YYYY-MM-DD for planner rewards. */
export function nepalTodayDateKey(now = new Date()): string {
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const nepal = new Date(utc + (5 * 60 + 45) * 60_000);
  const y = nepal.getFullYear();
  const m = String(nepal.getMonth() + 1).padStart(2, '0');
  const d = String(nepal.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isAllowedPlannerDateKey(dateKey: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  return dateKey === nepalTodayDateKey(now);
}

/** Client-safe error message (never pass through driver/Clerk internals). */
export function publicErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && typeof (err as any).status === 'number') {
    const status = (err as any).status;
    if (status >= 400 && status < 500 && typeof (err as any).message === 'string') {
      return (err as any).message;
    }
  }
  return fallback;
}
