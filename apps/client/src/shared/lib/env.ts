import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  API_URL: z.string().url().optional(),
});

// Validate on module load
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  API_URL: process.env.API_URL,
});

// Get the appropriate API URL based on context (server-side vs client-side)
export function getApiUrl(): string {
  // Server-side: use API_URL if available (for Docker networking)
  // Client-side: always use NEXT_PUBLIC_API_URL
  if (typeof window === 'undefined' && env.API_URL) {
    return env.API_URL;
  }
  return env.NEXT_PUBLIC_API_URL;
}
