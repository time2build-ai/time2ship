'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { forgotPasswordAction } from '../actions';

function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Send Reset Code
    </Button>
  );
}

export function ForgotPasswordForm(): React.ReactElement {
  const router = useRouter();
  const [state, formAction] = useActionState(forgotPasswordAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success && state?.email) {
      toast.success('Reset code sent! Check your email.');
      router.push(`/verify-otp?email=${encodeURIComponent(state.email)}`);
    }
  }, [state, router]);

  return (
    <div className="w-full max-w-lg space-y-8 animate-fade-up">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tighter leading-none">
          Reset your password
        </h1>
        <p className="text-lg text-surface-dim leading-relaxed">
          Enter your email and we'll send you a code
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={state?.errors?.email?.[0]}
        />

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-surface-dim tracking-wide">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-accent-primary hover:text-accent-primary-soft transition-colors duration-150 ease-out"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
