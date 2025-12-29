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
          fixed top-0 right-0 h-screen w-full sm:w-[400px]
          bg-background
          shadow-2xl z-40
          transform transition-transform duration-300
          flex flex-col
          border-l border-border
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        data-testid="sidebar-ai-chat"
      >
        {/* Заголовок */}
        <ChatHeader onClose={close} />

        {/* Быстрые действия */}
        <QuickActions onSendMessage={handleQuickAction} />

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

        {/* Поле ввода */}
        <ChatInput
          onSend={sendMessage}
          onImageUpload={handleImageUpload}
          isSending={isSending}
          isUploading={isUploading}
        />
      </div>
    </>
  );
}
