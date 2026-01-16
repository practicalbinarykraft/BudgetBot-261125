import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone response to read body without consuming it
    let errorMessage: string;
    try {
      // Try JSON first (most API errors are JSON)
      const json = await res.clone().json();
      errorMessage = json.error || json.message || JSON.stringify(json);
    } catch {
      // Fallback to text for HTML errors (404, etc)
      try {
        errorMessage = await res.text();
      } catch {
        errorMessage = res.statusText;
      }
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`[QueryClient] ${url} returned 401, returning null`);
      return null;
    }

    if (!res.ok) {
      console.error(`[QueryClient] ${url} failed with status ${res.status}`);
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
