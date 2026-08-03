import React from 'react';

type BadgeTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClass: Record<BadgeTone, string> = {
  primary: 'px-badge-primary',
  success: 'px-badge-success',
  warning: 'px-badge-warning',
  error: 'px-badge-error',
  neutral: 'px-chip',
};

export const Badge: React.FC<BadgeProps> = ({
  tone = 'primary',
  className = '',
  children,
  ...rest
}) => (
  <span
    className={[tone === 'neutral' ? 'px-chip' : `px-badge ${toneClass[tone]}`, className]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </span>
);
