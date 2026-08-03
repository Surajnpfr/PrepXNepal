/**
 * Email domain policy — block disposable / temporary inboxes.
 * Primary enforcement should also be enabled in Clerk Dashboard (Rules).
 *
 * Env:
 * - EMAIL_BLOCK_DISPOSABLE=true|false (default true)
 * - EMAIL_ALLOWED_DOMAINS=gmail.com,yahoo.com,... (optional allowlist; if set, ONLY these + *.edu.np etc. patterns)
 * - EMAIL_BLOCKED_DOMAINS=extra-temp.com,... (optional extra blocklist)
 */

/** Well-known disposable / temporary inbox domains (lowercase). Not exhaustive. */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.org',
  'guerrillamail.net',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'throwaway.email',
  'yopmail.com',
  'yopmail.fr',
  'cool.in.th',
  'discard.email',
  'discardmail.com',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'mailnesia.com',
  'maildrop.cc',
  'getnada.com',
  'nada.email',
  '10minutemail.com',
  '10minutemail.net',
  'minutemail.com',
  'minuteinbox.com',
  'tempail.com',
  'fakeinbox.com',
  'mailcatch.com',
  'mailnull.com',
  'spamgourmet.com',
  'spam.la',
  'spamfree24.org',
  'moakt.com',
  'tmpmail.org',
  'tmpmail.net',
  'emailondeck.com',
  'getairmail.com',
  'mailtemp.net',
  'tempr.email',
  'dispostable.com',
  'mailforspam.com',
  'mytemp.email',
  'tempinbox.com',
  'inboxkitten.com',
  'burnermail.io',
  'guerrillamail.de',
  'spamobox.com',
  'tempmailo.com',
  'emailfake.com',
  'crazymailing.com',
  'mohmal.com',
  'tempmailaddress.com',
  'throwam.com',
  'mailpoof.com',
]);

export type EmailDomainDecision =
  | { ok: true; domain: string }
  | { ok: false; domain: string; reason: 'invalid' | 'disposable' | 'not_allowed' };

function parseCsvEnv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function extractEmailDomain(email: string): string | null {
  const trimmed = (email || '').trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;
  const domain = trimmed.slice(at + 1);
  if (!domain.includes('.') || domain.includes(' ')) return null;
  return domain;
}

function domainMatchesAllowlist(domain: string, allowed: string[]): boolean {
  for (const entry of allowed) {
    if (entry.startsWith('*.') && domain.endsWith(entry.slice(1))) return true;
    if (domain === entry) return true;
  }
  return false;
}

export type EmailDomainPolicyOptions = {
  blockDisposable?: boolean;
  allowedDomains?: string[];
  extraBlockedDomains?: string[];
};

export function evaluateEmailDomain(
  email: string,
  opts: EmailDomainPolicyOptions = {}
): EmailDomainDecision {
  const domain = extractEmailDomain(email);
  if (!domain) return { ok: false, domain: '', reason: 'invalid' };

  const blockDisposable = opts.blockDisposable !== false;
  const allowed = opts.allowedDomains || [];
  const extraBlocked = new Set(opts.extraBlockedDomains || []);

  if (extraBlocked.has(domain) || (blockDisposable && DISPOSABLE_EMAIL_DOMAINS.has(domain))) {
    return { ok: false, domain, reason: 'disposable' };
  }

  if (allowed.length > 0 && !domainMatchesAllowlist(domain, allowed)) {
    return { ok: false, domain, reason: 'not_allowed' };
  }

  return { ok: true, domain };
}

/** Load policy from process.env (server). */
export function emailDomainPolicyFromEnv(
  env: NodeJS.ProcessEnv = process.env
): EmailDomainPolicyOptions {
  const blockFlag = (env.EMAIL_BLOCK_DISPOSABLE || 'true').toLowerCase();
  return {
    blockDisposable: blockFlag !== 'false' && blockFlag !== '0',
    allowedDomains: parseCsvEnv(env.EMAIL_ALLOWED_DOMAINS),
    extraBlockedDomains: parseCsvEnv(env.EMAIL_BLOCKED_DOMAINS),
  };
}

export function emailDomainBlockedMessage(decision: Extract<EmailDomainDecision, { ok: false }>): string {
  if (decision.reason === 'invalid') {
    return 'A valid email address is required.';
  }
  if (decision.reason === 'disposable') {
    return 'Temporary or disposable email addresses are not allowed. Use a permanent email (e.g. Gmail, Outlook, Yahoo, or your school email).';
  }
  return 'That email domain is not authorized for PrepX Nepal. Use a supported permanent email provider.';
}
