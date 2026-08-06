import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AppIcon } from './AppIcon';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native select styled like `Input` / `.px-input`, with a consistent chevron.
 * `className` applies to the outer wrapper (width / layout).
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...rest }, ref) => (
    <div className={['relative min-w-0 w-full', className].filter(Boolean).join(' ')}>
      <select ref={ref} className="px-select" {...rest}>
        {children}
      </select>
      <AppIcon
        icon={ChevronDown}
        size="btn"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--px-muted)]"
        aria-hidden
      />
    </div>
  )
);

Select.displayName = 'Select';
