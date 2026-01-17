'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/shared/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
}: OTPInputProps): React.ReactElement {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-submit when complete
  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = (index: number, digit: string): void => {
    // Only allow digits
    if (digit && !/^\d$/.test(digit)) return;

    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('');

    onChange(updatedValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);

    // Only accept if all characters are digits
    if (!/^\d+$/.test(pastedData)) return;

    onChange(pastedData.padEnd(length, '').slice(0, length));

    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              'w-12 h-14 text-center text-2xl font-semibold',
              'rounded-lg border-2 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary',
              error
                ? 'border-accent-error bg-accent-error/5'
                : 'border-ink-subtle bg-ink hover:border-surface-dim'
            )}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-accent-error text-center">{error}</p>
      )}
    </div>
  );
}
