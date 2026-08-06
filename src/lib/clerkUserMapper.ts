import type { PlanTier, UserProfile, UserRole } from '../types';
import {
  canManageBillingRole,
  isPrivilegedRoleName,
  isStaffRoleName,
  normalizeUserRole,
} from './userRoles';

export const BOOTSTRAP_ADMIN_EMAIL = 'surajnepal2058@gmail.com';

export const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Guest',
  email: '',
  role: 'Student',
  targetScore: 160,
  targetExam: 'Nepal CEE',
  examDate: '',
  plan: 'Free',
  mocksRemaining: 0,
  studyCoinBalance: 0,
  preferredLanguage: 'en',
  darkTheme: false,
  avatarUrl: '',
  isClerkLive: false,
};

export type ClerkMetaSource = {
  id: string;
  fullName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl: string;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses?: Array<{ emailAddress: string }>;
  publicMetadata?: Record<string, unknown> | null;
  unsafeMetadata?: Record<string, unknown> | null;
};

function firstEmail(user: ClerkMetaSource): string {
  return (
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    ''
  );
}

function displayName(user: ClerkMetaSource, email: string): string {
  if (user.fullName?.trim()) return user.fullName.trim();
  const joined = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (joined) return joined;
  if (email) return email.split('@')[0];
  return 'Clerk User';
}

function defaultMocks(plan: PlanTier): number | null {
  // Seed only — server resolvePlanQuota + /api/plan-entitlements are authoritative at runtime.
  if (plan === 'Unlimited') return null;
  if (plan === 'Premium') return 15;
  return 3;
}

/** Map a Clerk user (client or Backend API shape) into app UserProfile. Clerk is source of truth. */
export function mapClerkUserToProfile(user: ClerkMetaSource): UserProfile {
  const email = firstEmail(user);
  // Entitlements from publicMetadata only — never trust unsafeMetadata for authz.
  const meta = { ...(user.publicMetadata || {}) };

  const isBootstrapAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const plan = (meta.plan as PlanTier) || (isBootstrapAdmin ? 'Unlimited' : 'Free');
  const role: UserRole = isBootstrapAdmin
    ? 'Admin'
    : normalizeUserRole(meta.role);
  const mocksRemaining =
    meta.mocksRemaining !== undefined
      ? (meta.mocksRemaining as number | null)
      : defaultMocks(plan);
  const studyCoinBalance =
    typeof meta.studyCoinBalance === 'number' ? meta.studyCoinBalance : isBootstrapAdmin ? 9999 : 0;

  return {
    id: `usr-clerk-${user.id}`,
    clerkId: user.id,
    name: displayName(user, email),
    email,
    role,
    targetScore: typeof meta.targetScore === 'number' ? meta.targetScore : 160,
    targetExam: (meta.targetExam as UserProfile['targetExam']) || 'Nepal CEE',
    examDate: typeof meta.examDate === 'string' ? meta.examDate : '',
    plan,
    mocksRemaining,
    studyCoinBalance,
    preferredLanguage: meta.preferredLanguage === 'ne' ? 'ne' : 'en',
    darkTheme: Boolean(meta.darkTheme),
    avatarUrl: user.imageUrl || '',
    isClerkLive: true,
    lastMockScore: typeof meta.lastMockScore === 'number' ? meta.lastMockScore : undefined,
    lastPercentile: typeof meta.lastPercentile === 'number' ? meta.lastPercentile : undefined,
  };
}

export function buildPublicMetadataPatch(profile: Partial<UserProfile>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (profile.plan !== undefined) patch.plan = profile.plan;
  if (profile.role !== undefined) patch.role = normalizeUserRole(profile.role);
  if (profile.mocksRemaining !== undefined) patch.mocksRemaining = profile.mocksRemaining;
  if (profile.studyCoinBalance !== undefined) patch.studyCoinBalance = profile.studyCoinBalance;
  if (profile.targetScore !== undefined) patch.targetScore = profile.targetScore;
  if (profile.targetExam !== undefined) patch.targetExam = profile.targetExam;
  if (profile.examDate !== undefined) patch.examDate = profile.examDate;
  if (profile.preferredLanguage !== undefined) patch.preferredLanguage = profile.preferredLanguage;
  if (profile.darkTheme !== undefined) patch.darkTheme = profile.darkTheme;
  if (profile.lastMockScore !== undefined) patch.lastMockScore = profile.lastMockScore;
  if (profile.lastPercentile !== undefined) patch.lastPercentile = profile.lastPercentile;
  return patch;
}

/** Student-safe prefs only (server rejects coins/quota/role/plan from self). */
export function buildStudentSelfPatch(profile: Partial<UserProfile>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (profile.targetScore !== undefined) patch.targetScore = profile.targetScore;
  if (profile.targetExam !== undefined) patch.targetExam = profile.targetExam;
  if (profile.examDate !== undefined) patch.examDate = profile.examDate;
  if (profile.preferredLanguage !== undefined) patch.preferredLanguage = profile.preferredLanguage;
  if (profile.darkTheme !== undefined) patch.darkTheme = profile.darkTheme;
  return patch;
}

export function isStaffRole(profile: Pick<UserProfile, 'email' | 'role'>): boolean {
  return isStaffRoleName(
    profile.role,
    profile.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );
}

/** Admin + Billing (and bootstrap) — payment claim moderation. */
export function canModeratePaymentClaims(
  profile: Pick<UserProfile, 'email' | 'role'>
): boolean {
  return canManageBillingRole(
    profile.role,
    profile.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );
}

/** Elevated roles that grant Admin Desk / privileged APIs. */
export function isPrivilegedRole(role: UserRole): boolean {
  return isPrivilegedRoleName(role);
}

/**
 * Role mutations that elevate into (or change between) staff roles require
 * explicit operator confirmation before writing Clerk publicMetadata.
 */
export function requiresRoleChangeConfirmation(from: UserRole, to: UserRole): boolean {
  if (from === to) return false;
  return isPrivilegedRole(to) || isPrivilegedRole(from);
}

export const ROLE_CONFIRM_PHRASE = 'CONFIRM ROLE';

