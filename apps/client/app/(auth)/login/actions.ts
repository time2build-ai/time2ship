'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { loginSchema } from '@/shared/lib/validators/auth';
import { authApi } from '@/shared/lib/api/auth';
import { cookieOptions } from '@/shared/lib/auth/session';

export async function loginAction(prevState: any, formData: FormData) {
  // Validate input
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Call API
  const response = await authApi.login(result.data);

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  // Set cookies
  const cookieStore = await cookies();

  cookieStore.set('accessToken', response.data.accessToken, {
    ...cookieOptions,
    maxAge: 60 * 15, // 15 minutes
  });

  cookieStore.set('refreshToken', response.data.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Redirect to dashboard
  redirect('/app');
}
