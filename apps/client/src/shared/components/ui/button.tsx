import { cn } from '@/shared/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-accent-primary hover:bg-accent-primary-soft text-white hover:shadow-glow',
  secondary: 'bg-transparent hover:bg-ink-subtle text-surface border border-ink-subtle hover:border-surface-dim',
  ghost: 'bg-transparent hover:bg-ink-subtle text-surface-dim hover:text-surface',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'primary', loading = false, className, children, disabled, ...props }, ref) {
    const isDisabled = loading || disabled;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'px-6 py-3',
          'text-sm font-medium tracking-wide',
          'rounded-md',
          'transition-all duration-150 ease-out',
          'active:scale-[0.98]',
          variantStyles[variant],
          isDisabled && 'cursor-not-allowed opacity-50',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    );
  }
);
