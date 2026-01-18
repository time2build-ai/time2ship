'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { OTPInput } from '@/shared/components/ui/otp-input';
import { GlassContainer } from '@/shared/components/ui/glass-container';
import { verifyOtpAction, resendOtpAction } from '../actions';

function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Verify Code
    </Button>
  );
}

function getResendButtonText(resending: boolean, cooldown: number): string {
  if (resending) return 'Sending...';
  if (cooldown > 0) return `Resend (${cooldown}s)`;
  return 'Resend';
}

export function VerifyOTPForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [state, formAction] = useActionState(verifyOtpAction, null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      setOtp(''); // Clear OTP on error
      submittingRef.current = false; // Reset submission flag on error
    }
    if (state?.resetToken) {
      toast.success('Code verified!');
      // Pass reset token via URL state
      router.push(`/reset-password?token=${state.resetToken}`);
    }
  }, [state, router]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOtpComplete = (): void => {
    // Prevent multiple submissions
    if (submittingRef.current) return;

    submittingRef.current = true;
    // Auto-submit when OTP is complete
    const form = document.querySelector('form') as HTMLFormElement;
    form?.requestSubmit();
  };

  const handleResend = async (): Promise<void> => {
    if (cooldown > 0 || resending || !email) return;

    setResending(true);
    submittingRef.current = false; // Reset submission flag when resending
    try {
      const result = await resendOtpAction(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('New code sent! Check your email.');
        setCooldown(30); // 30 second cooldown
        setOtp(''); // Clear current OTP
      }
    } catch (error) {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-lg animate-fade-up">
      <GlassContainer>
        <div className="space-y-8">
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
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="font-medium text-accent-primary hover:text-accent-primary-soft disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {getResendButtonText(resending, cooldown)}
              </button>
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
      </GlassContainer>
    </div>
  );
}
