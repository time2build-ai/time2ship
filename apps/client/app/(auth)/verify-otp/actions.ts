'use server';

import { z } from 'zod';

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
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
    // Use API_URL for server-side requests (Docker container-to-container)
    // Fall back to NEXT_PUBLIC_API_URL for local development outside Docker
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/auth/verify-reset-otp`, {
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

export async function resendOtpAction(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const result = resendOtpSchema.safeParse({ email });

  if (!result.success) {
    return { error: 'Invalid email address' };
  }

  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: result.data.email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || 'Failed to resend code' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}
