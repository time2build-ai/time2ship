import { getApiUrl } from '@/shared/lib/env';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Make a request to the API backend
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Something went wrong',
      };
    }

    return { success: true, data: data.data || data };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}
