import React from 'react';

type BrandLogoProps = {
  size?: number;
  className?: string;
  alt?: string;
  /** Prefer public URL so favicon/landing share the same asset. */
  decorative?: boolean;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 36,
  className = '',
  alt = 'PrepX Nepal',
  decorative = false,
}) => (
  <img
    src="/logo.png"
    width={size}
    height={size}
    alt={decorative ? '' : alt}
    aria-hidden={decorative || undefined}
    className={['object-contain shrink-0 select-none', className].filter(Boolean).join(' ')}
    decoding="async"
  />
);
