import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Parameterized query key for categories — prevents cache conflicts. */
export const categoriesQueryKey = (limit = 100) =>
  ["categories", { limit }] as const;

/**
 * Normalize a paginated API response that may return either
 * `{ data: T[] }` (with limit param) or a plain `T[]` (without limit).
 * Prevents silent empty-list bugs when the response shape changes.
 */
export function normalizePaginatedData<T>(response: unknown): T[] {
  if (response == null) return [];
  if (Array.isArray(response)) return response as T[];
  if (typeof response === "object" && "data" in response) {
    const inner = (response as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (__DEV__) {
    console.warn("normalizePaginatedData: unexpected shape", response);
  }
  return [];
}
