import { cn } from '@/shared/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          variant === 'primary' &&
            'bg-black text-white hover:bg-gray-800 focus:ring-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200',
          variant === 'secondary' &&
            'bg-gray-200 text-black hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
          variant === 'outline' &&
            'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-400 dark:border-gray-600 dark:hover:bg-gray-800',
          (loading || disabled) && 'cursor-not-allowed opacity-50',
          className
        )}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
