/**
 * Security policy + meta mutation regression tests (no live Clerk/DB).
 * Run: npx tsx scripts/verify-security-policies.ts
 */
import {
  applyMetaMutation,
  readMetaVersion,
  withUserLock,
} from '../server/clerkMeta.ts';
import { normalizeImageUrl } from '../server/questionsDomain.ts';
import {
  assertPatchBodyAllowed,
  isAllowedPlannerDateKey,
  nepalTodayDateKey,
  publicErrorMessage,
} from '../server/userPatchPolicy.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function expectFail(
  result: { ok: true } | { ok: false; error: string; status: number },
  status: number
) {
  assert(result.ok === false, 'expected failure');
  if (result.ok === false) {
    assert(result.status === status, `status ${result.status} != ${status}: ${result.error}`);
  }
}

// --- PATCH authz ---
const student = {
  role: 'Student',
  email: 's@example.com',
  userId: 'user_s',
  isBootstrap: false,
};
const qMod = {
  role: 'Moderator (Questions)',
  email: 'q@example.com',
  userId: 'user_q',
  isBootstrap: false,
};
const billing = {
  role: 'Moderator (Billing)',
  email: 'b@example.com',
  userId: 'user_b',
  isBootstrap: false,
};
const bootstrap = {
  role: 'Admin',
  email: 'admin@example.com',
  userId: 'user_admin',
  isBootstrap: true,
};

expectFail(assertPatchBodyAllowed(student, 'user_s', ['studyCoinBalance']), 403);
expectFail(assertPatchBodyAllowed(student, 'user_other', ['targetScore']), 403);
assert(assertPatchBodyAllowed(student, 'user_s', ['targetScore']).ok, 'student prefs ok');

expectFail(assertPatchBodyAllowed(qMod, 'user_q', ['plan']), 403);
expectFail(assertPatchBodyAllowed(qMod, 'user_other', ['plan']), 403);
expectFail(assertPatchBodyAllowed(qMod, 'user_other', ['targetScore']), 403);

assert(assertPatchBodyAllowed(billing, 'user_other', ['plan', 'studyCoinBalance']).ok, 'billing entitles others');
expectFail(assertPatchBodyAllowed(billing, 'user_b', ['plan']), 403);
expectFail(assertPatchBodyAllowed(billing, 'user_other', ['role']), 403);

assert(assertPatchBodyAllowed(bootstrap, 'user_admin', ['plan', 'role']).ok, 'bootstrap self entitlements');
assert(assertPatchBodyAllowed(bootstrap, 'user_other', ['role', 'plan']).ok, 'bootstrap role');

// --- Planner date ---
const today = nepalTodayDateKey();
assert(isAllowedPlannerDateKey(today), 'today allowed');
assert(!isAllowedPlannerDateKey('2020-01-01'), 'past date blocked');
assert(!isAllowedPlannerDateKey('not-a-date'), 'malformed blocked');

// --- Image URL hardening ---
assert(normalizeImageUrl('https://cdn.example.com/fig.png')?.startsWith('https://'), 'https ok');
assert(normalizeImageUrl('/images/a.png') === '/images/a.png', 'relative ok');
assert(normalizeImageUrl('javascript:alert(1)') === undefined, 'javascript blocked');
assert(normalizeImageUrl('https://evil.test/x.svg') === undefined, 'svg blocked');
assert(normalizeImageUrl('//evil.test/a.png') === undefined, 'protocol-relative blocked');
assert(normalizeImageUrl('https://user:pass@evil.test/a.png') === undefined, 'userinfo blocked');

// --- Meta mutation versioning ---
const applied = applyMetaMutation({ studyCoinBalance: 10, _v: 3 }, (draft) => {
  draft.studyCoinBalance = 20;
  return { ok: true, next: draft };
});
assert(applied.ok && readMetaVersion(applied.next) === 4, 'version bumps');

const denied = applyMetaMutation({ studyCoinBalance: 5 }, (draft) => ({
  ok: false,
  error: 'Insufficient coins',
  status: 402,
}));
assert(!denied.ok && denied.ok === false && denied.status === 402, 'mutator deny');

// --- Per-user lock serializes concurrent work ---
const order: number[] = [];
await Promise.all([
  withUserLock('u1', async () => {
    order.push(1);
    await new Promise((r) => setTimeout(r, 30));
    order.push(2);
  }),
  withUserLock('u1', async () => {
    order.push(3);
    order.push(4);
  }),
]);
assert(JSON.stringify(order) === JSON.stringify([1, 2, 3, 4]), `lock order was ${order}`);

assert(publicErrorMessage(new Error('ECONNREFUSED mysql'), 'safe') === 'safe', '500 sanitized');
const clientErr: any = new Error('Field not allowed: plan');
clientErr.status = 403;
assert(publicErrorMessage(clientErr, 'safe') === 'Field not allowed: plan', '4xx passthrough');

console.log('verify-security-policies: PASS');
