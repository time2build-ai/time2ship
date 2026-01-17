import { getCurrentUser } from '@/shared/lib/auth/session';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Time2Ship',
  description: 'Your application dashboard',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.email}!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your account
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              Active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Your app features will go here
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Placeholder for onboarding steps
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
