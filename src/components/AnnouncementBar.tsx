import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { AppIcon } from './ui';

interface AnnouncementBarProps {
  message: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onDismiss?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message,
  ctaLabel = 'Open',
  onCtaClick,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !message) return null;

  return (
    <div className="mx-3 sm:mx-6 my-2 font-sans">
      <div className="max-w-7xl mx-auto bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 text-sm">
        <p className="text-slate-700 font-medium min-w-0 truncate sm:whitespace-normal sm:line-clamp-2">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 shrink-0">
          {onCtaClick && (
            <button
              type="button"
              onClick={onCtaClick}
              className="min-h-11 sm:min-h-0 px-2 text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-sm inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
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
            className="touch-target inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <AppIcon icon={X} size="btn" />
          </button>
        </div>
      </div>
    </div>
  );
};
