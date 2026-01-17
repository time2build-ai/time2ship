'use server';

import { z } from 'zod';

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export async function resetPasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error?: string; errors?: Record<string, string[]>; success?: boolean }> {
  const result = resetPasswordSchema.safeParse({
    resetToken: formData.get('resetToken'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken: result.data.resetToken,
        password: result.data.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || 'Failed to reset password' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}
