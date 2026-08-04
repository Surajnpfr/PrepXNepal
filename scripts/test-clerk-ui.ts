import assert from 'node:assert/strict';
import { CLERK_AFTER_AUTH_PATH, CLERK_SOFT_REDIRECT, clerkAppearance } from '../src/lib/clerkUi.ts';

assert.equal(CLERK_AFTER_AUTH_PATH, '/home');
assert.equal(CLERK_SOFT_REDIRECT.fallbackRedirectUrl, '/home');
assert.equal(CLERK_SOFT_REDIRECT.signUpFallbackRedirectUrl, '/home');

const softKeys = Object.keys(CLERK_SOFT_REDIRECT);
assert.ok(!softKeys.includes('forceRedirectUrl'));
assert.ok(!softKeys.includes('signUpForceRedirectUrl'));
assert.ok(!softKeys.some((k) => k.toLowerCase().includes('force')));

assert.equal(clerkAppearance.variables.colorPrimary, '#2563EB');
assert.equal(clerkAppearance.elements.modalBackdrop.zIndex, '300');

console.log('clerkUi soft-redirect tests passed');
