'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { OTPInput } from '@/shared/components/ui/otp-input';
import { verifyOtpAction } from '../actions';

function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Verify Code
    </Button>
  );
}

export function VerifyOTPForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [state, formAction] = useActionState(verifyOtpAction, null);

  // Don't redirect immediately - wait to ensure email param is missing
  // (Prevents redirect during initial render before searchParams loads)
  useEffect(() => {
    // Only redirect if we've mounted and there's definitely no email
    const timeoutId = setTimeout(() => {
      if (!email) {
        router.push('/forgot-password');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [email, router]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      setOtp(''); // Clear OTP on error
    }
    if (state?.resetToken) {
      toast.success('Code verified!');
      // Pass reset token via URL state
      router.push(`/reset-password?token=${state.resetToken}`);
    }
  }, [state, router]);

  const handleOtpComplete = (): void => {
    // Auto-submit when OTP is complete
    const form = document.querySelector('form') as HTMLFormElement;
    form?.requestSubmit();
  };

  return (
    <div className="w-full max-w-lg space-y-8 animate-fade-up">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tighter leading-none">
          Enter verification code
        </h1>
        <p className="text-lg text-surface-dim leading-relaxed">
          We sent a code to <strong>{email}</strong>
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="otp" value={otp} />

        <OTPInput
          value={otp}
          onChange={setOtp}
          onComplete={handleOtpComplete}
          error={state?.errors?.otp?.[0]}
        />

        <SubmitButton />
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-surface-dim">
          Didn't receive a code?{' '}
          <Link
            href="/forgot-password"
            className="font-medium text-accent-primary hover:text-accent-primary-soft"
          >
            Resend
          </Link>
        </p>
        <p className="text-sm text-surface-dim">
          <Link
            href="/login"
            className="font-medium text-accent-primary hover:text-accent-primary-soft"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
