import React from 'react';

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = '',
}) => (
  <div
    className={[
      'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6',
      className,
    ].join(' ')}
  >
    <div className="min-w-0">
      <h1 className="px-page-title text-balance">{title}</h1>
      {subtitle ? <p className="px-page-subtitle">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
  </div>
);

export type ProgressBarProps = {
  value: number;
  max?: number;
  className?: string;
  'aria-label'?: string;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  'aria-label': ariaLabel = 'Progress',
}) => {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : Math.round((value / max) * 100)));
  return (
    <div
      className={['px-progress', className].join(' ')}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
};
