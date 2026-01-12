/**
 * Admin API Error Handler
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот модуль обрабатывает ошибки API для админ-панели.
 * Автоматически перенаправляет на login при 401, показывает сообщения при 403/500.
 * 
 * Использование:
 *   import { handleAdminApiError } from './admin-error-handler';
 *   try { ... } catch (error) { handleAdminApiError(error); }
 */

/**
 * Обработать ошибку API админ-панели
 * 
 * Для джуна: Разные ошибки обрабатываются по-разному:
 * - 401 (Unauthorized) -> редирект на login
 * - 403 (Forbidden) -> показать сообщение о недостатке прав
 * - 500 (Server Error) -> показать сообщение об ошибке сервера
 * - Другие -> показать общее сообщение об ошибке
 * 
 * @param error - Ошибка из fetch или другого источника
 * @param showToast - Функция для показа toast (опционально)
 */
export function handleAdminApiError(
  error: unknown,
  showToast?: (options: { title: string; description: string; variant?: 'destructive' }) => void
): void {
  // Извлекаем статус из ошибки
  let status: number | null = null;
  let message = 'Произошла ошибка';

  if (error instanceof Error) {
    // Пытаемся извлечь статус из сообщения (формат: "401: Unauthorized")
    const statusMatch = error.message.match(/^(\d+):/);
    if (statusMatch) {
      status = parseInt(statusMatch[1], 10);
      message = error.message.replace(/^\d+:\s*/, '');
    } else {
      message = error.message;
    }
  }

  // Обработка по статусу
  switch (status) {
    case 401:
      // Не авторизован - редирект на login
      console.warn('Admin API: Unauthorized, redirecting to login');
      if (showToast) {
        showToast({
          title: 'Сессия истекла',
          description: 'Пожалуйста, войдите снова',
          variant: 'destructive',
        });
        // Небольшая задержка перед редиректом, чтобы пользователь увидел сообщение
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
      } else {
        // Если toast недоступен, все равно делаем редирект
        window.location.href = '/admin/login';
      }
      break;

    case 403:
      // Нет прав - показать сообщение
      console.warn('Admin API: Forbidden', message);
      if (showToast) {
        showToast({
          title: 'Доступ запрещен',
          description: message || 'У вас нет прав для выполнения этого действия',
          variant: 'destructive',
        });
      } else {
        alert(`Доступ запрещен: ${message}`);
      }
      break;

    case 500:
      // Ошибка сервера
      console.error('Admin API: Server error', message);
      if (showToast) {
        showToast({
          title: 'Ошибка сервера',
          description: message || 'Произошла ошибка на сервере. Попробуйте обновить страницу.',
          variant: 'destructive',
        });
      } else {
        alert(`Ошибка сервера: ${message}\n\nПопробуйте обновить страницу или обратитесь к администратору.`);
      }
      break;

    default:
      // Другие ошибки
      console.error('Admin API: Error', error);
      if (showToast) {
        showToast({
          title: 'Ошибка',
          description: message,
          variant: 'destructive',
        });
      } else {
        alert(`Ошибка: ${message}`);
      }
  }
}

/**
 * Обертка для fetch с обработкой ошибок
 * 
 * Для джуна: Автоматически обрабатывает ошибки API.
 * Используется вместо обычного fetch в admin-api.ts.
 * 
 * @param url - URL для запроса
 * @param options - Опции fetch (method, body, headers, etc.)
 * @param showToast - Функция для показа toast (опционально)
 */
export async function adminApiFetch(
  url: string,
  options: RequestInit = {},
  showToast?: (options: { title: string; description: string; variant?: 'destructive' }) => void
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    if (!response.ok) {
      // Извлекаем сообщение об ошибке
      let errorMessage: string;
      try {
        const json = await response.clone().json();
        errorMessage = json.error || json.message || 'Unknown error';
      } catch {
        errorMessage = response.statusText || 'Unknown error';
      }

      // Создаем ошибку с статусом
      const error = new Error(`${response.status}: ${errorMessage}`);
      
      // Обрабатываем ошибку (но не показываем toast здесь, это сделает React Query)
      // Только для 401 делаем редирект сразу
      if (response.status === 401) {
        handleAdminApiError(error, showToast);
      }
      
      // Пробрасываем ошибку дальше (React Query обработает)
      throw error;
    }

    return response;
  } catch (error) {
    // Если это уже обработанная ошибка, пробрасываем дальше
    if (error instanceof Error && error.message.match(/^\d+:/)) {
      throw error;
    }

    // Неожиданная ошибка (сеть, etc.)
    console.error('Admin API: Unexpected error', error);
    // Для сетевых ошибок не делаем редирект, только логируем
    throw error;
  }
}

