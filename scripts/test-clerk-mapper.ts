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

function testPatchBuilder() {
  const patch = buildPublicMetadataPatch({
    plan: 'Unlimited',
    role: 'Moderator (Billing)',
    mocksRemaining: null,
    studyCoinBalance: 12,
    lastPercentile: 98.5,
  });
  assert.deepEqual(patch, {
    plan: 'Unlimited',
    role: 'Moderator (Billing)',
    mocksRemaining: null,
    studyCoinBalance: 12,
    lastPercentile: 98.5,
  });
}

function testGuestNotStaff() {
  assert.equal(isStaffRole(GUEST_PROFILE), false);
  assert.equal(canModeratePaymentClaims(GUEST_PROFILE), false);
  assert.equal(GUEST_PROFILE.isClerkLive, false);
}

function testBillingModerationRoles() {
  assert.equal(canModeratePaymentClaims({ email: 'a@b.com', role: 'Admin' }), true);
  assert.equal(
    canModeratePaymentClaims({ email: 'a@b.com', role: 'Moderator (Billing)' }),
    true
  );
  assert.equal(
    canModeratePaymentClaims({ email: 'a@b.com', role: 'Moderator (Questions)' }),
    false
  );
  assert.equal(canModeratePaymentClaims({ email: 'a@b.com', role: 'Student' }), false);
  assert.equal(
    canModeratePaymentClaims({ email: BOOTSTRAP_ADMIN_EMAIL, role: 'Student' }),
    true
  );
}

function testRoleConfirmationPolicy() {
  assert.equal(isPrivilegedRole('Admin'), true);
  assert.equal(isPrivilegedRole('Moderator (Questions)'), true);
  assert.equal(isPrivilegedRole('Student'), false);

  assert.equal(requiresRoleChangeConfirmation('Student', 'Student'), false);
  assert.equal(requiresRoleChangeConfirmation('Student', 'Admin'), true);
  assert.equal(requiresRoleChangeConfirmation('Admin', 'Student'), true);
  assert.equal(
    requiresRoleChangeConfirmation('Moderator (Questions)', 'Moderator (Billing)'),
    true
  );
  assert.equal(ROLE_CONFIRM_PHRASE, 'CONFIRM ROLE');
}

testMapStudentDefaults();
testMapBootstrapAdmin();
testPublicOverridesUnsafe();
testPatchBuilder();
testGuestNotStaff();
testBillingModerationRoles();
testRoleConfirmationPolicy();
console.log('clerkUserMapper tests passed');
