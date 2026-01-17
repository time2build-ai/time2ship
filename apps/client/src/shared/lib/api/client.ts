import { getApiUrl } from '@/shared/lib/env';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Extracts error message from API response data
 */
function extractErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.error === 'object' && data.error !== null) {
    const errorObj = data.error as { message?: string };
    if (errorObj.message) {
      return errorObj.message;
    }
  }
  if (typeof data.error === 'string') {
    return data.error;
  }
  if (typeof data.message === 'string') {
    return data.message;
  }
  return 'Something went wrong';
}

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
      const errorMessage = extractErrorMessage(data);
      return { success: false, error: errorMessage };
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
