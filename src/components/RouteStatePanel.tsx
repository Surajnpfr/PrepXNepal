import React from 'react';
import { AlertTriangle, Lock, FileQuestion } from 'lucide-react';
import { AppIcon } from './ui';

interface RouteStateProps {
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  icon?: 'not-found' | 'forbidden' | 'error';
}

const ICONS = {
  'not-found': FileQuestion,
  forbidden: Lock,
  error: AlertTriangle,
};

export const RouteStatePanel: React.FC<RouteStateProps> = ({
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  icon = 'not-found',
}) => {
  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 text-center">
        <div className="mx-auto w-11 h-11 rounded-xl bg-slate-100 text-slate-600 inline-flex items-center justify-center">
          <AppIcon icon={ICONS[icon]} size="card" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={onPrimary}
            className="min-h-11 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl cursor-pointer"
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="min-h-11 px-4 py-2 bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-xl cursor-pointer hover:bg-slate-50"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
