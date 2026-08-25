/**
 * Signup attribution — “How did you hear about us?”
 * Stored on Clerk publicMetadata after promotion from signup unsafeMetadata.
 */

export const HEARD_ABOUT_US_VALUES = [
  'instagram',
  'facebook',
  'google',
  'youtube',
  'tiktok',
  'friend',
  'referral',
  'other',
] as const;

export type HeardAboutUs = (typeof HEARD_ABOUT_US_VALUES)[number];

export const HEARD_ABOUT_US_LABELS: Record<HeardAboutUs, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  friend: 'Friend / Word of mouth',
  referral: 'Referral link',
  other: 'Other',
};

export function isHeardAboutUs(value: unknown): value is HeardAboutUs {
  return typeof value === 'string' && (HEARD_ABOUT_US_VALUES as readonly string[]).includes(value);
}

export function normalizeHeardAboutUs(raw: unknown): HeardAboutUs | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toLowerCase();
  return isHeardAboutUs(v) ? v : null;
}

export function heardAboutUsLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const n = normalizeHeardAboutUs(value);
  return n ? HEARD_ABOUT_US_LABELS[n] : value;
}
