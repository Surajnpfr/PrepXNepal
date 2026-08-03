import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'px-btn-primary',
  secondary: 'px-btn-secondary',
  ghost: 'px-btn-ghost',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-btn-sm',
  md: '',
  lg: 'px-btn-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      className = '',
      type = 'button',
      children,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={[
        'px-btn',
        variantClass[variant],
        sizeClass[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
