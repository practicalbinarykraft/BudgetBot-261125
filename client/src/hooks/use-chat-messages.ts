/**
 * Хук для работы с сообщениями AI чата
 *
 * Для джуна: Этот хук инкапсулирует всю логику работы с чатом:
 * 1. Загрузка истории сообщений (useQuery)
 * 2. Отправка нового сообщения (useMutation)
 * 3. Автоматическое обновление после отправки
 *
 * @example
 * const { messages, isLoading, sendMessage, isSending } = useChatMessages(isOpen);
 *
 * // Отправить сообщение
 * sendMessage('Сколько я потратил в этом месяце?');
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { AiChatMessage } from '@shared/schema';

/**
 * Ответ от AI
 */
interface ChatResponse {
  type: 'message' | 'tool_confirmation';
  content?: string;
  action?: string;
  params?: Record<string, unknown>;
  toolUseId?: string;
  mlSuggestion?: MLSuggestion | null;
  availableCategories?: Category[] | null;
  availablePersonalTags?: PersonalTag[] | null;
}

/**
 * ML-предложение категории
 */
interface MLSuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number;
}

/**
 * Категория транзакции
 */
interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

/**
 * Персональный тег
 */
interface PersonalTag {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

/**
 * Данные для подтверждения действия AI
 */
export interface PendingConfirmation {
  action: string;
  params: Record<string, unknown>;
  toolUseId: string;
  mlSuggestion?: MLSuggestion | null;
  availableCategories?: Category[] | null;
  availablePersonalTags?: PersonalTag[] | null;
}

/**
 * Хук для работы с сообщениями чата
 *
 * Для джуна: Принимает параметры:
 * - isOpen: загружать историю только когда чат открыт
 * - onToolConfirmation: callback когда AI хочет выполнить действие
 *
 * @returns Объект с данными и методами чата
 */
export function useChatMessages(
  isOpen: boolean,
  onToolConfirmation?: (confirmation: PendingConfirmation) => void
) {
  const { toast } = useToast();

  // Загрузка истории сообщений
  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery<AiChatMessage[]>({
    queryKey: ['/api/ai/chat/history'],
    enabled: isOpen, // Загружать только когда чат открыт
  });

  // Отправка сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message: userMessage,
      });
      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: (data) => {
      if (data.type === 'tool_confirmation') {
        // AI хочет выполнить действие — показать подтверждение
        onToolConfirmation?.({
          action: data.action!,
          params: data.params as Record<string, unknown>,
          toolUseId: data.toolUseId!,
          mlSuggestion: data.mlSuggestion,
          availableCategories: data.availableCategories,
          availablePersonalTags: data.availablePersonalTags,
        });
      } else {
        // Обычное сообщение — обновить историю
        queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка чата',
        description: error.message || 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    },
  });

  /**
   * Отправить сообщение в чат
   */
  const sendMessage = (message: string) => {
    const trimmed = message.trim();
    if (trimmed) {
      sendMessageMutation.mutate(trimmed);
    }
  };

  /**
   * Обновить историю вручную
   */
  const refreshHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
  };

  return {
    // Данные
    messages,
    isLoading,

    // Отправка
    sendMessage,
    isSending: sendMessageMutation.isPending,

    // Утилиты
    refreshHistory,
    refetch,
  };
}
