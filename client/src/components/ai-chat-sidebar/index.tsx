/**
 * AI Chat Sidebar — главный компонент чата с AI-ассистентом
 *
 * Для джуна: Этот компонент собирает всё вместе:
 * 1. Плавающая кнопка открытия (FloatingChatButton)
 * 2. Оверлей для закрытия по клику вне сайдбара
 * 3. Сам сайдбар с заголовком, сообщениями и полем ввода
 *
 * Логика вынесена в хуки:
 * - useChatMessages — работа с сообщениями
 * - useToolConfirmation — подтверждение действий AI
 * - useImageUpload — загрузка фото чеков
 *
 * @example
 * // В App.tsx или Layout:
 * <AIChatSidebar />
 */

import { useChatSidebar } from '@/stores/chat-sidebar-store';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useToolConfirmation } from '@/hooks/use-tool-confirmation';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useCreditsBalance } from '@/hooks/use-credits-balance';
import { useTelegramSafeArea } from '@/hooks/use-telegram-safe-area';

// Компоненты
import { FloatingChatButton } from './floating-button';
import { QuickActions } from './quick-actions';
import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { ChatMessagesList } from './chat-messages-list';
import { EmptyState } from './empty-state';

export function AIChatSidebar() {
  // Состояние открытия сайдбара (Zustand store)
  const { isOpen, close } = useChatSidebar();
  
  // Динамические отступы для Telegram Mini App
  const safeArea = useTelegramSafeArea();

  // Хук подтверждения действий
  const {
    pending: pendingConfirmation,
    setPending,
    confirm,
    cancel,
  } = useToolConfirmation();

  // Хук сообщений чата
  const {
    messages,
    isLoading,
    sendMessage,
    isSending,
    refreshHistory,
  } = useChatMessages(isOpen, setPending);

  // Хук загрузки изображений
  const { uploadImage, isUploading } = useImageUpload(refreshHistory);

  // Хук баланса кредитов
  const { data: balance } = useCreditsBalance();
  const hasCredits = !balance || balance.messagesRemaining > 0;

  /**
   * Обработчик быстрых действий
   *
   * Для джуна: QuickActions — это кнопки с готовыми вопросами
   */
  const handleQuickAction = (question: string) => {
    sendMessage(question);
  };

  /**
   * Обработчик загрузки изображения
   */
  const handleImageUpload = async (file: File) => {
    await uploadImage(file);
  };

  // Есть ли сообщения или подтверждение для показа
  const hasContent = messages.length > 0 || pendingConfirmation;

  return (
    <>
      {/* Плавающая кнопка открытия */}
      {!isOpen && <FloatingChatButton />}

      {/* Оверлей */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={close}
          data-testid="overlay-chat-sidebar"
        />
      )}

      {/* Сайдбар */}
      <div
        className={`
          fixed right-0 w-full sm:w-[400px]
          bg-background
          z-40
          transform transition-transform duration-300
          flex flex-col
          ${isOpen ? 'translate-x-0 shadow-2xl border-l border-border' : 'translate-x-full'}
        `}
        style={{
          // Смещаем контейнер только если есть шторка (не развернуто на весь экран)
          // Если развернуто на весь экран (safeArea.top = 0), начинаем с top: 0
          top: safeArea.top > 0 ? `${safeArea.top}px` : '0',
          height: safeArea.top > 0 ? `calc(100vh - ${safeArea.top}px)` : '100vh',
        }}
        data-testid="sidebar-ai-chat"
      >
        {/* Заголовок */}
        <ChatHeader onClose={close} />

        {/* Быстрые действия - показываем только если нет сообщений */}
        {!hasContent && !isLoading && (
          <QuickActions onSendMessage={handleQuickAction} />
        )}

        {/* Контент */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading chat...</p>
          </div>
        ) : hasContent ? (
          <ChatMessagesList
            messages={messages}
            pendingConfirmation={pendingConfirmation}
            isTyping={isSending}
            onConfirm={confirm}
            onCancel={cancel}
          />
        ) : (
          <EmptyState />
        )}

        {/* Поле ввода или баннер об исчерпании лимита */}
        {hasCredits ? (
          <ChatInput
            onSend={sendMessage}
            onImageUpload={handleImageUpload}
            isSending={isSending}
            isUploading={isUploading}
          />
        ) : (
          <div className="p-4 border-t border-border bg-orange-50 dark:bg-orange-950/20">
            <div className="text-center">
              <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100 mb-1">
                Free messages exhausted
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                You've used all 50 free AI messages. Upgrade to continue chatting!
              </p>
              <button
                onClick={() => window.open('https://t.me/yourusername', '_blank')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Contact for Upgrade
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
