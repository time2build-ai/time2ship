'use server';

import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function forgotPasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error?: string; errors?: Record<string, string[]>; success?: boolean }> {
  const result = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: result.data.email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || 'Failed to send reset code' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}
