import React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * Icon size scale (Linear / Stripe / GitHub style):
 * - btn  → 16px  (buttons, dense chips)
 * - nav  → 18px  (sidebar / primary nav)
 * - md   → 16px  (inline with body text)
 * - card → 20px  (section / card headers)
 * - lg   → 24px  (page headers, empty states)
 */
export type AppIconSize = 'btn' | 'nav' | 'md' | 'card' | 'lg';

const SIZE_PX: Record<AppIconSize, number> = {
  btn: 16,
  nav: 18,
  md: 16,
  card: 20,
  lg: 24,
};

/** Default stroke matches Lucide outline look (~1.5–2px). */
export const APP_ICON_STROKE = 1.75;

export type AppIconProps = Omit<LucideProps, 'ref' | 'size' | 'strokeWidth'> & {
  icon: LucideIcon;
  size?: AppIconSize;
  /** Override stroke; prefer leaving default for consistency. */
  strokeWidth?: number;
};

/**
 * Single icon entry point: outline Lucide, currentColor, consistent size/stroke.
 */
export const AppIcon: React.FC<AppIconProps> = ({
  icon: Icon,
  size = 'md',
  strokeWidth = APP_ICON_STROKE,
  className = '',
  'aria-hidden': ariaHidden = true,
  ...rest
}) => (
  <Icon
    size={SIZE_PX[size]}
    strokeWidth={strokeWidth}
    absoluteStrokeWidth={false}
    aria-hidden={ariaHidden}
    className={['shrink-0 text-current', className].filter(Boolean).join(' ')}
    {...rest}
  />
);

AppIcon.displayName = 'AppIcon';
