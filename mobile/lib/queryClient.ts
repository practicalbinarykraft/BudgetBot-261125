/**
 * TanStack React Query client configuration for the mobile app.
 * Mirrors the web app query patterns.
 */

import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { apiRequest, ApiError } from './api';

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const [path, params] = queryKey as [string, Record<string, string>?];

  let url = path;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      url = `${path}?${qs}`;
    }
  }

  return apiRequest('GET', url);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes stale time for mobile
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
