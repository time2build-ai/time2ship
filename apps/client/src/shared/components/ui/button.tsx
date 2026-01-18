import { ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/shared/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-accent-primary hover:bg-accent-primary-soft text-white hover:shadow-glow',
  secondary: 'bg-transparent hover:bg-ink-subtle text-surface border border-ink-subtle hover:border-surface-dim',
  ghost: 'bg-transparent hover:bg-ink-subtle text-surface-dim hover:text-surface',
  outline: 'bg-transparent hover:bg-ink-subtle text-surface border border-ink-subtle hover:border-surface-dim',
} as const;

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    children,
    disabled,
    ...props
  }, ref) {
    const isDisabled = loading || disabled;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'font-medium tracking-wide',
          'rounded-full',
          'transition-all duration-150 ease-out',
          'active:scale-[0.98]',
          'cursor-pointer',
          sizeStyles[size],
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
