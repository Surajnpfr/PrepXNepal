/**
 * Canonical PrepX staff/student roles + legacy Clerk aliases.
 * Keep client `src/lib/userRoles.ts` in sync with this file.
 */

export const USER_ROLES = [
  'Student',
  'Content Manager',
  'Billing',
  'QAD',
  'Admin',
] as const;

export type UserRoleName = (typeof USER_ROLES)[number];

const LEGACY_ROLE_ALIASES: Record<string, UserRoleName> = {
  'Moderator (Questions)': 'Content Manager',
  'Moderator (Billing)': 'Billing',
  Moderator: 'Content Manager',
};

export function isUserRoleName(value: unknown): value is UserRoleName {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Normalize Clerk / UI role strings to the current catalog.
 * Unknown values become Student.
 */
export function normalizeUserRole(raw: unknown): UserRoleName {
  if (typeof raw !== 'string' || !raw.trim()) return 'Student';
  const trimmed = raw.trim();
  if (isUserRoleName(trimmed)) return trimmed;
  const aliased = LEGACY_ROLE_ALIASES[trimmed];
  if (aliased) return aliased;
  return 'Student';
}

export function isContentManagerRole(role: string | undefined): boolean {
  return normalizeUserRole(role) === 'Content Manager';
}

export function isBillingRole(role: string | undefined): boolean {
  return normalizeUserRole(role) === 'Billing';
}

export function isQadRole(role: string | undefined): boolean {
  return normalizeUserRole(role) === 'QAD';
}

export function isAdminRole(role: string | undefined): boolean {
  return normalizeUserRole(role) === 'Admin';
}

/** Admin Desk / privileged APIs (includes QAD). */
export function isStaffRoleName(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  const r = normalizeUserRole(role);
  return r === 'Admin' || r === 'Content Manager' || r === 'Billing' || r === 'QAD';
}

/** Questions / mocks / formulas. */
export function canManageQuestionsRole(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  const r = normalizeUserRole(role);
  return r === 'Admin' || r === 'Content Manager';
}

/** Payments / entitlements / billing promos. */
export function canManageBillingRole(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  const r = normalizeUserRole(role);
  return r === 'Admin' || r === 'Billing';
}

/** Daily Quick stub / future uploads. */
export function canManageDailyQuickRole(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  const r = normalizeUserRole(role);
  return r === 'Admin' || r === 'QAD';
}

/** Publish Daily Quick to landing/home — QAD or Admin. */
export function canApproveDailyQuickRole(role: string | undefined, isBootstrap = false): boolean {
  if (isBootstrap) return true;
  const r = normalizeUserRole(role);
  return r === 'Admin' || r === 'QAD';
}

export function isPrivilegedRoleName(role: string | undefined): boolean {
  return isStaffRoleName(role, false);
}
