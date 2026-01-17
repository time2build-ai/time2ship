'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { loginAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Log In
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your account
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

        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={state?.errors?.password?.[0]}
        />

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-black hover:underline dark:text-white">
          Sign up
        </Link>
      </p>
    </div>
  );
}
