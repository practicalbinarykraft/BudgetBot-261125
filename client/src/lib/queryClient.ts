import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Get user-friendly error message based on HTTP status code
 */
function getErrorMessageForStatus(status: number): string {
  switch (status) {
    case 502:
      return 'Ошибка подключения к серверу. Сервис может быть временно недоступен. Пожалуйста, попробуйте позже.';
    case 503:
      return 'Сервис временно недоступен из-за технических работ. Пожалуйста, попробуйте позже.';
    case 504:
      return 'Превышено время ожидания ответа. Сервер слишком долго отвечает. Пожалуйста, попробуйте еще раз.';
    case 500:
      return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже или обратитесь в поддержку.';
    case 429:
      return 'Слишком много запросов. Пожалуйста, подождите немного и попробуйте снова.';
    case 401:
      return 'Сессия истекла. Пожалуйста, войдите заново.';
    case 403:
      return 'Недостаточно прав для выполнения этого действия.';
    case 404:
      return 'Запрашиваемый ресурс не найден.';
    default:
      return 'Произошла ошибка при выполнении запроса. Пожалуйста, попробуйте еще раз.';
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // For server errors (5xx), show user-friendly message
    if (res.status >= 500) {
      const userFriendlyMessage = getErrorMessageForStatus(res.status);
      throw new Error(userFriendlyMessage);
    }

    // For client errors (4xx), try to get error message from response
    let errorMessage: string;
    try {
      // Try JSON first (most API errors are JSON)
      const json = await res.clone().json();
      errorMessage = json.error || json.message || getErrorMessageForStatus(res.status);
    } catch {
      // Fallback to status-based message for HTML errors (502 Bad Gateway, etc)
      errorMessage = getErrorMessageForStatus(res.status);
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Handle network errors (no response from server)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Ошибка сети. Пожалуйста, проверьте подключение к интернету и попробуйте еще раз.');
    }
    // Re-throw other errors (they already have user-friendly messages)
    throw error;
  }
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
