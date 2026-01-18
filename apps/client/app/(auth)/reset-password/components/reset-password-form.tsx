'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { GlassContainer } from '@/shared/components/ui/glass-container';
import { resetPasswordAction } from '../actions';

function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Reset Password
    </Button>
  );
}

export function ResetPasswordForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token') || '';
  const [state, formAction] = useActionState(resetPasswordAction, null);

  useEffect(() => {
    if (!resetToken) {
      toast.error('Invalid reset session');
      router.push('/forgot-password');
    }
  }, [resetToken, router]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success('Password reset successfully! Please log in.');
      router.push('/login');
    }
  }, [state, router]);

  return (
    <div className="w-full max-w-lg animate-fade-up">
      <GlassContainer>
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tighter leading-none">
              Set new password
            </h1>
            <p className="text-lg text-surface-dim leading-relaxed">
              Choose a strong password for your account
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="resetToken" value={resetToken} />

            <Input
              name="password"
              type="password"
              label="New Password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              error={state?.errors?.password?.[0]}
            />

            <Input
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              error={state?.errors?.confirmPassword?.[0]}
            />

            <div className="text-sm text-surface-dim space-y-1">
              <p className="font-medium">Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            <SubmitButton />
          </form>
        </div>
      </GlassContainer>
    </div>
  );
}
