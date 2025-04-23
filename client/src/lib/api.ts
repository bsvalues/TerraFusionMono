import { apiRequest as baseApiRequest } from "./queryClient";

/**
 * Wrapper around the base apiRequest function to enforce API route prefixing
 * and provide consistent error handling.
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  // Ensure URL starts with /api prefix
  const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
  
  try {
    const response = await baseApiRequest(method, apiUrl, data);
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${method} ${apiUrl}`, error);
    throw error;
  }
}
