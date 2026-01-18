import type { Metadata } from 'next';

import { getCurrentUser } from '@/shared/lib/auth/session';
import { LogoutButton } from '../components/logout-button';

export const metadata: Metadata = {
  title: 'Dashboard | Time2Ship',
  description: 'Your application dashboard',
};

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back
            {user?.email && (
              <>
                ,<br />
                <span className="bg-gradient-to-br from-accent-primary to-accent-primary-soft bg-clip-text text-transparent">
                  {user.email}
                </span>
              </>
            )}
          </h1>
          <p className="text-base text-surface-dim max-w-sm mx-auto">
            This is a protected page. You're successfully authenticated.
          </p>
        </div>

        <div className="flex justify-center">
          <span className="inline-flex px-4 py-2 bg-accent-success/10 text-accent-success border border-accent-success/20 text-xs font-medium tracking-widest uppercase rounded-full">
            Authenticated
          </span>
        </div>

        <div className="pt-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
