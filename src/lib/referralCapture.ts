/** Persist ?ref= across Clerk modal redirects (session-scoped). */

const STORAGE_KEY = 'prepx_referral_code';

export function captureReferralCodeFromLocation(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('ref')?.trim().toLowerCase() || null;
    if (fromUrl && /^[a-z0-9_-]{4,32}$/.test(fromUrl)) {
      sessionStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && /^[a-z0-9_-]{4,32}$/.test(stored)) return stored;
    return null;
  } catch {
    return null;
  }
}

export function peekStoredReferralCode(): string | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && /^[a-z0-9_-]{4,32}$/.test(stored)) return stored;
    return null;
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
