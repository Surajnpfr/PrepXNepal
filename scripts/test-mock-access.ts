import assert from 'node:assert/strict';
import {
  FREE_PLAN_ALLOWED_MOCK_ID,
  assertFreePlanMockAccess,
  assertFreePlanPracticeAccess,
  isFreePlanAllowedMock,
} from '../server/mockAccessDomain.ts';

assert.equal(FREE_PLAN_ALLOWED_MOCK_ID, 'mock-set-seta');
assert.equal(isFreePlanAllowedMock('mock-set-seta'), true);
assert.equal(isFreePlanAllowedMock('mock-set-sett'), false);

assert.equal(assertFreePlanMockAccess('Free', 'mock-set-seta').ok, true);
assert.equal(assertFreePlanMockAccess('Free', 'mock-set-sett').ok, false);
assert.equal(assertFreePlanMockAccess('Premium', 'mock-set-sett').ok, true);
assert.equal(assertFreePlanMockAccess('Unlimited', 'mock-set-sets').ok, true);
assert.equal(assertFreePlanMockAccess('Free', 'mock-set-sett', { staffBypass: true }).ok, true);

assert.equal(assertFreePlanPracticeAccess('Free').ok, false);
assert.equal(assertFreePlanPracticeAccess('Premium').ok, true);
assert.equal(assertFreePlanPracticeAccess('Free', { staffBypass: true }).ok, true);

const denied = assertFreePlanMockAccess('Free', 'mock-set-setr');
assert.equal(denied.ok, false);
if (!denied.ok) {
  assert.equal(denied.status, 403);
  assert.match(denied.error, /SetA only/i);
}

console.log('mockAccessDomain tests passed');
