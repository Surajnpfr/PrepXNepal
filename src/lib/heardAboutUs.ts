/**
 * Client mirror of server/heardAboutUsDomain — signup attribution options.
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

/** Short chip labels for the signup picker. */
export const HEARD_ABOUT_US_OPTIONS: Array<{
  value: HeardAboutUs;
  label: string;
  hint: string;
  accent: string;
}> = [
  { value: 'instagram', label: 'Instagram', hint: 'Reels / posts', accent: 'bg-gradient-to-br from-fuchsia-500 to-amber-400' },
  { value: 'facebook', label: 'Facebook', hint: 'Feed / groups', accent: 'bg-[#1877F2]' },
  { value: 'google', label: 'Google', hint: 'Search / ads', accent: 'bg-emerald-600' },
  { value: 'youtube', label: 'YouTube', hint: 'Videos / shorts', accent: 'bg-[#FF0000]' },
  { value: 'tiktok', label: 'TikTok', hint: 'Short videos', accent: 'bg-slate-900' },
  { value: 'friend', label: 'Friend', hint: 'Word of mouth', accent: 'bg-sky-600' },
  { value: 'referral', label: 'Referral', hint: 'Invite link', accent: 'bg-violet-600' },
  { value: 'other', label: 'Other', hint: 'Somewhere else', accent: 'bg-slate-500' },
];

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
