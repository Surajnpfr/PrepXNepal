import assert from 'node:assert/strict';
import {
  mapClerkUserToProfile,
  buildPublicMetadataPatch,
  isStaffRole,
  canModeratePaymentClaims,
  isPrivilegedRole,
  requiresRoleChangeConfirmation,
  ROLE_CONFIRM_PHRASE,
  BOOTSTRAP_ADMIN_EMAIL,
  GUEST_PROFILE,
} from '../src/lib/clerkUserMapper.ts';
import { normalizeUserRole } from '../src/lib/userRoles.ts';

function testMapStudentDefaults() {
  const profile = mapClerkUserToProfile({
    id: 'user_abc',
    fullName: 'Test Student',
    imageUrl: 'https://example.com/a.png',
    primaryEmailAddress: { emailAddress: 'student@example.com' },
    publicMetadata: {},
    unsafeMetadata: {},
  });
  assert.equal(profile.clerkId, 'user_abc');
  assert.equal(profile.email, 'student@example.com');
  assert.equal(profile.role, 'Student');
  assert.equal(profile.plan, 'Free');
  assert.equal(profile.mocksRemaining, 3);
  assert.equal(profile.examDate, '');
  assert.equal(profile.isClerkLive, true);
  assert.equal(profile.id, 'usr-clerk-user_abc');
  assert.equal(profile.createdAt, undefined);
}

function testMapJoinDateAndPromoExpiry() {
  const joined = Date.parse('2026-08-01T10:15:30.000Z');
  const active = mapClerkUserToProfile({
    id: 'user_promo',
    fullName: 'Promo User',
    imageUrl: '',
    primaryEmailAddress: { emailAddress: 'promo@example.com' },
    createdAt: joined,
    publicMetadata: {
      plan: 'Premium',
      planExpiresAt: '2026-10-25T00:00:00.000Z',
    },
  });
  assert.equal(active.plan, 'Premium');
  assert.equal(active.createdAt, '2026-08-01T10:15:30.000Z');
  assert.equal(active.planExpiresAt, '2026-10-25T00:00:00.000Z');

  const expired = mapClerkUserToProfile({
    id: 'user_expired',
    fullName: 'Expired User',
    imageUrl: '',
    primaryEmailAddress: { emailAddress: 'expired@example.com' },
    publicMetadata: {
      plan: 'Unlimited',
      planExpiresAt: '2020-01-01T00:00:00.000Z',
    },
  });
  assert.equal(expired.plan, 'Free', 'expired promo session falls back to Free');
}

function testMapBootstrapAdmin() {
  const profile = mapClerkUserToProfile({
    id: 'user_admin',
    fullName: 'Suraj Nepal',
    imageUrl: '',
    primaryEmailAddress: { emailAddress: BOOTSTRAP_ADMIN_EMAIL },
    publicMetadata: {},
  });
  assert.equal(profile.role, 'Admin');
  assert.equal(profile.plan, 'Unlimited');
  assert.equal(profile.mocksRemaining, null);
  assert.ok(isStaffRole(profile));
}

function testPublicOverridesUnsafe() {
  const profile = mapClerkUserToProfile({
    id: 'user_x',
    fullName: 'Meta User',
    imageUrl: '',
    primaryEmailAddress: { emailAddress: 'x@example.com' },
    unsafeMetadata: { plan: 'Free', role: 'Student', studyCoinBalance: 1 },
    publicMetadata: { plan: 'Premium', role: 'Admin', studyCoinBalance: 50, lastMockScore: 170 },
  });
  assert.equal(profile.plan, 'Premium');
  assert.equal(profile.role, 'Admin');
  assert.equal(profile.studyCoinBalance, 50);
  assert.equal(profile.lastMockScore, 170);
  assert.equal(profile.mocksRemaining, 15);
}

function testLegacyRoleAliases() {
  assert.equal(normalizeUserRole('Moderator (Questions)'), 'Content Manager');
  assert.equal(normalizeUserRole('Moderator (Billing)'), 'Billing');
  assert.equal(normalizeUserRole('Moderator'), 'Content Manager');
  assert.equal(normalizeUserRole('QAD'), 'QAD');

  const legacy = mapClerkUserToProfile({
    id: 'user_legacy',
    fullName: 'Legacy Mod',
    imageUrl: '',
    primaryEmailAddress: { emailAddress: 'legacy@example.com' },
    publicMetadata: { role: 'Moderator (Questions)' },
  });
  assert.equal(legacy.role, 'Content Manager');
  assert.ok(isStaffRole(legacy));
  assert.equal(canModeratePaymentClaims(legacy), false);
}

function testPatchBuilder() {
  const patch = buildPublicMetadataPatch({
    plan: 'Unlimited',
    role: 'Billing',
    mocksRemaining: null,
    studyCoinBalance: 12,
    lastPercentile: 98.5,
  });
  assert.deepEqual(patch, {
    plan: 'Unlimited',
    role: 'Billing',
    mocksRemaining: null,
    studyCoinBalance: 12,
    lastPercentile: 98.5,
  });

  // Legacy input normalized on write
  const legacyPatch = buildPublicMetadataPatch({ role: 'Moderator (Billing)' as any });
  assert.equal(legacyPatch.role, 'Billing');
}

function testGuestNotStaff() {
  assert.equal(isStaffRole(GUEST_PROFILE), false);
  assert.equal(canModeratePaymentClaims(GUEST_PROFILE), false);
  assert.equal(GUEST_PROFILE.isClerkLive, false);
}

function testBillingModerationRoles() {
  assert.equal(canModeratePaymentClaims({ email: 'a@b.com', role: 'Admin' }), true);
  assert.equal(canModeratePaymentClaims({ email: 'a@b.com', role: 'Billing' }), true);
  assert.equal(
    canModeratePaymentClaims({ email: 'a@b.com', role: 'Content Manager' }),
    false
  );
  assert.equal(canModeratePaymentClaims({ email: 'a@b.com', role: 'QAD' }), false);
  assert.equal(canModeratePaymentClaims({ email: 'a@b.com', role: 'Student' }), false);
  assert.equal(
    canModeratePaymentClaims({ email: BOOTSTRAP_ADMIN_EMAIL, role: 'Student' }),
    true
  );
}

function testRoleConfirmationPolicy() {
  assert.equal(isPrivilegedRole('Admin'), true);
  assert.equal(isPrivilegedRole('Content Manager'), true);
  assert.equal(isPrivilegedRole('QAD'), true);
  assert.equal(isPrivilegedRole('Student'), false);

  assert.equal(requiresRoleChangeConfirmation('Student', 'Student'), false);
  assert.equal(requiresRoleChangeConfirmation('Student', 'Admin'), true);
  assert.equal(requiresRoleChangeConfirmation('Admin', 'Student'), true);
  assert.equal(requiresRoleChangeConfirmation('Content Manager', 'Billing'), true);
  assert.equal(ROLE_CONFIRM_PHRASE, 'CONFIRM ROLE');
}

testMapStudentDefaults();
testMapJoinDateAndPromoExpiry();
testMapBootstrapAdmin();
testPublicOverridesUnsafe();
testLegacyRoleAliases();
testPatchBuilder();
testGuestNotStaff();
testBillingModerationRoles();
testRoleConfirmationPolicy();
console.log('clerkUserMapper tests passed');
