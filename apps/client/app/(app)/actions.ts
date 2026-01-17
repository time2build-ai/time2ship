'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authApi } from '@/shared/lib/api/auth';

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (refreshToken) {
    // Call API to revoke token (don't wait for response)
    await authApi.logout(refreshToken).catch(() => {
      // Ignore errors - we're logging out anyway
    });
  }

  // Delete cookies
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');

  // Redirect to login
  redirect('/login');
}
