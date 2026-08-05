import React, { useEffect, useState } from 'react';
import { ArrowRight, Banknote, Megaphone, X } from 'lucide-react';
import { AppIcon } from './ui';

export type AnnouncementBarVariant = 'default' | 'notice' | 'billing';

interface AnnouncementBarProps {
  message: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onDismiss?: () => void;
  /**
   * - notice: site-wide Admin notice (amber)
   * - billing: pending payment claims for Admin / Billing mods (rose)
   * - default: routine / personal banner (slate)
   */
  variant?: AnnouncementBarVariant;
}

const VARIANT_STYLES: Record<
  AnnouncementBarVariant,
  {
    shell: string;
    text: string;
    cta: string;
    dismiss: string;
    Icon: typeof Megaphone | typeof Banknote | null;
  }
> = {
  default: {
    shell:
      'max-w-7xl mx-auto rounded-xl px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 text-sm bg-slate-50 text-slate-700 border border-slate-200',
    text: 'font-medium min-w-0 truncate sm:whitespace-normal sm:line-clamp-2',
    cta: 'min-h-11 sm:min-h-0 px-2 text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-sm inline-flex items-center gap-1 cursor-pointer transition-colors',
    dismiss:
      'touch-target inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer',
    Icon: null,
  },
  notice: {
    shell:
      'max-w-7xl mx-auto rounded-xl px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 text-sm bg-amber-500 text-slate-950 border border-amber-600 shadow-sm',
    text: 'font-semibold min-w-0 truncate sm:whitespace-normal sm:line-clamp-2 inline-flex items-start gap-2',
    cta: 'min-h-11 sm:min-h-0 px-3 py-1.5 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-800 font-semibold text-sm inline-flex items-center gap-1 cursor-pointer transition-colors',
    dismiss:
      'touch-target inline-flex items-center justify-center p-2 text-slate-900/70 hover:text-slate-950 rounded-lg hover:bg-amber-400/80 transition-colors cursor-pointer',
    Icon: Megaphone,
  },
  billing: {
    shell:
      'max-w-7xl mx-auto rounded-xl px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 text-sm bg-rose-600 text-white border border-rose-700 shadow-sm',
    text: 'font-semibold min-w-0 truncate sm:whitespace-normal sm:line-clamp-2 inline-flex items-start gap-2',
    cta: 'min-h-11 sm:min-h-0 px-3 py-1.5 rounded-lg bg-white text-rose-700 hover:bg-rose-50 font-semibold text-sm inline-flex items-center gap-1 cursor-pointer transition-colors',
    dismiss:
      'touch-target inline-flex items-center justify-center p-2 text-white/80 hover:text-white rounded-lg hover:bg-rose-500 transition-colors cursor-pointer',
    Icon: Banknote,
  },
};

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message,
  ctaLabel = 'Open',
  onCtaClick,
  onDismiss,
  variant = 'default',
}) => {
  const [dismissed, setDismissed] = useState(false);
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const LeadingIcon = styles.Icon;

  // New message / notice should reappear even if a prior banner was dismissed.
  useEffect(() => {
    setDismissed(false);
  }, [message, variant]);

  if (dismissed || !message) return null;

  return (
    <div className="mx-3 sm:mx-6 my-2 font-sans">
      <div className={styles.shell} role={variant === 'billing' ? 'status' : undefined}>
        <p className={styles.text}>
          {LeadingIcon ? (
            <AppIcon icon={LeadingIcon} size="btn" className="shrink-0 mt-0.5" />
          ) : null}
          <span className="min-w-0">{message}</span>
        </p>

        <div className="flex items-center justify-end gap-2 shrink-0">
          {onCtaClick && (
            <button type="button" onClick={onCtaClick} className={styles.cta}>
              <span>{ctaLabel}</span>
              <AppIcon icon={ArrowRight} size="btn" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className={styles.dismiss}
            aria-label="Dismiss notification"
          >
            <AppIcon icon={X} size="btn" />
          </button>
        </div>
      </div>
    </div>
  );
};
