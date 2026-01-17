'use server';

import { z } from 'zod';

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export async function verifyOtpAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error?: string; errors?: Record<string, string[]>; resetToken?: string }> {
  const result = verifyOtpSchema.safeParse({
    email: formData.get('email'),
    otp: formData.get('otp'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || 'Invalid or expired code' };
    }

    return { resetToken: data.data.resetToken };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}
