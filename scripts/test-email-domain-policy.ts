/**
 * Email domain policy tests.
 * Run: npx tsx scripts/test-email-domain-policy.ts
 */
import {
  evaluateEmailDomain,
  emailDomainPolicyFromEnv,
} from '../server/emailDomainPolicy.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(evaluateEmailDomain('student@gmail.com').ok, 'gmail ok');
const yop = evaluateEmailDomain('a@yopmail.com');
assert(yop.ok === false, 'yopmail blocked');
assert(yop.ok === false && yop.reason === 'disposable', 'yopmail disposable');
assert(evaluateEmailDomain('bad').ok === false, 'invalid');

const allowOnly = evaluateEmailDomain('x@gmail.com', {
  blockDisposable: true,
  allowedDomains: ['gmail.com', 'edu.np'],
});
assert(allowOnly.ok, 'gmail in allowlist');

const blockedAllow = evaluateEmailDomain('x@hotmail.com', {
  allowedDomains: ['gmail.com'],
});
assert(blockedAllow.ok === false && blockedAllow.reason === 'not_allowed', 'hotmail not allowed');

const policy = emailDomainPolicyFromEnv({ EMAIL_BLOCK_DISPOSABLE: 'true' } as NodeJS.ProcessEnv);
assert(policy.blockDisposable === true, 'default block on');

console.log('test-email-domain-policy: OK');
