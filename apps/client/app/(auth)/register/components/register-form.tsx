'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import { registerAction } from '../actions';

function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Create Account
    </Button>
  );
}

export function RegisterForm(): React.ReactElement {
  const [state, formAction] = useActionState(registerAction, null);

  useEffect(() => {
    if (!state?.error) return;
    toast.error(state.error);
  }, [state?.error]);

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tighter">Create an account</h1>
        <p className="text-base text-surface-dim">
          Get started with Time2Ship
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

        <div className="space-y-2">
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            error={state?.errors?.password?.[0]}
          />
          <p className="text-xs text-surface-dim tracking-wide">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-surface-dim">
        Already have an account?{' '}
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
