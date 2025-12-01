/**
 * Хук для подтверждения действий AI
 *
 * Для джуна: Когда AI хочет выполнить действие (создать транзакцию, изменить бюджет),
 * сначала показывается карточка подтверждения. Этот хук управляет:
 * 1. Состоянием подтверждения (pending/confirmed/cancelled)
 * 2. Отправкой подтверждения на сервер
 * 3. Инвалидацией кэша после успешного действия
 *
 * @example
 * const { pending, confirm, cancel, isConfirming } = useToolConfirmation();
 *
 * // Показать подтверждение
 * setPending({ action: 'add_transaction', params: {...} });
 *
 * // Подтвердить
 * confirm(updatedParams);
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/context';
import type { PendingConfirmation } from './use-chat-messages';

/**
 * Хук для управления подтверждением действий AI
 *
 * Для джуна: Возвращает:
 * - pending: текущее ожидающее подтверждение (или null)
 * - setPending: установить новое подтверждение
 * - confirm: подтвердить действие
 * - cancel: отменить действие
 * - isConfirming: идёт ли сейчас подтверждение
 */
export function useToolConfirmation() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Текущее ожидающее подтверждение
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  // Мутация для подтверждения действия
  const confirmMutation = useMutation({
    mutationFn: async (finalParams: Record<string, unknown>) => {
      if (!pending) throw new Error('No pending confirmation');

      const response = await apiRequest('POST', '/api/ai/confirm-tool', {
        action: pending.action,
        params: finalParams,
      });

      // Проверить что ответ — JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response');
      }

      return response.json();
    },
    onSuccess: () => {
      // Инвалидировать все связанные запросы
      invalidateRelatedQueries();

      // Очистить подтверждение
      setPending(null);

      toast({
        title: t('ai_tools.action_completed'),
        description: t('ai_tools.request_executed'),
      });
    },
    onError: (error: Error) => {
      // Не очищаем pending чтобы пользователь мог попробовать снова
      toast({
        title: t('ai_tools.action_failed'),
        description: error.message || t('ai_tools.failed_retry'),
        variant: 'destructive',
      });
    },
  });

  /**
   * Инвалидировать кэш связанных данных
   *
   * Для джуна: После успешного действия AI нужно обновить данные на странице:
   * - Транзакции
   * - Статистика
   * - Бюджеты
   * - Кошельки и т.д.
   */
  function invalidateRelatedQueries() {
    const queriesToInvalidate = [
      '/api/ai/chat/history',
      '/api/transactions',
      '/api/stats',
      '/api/budgets',
      '/api/categories',
      '/api/wallets',
    ];

    queriesToInvalidate.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }

  /**
   * Подтвердить действие с (возможно изменёнными) параметрами
   */
  const confirm = (finalParams: Record<string, unknown>) => {
    confirmMutation.mutate(finalParams);
  };

  /**
   * Отменить действие
   */
  const cancel = () => {
    setPending(null);
    toast({
      title: t('ai_tools.action_cancelled'),
      description: t('ai_tools.you_cancelled'),
    });
  };

  return {
    // Состояние
    pending,
    setPending,

    // Действия
    confirm,
    cancel,

    // Статус
    isConfirming: confirmMutation.isPending,
  };
}
