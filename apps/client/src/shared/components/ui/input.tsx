import { InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/shared/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | { code?: string; message: string };
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, ...props }, ref) {
    const errorMessage = typeof error === 'string' ? error : error?.message;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium tracking-wide text-surface-dim"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3',
            'bg-ink text-surface',
            'border border-ink-subtle',
            'rounded-md',
            'placeholder:text-surface-dim/50',
            'focus:border-accent-primary',
            'focus:ring-2 focus:ring-accent-glow',
            'transition-all duration-150 ease-out',
            'outline-none',
            '[color-scheme:dark]',
            error && 'border-accent-error focus:border-accent-error focus:ring-accent-error/15',
            className
          )}
          {...props}
        />
        {errorMessage && <p className="text-sm text-accent-error">{errorMessage}</p>}
      </div>
    );
  }
);
