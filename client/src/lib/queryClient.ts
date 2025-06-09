import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Custom request function for API calls
export async function apiRequest(input: RequestInfo, init?: RequestInit): Promise<any> {
  // Make the API request
  const response = await fetch(input, init);
  
  // Check if the response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return data;
  }
  
  // Return the response for non-JSON requests
  return response;
}