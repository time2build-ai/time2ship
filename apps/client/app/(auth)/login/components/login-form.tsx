'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { GlassContainer } from '@/shared/components/ui/glass-container';

import { loginAction } from '../actions';

function SubmitButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Log In
    </Button>
  );
}

export function LoginForm(): React.ReactElement {
  const [state, formAction] = useActionState(loginAction, null);

  useEffect(() => {
    if (!state?.error) return;
    toast.error(state.error);
  }, [state?.error]);

  return (
    <div className="w-full max-w-lg animate-fade-up">
      <GlassContainer>
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tighter leading-none">
              Welcome back
            </h1>
            <p className="text-lg text-surface-dim leading-relaxed">
              Sign in to your account
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

            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              error={state?.errors?.password?.[0]}
            />

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-accent-primary hover:text-accent-primary-soft transition-colors duration-150 ease-out"
              >
                Forgot password?
              </Link>
            </div>

            <SubmitButton />
          </form>

          <p className="text-center text-sm text-surface-dim tracking-wide">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-accent-primary hover:text-accent-primary-soft transition-colors duration-150 ease-out"
            >
              Sign up
            </Link>
          </p>
        </div>
      </GlassContainer>
    </div>
  );
}
