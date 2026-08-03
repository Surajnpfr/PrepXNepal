import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...rest }, ref) => (
    <input ref={ref} className={['px-input', className].filter(Boolean).join(' ')} {...rest} />
  )
);

Input.displayName = 'Input';

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', ...rest }, ref) => (
    <textarea
      ref={ref}
      className={['px-input py-2.5 min-h-24', className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
);

TextArea.displayName = 'TextArea';
