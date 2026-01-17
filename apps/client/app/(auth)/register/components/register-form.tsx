'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { registerAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Create Account
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get started with Time2Ship
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={state?.errors?.email?.[0]}
        />

        <div className="space-y-1">
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            error={state?.errors?.password?.[0]}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-black hover:underline dark:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
