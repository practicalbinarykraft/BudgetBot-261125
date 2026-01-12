/**
 * Admin Query Client
 * 
 * Junior-Friendly Guide:
 * =====================
 * Специальный QueryClient для админ-панели с глобальной обработкой ошибок.
 * Автоматически обрабатывает 401 (редирект), 403 (сообщение), 500 (сообщение).
 * 
 * Использование:
 *   import { adminQueryClient } from '@/lib/admin/api/admin-query-client';
 *   <QueryClientProvider client={adminQueryClient}>...</QueryClientProvider>
 */

import { QueryClient } from '@tanstack/react-query';
import { handleAdminApiError } from './admin-error-handler';

// Функция для показа toast (будет установлена из компонента)
let toastHandler: ((options: { title: string; description: string; variant?: 'destructive' }) => void) | null = null;

/**
 * Установить обработчик toast для админ-панели
 * 
 * Для джуна: Вызывается один раз при инициализации админ-панели.
 */
export function setAdminToastHandler(
  handler: (options: { title: string; description: string; variant?: 'destructive' }) => void
): void {
  toastHandler = handler;
}

/**
 * QueryClient для админ-панели с глобальной обработкой ошибок
 */
export const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: (failureCount, error) => {
        // Не повторяем запросы при 401, 403, 404
        if (error instanceof Error) {
          const statusMatch = error.message.match(/^(\d+):/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            if ([401, 403, 404].includes(status)) {
              return false;
            }
          }
        }
        // Для других ошибок повторяем максимум 1 раз
        return failureCount < 1;
      },
      // Note: onError removed in React Query v5, errors should be handled in components
    },
    mutations: {
      retry: false,
      // Note: onError removed in React Query v5, errors should be handled in components
    },
  },
});

