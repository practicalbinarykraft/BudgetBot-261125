/**
 * Список сообщений AI чата
 *
 * Для джуна: Компонент отображает:
 * - Сообщения пользователя и AI
 * - Карточку подтверждения (если есть)
 * - Индикатор "печатает..."
 * - Авто-скролл к новым сообщениям
 */

import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/components/ai/chat-message';
import { TypingIndicator } from '@/components/ai/typing-indicator';
import { ConfirmationCard } from './confirmation-card';
import type { AiChatMessage } from '@shared/schema';
import type { PendingConfirmation } from '@/hooks/use-chat-messages';

interface ChatMessagesListProps {
  messages: AiChatMessage[];
  pendingConfirmation: PendingConfirmation | null;
  isTyping: boolean;
  onConfirm: (params: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function ChatMessagesList({
  messages,
  pendingConfirmation,
  isTyping,
  onConfirm,
  onCancel,
}: ChatMessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Авто-скролл к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingConfirmation, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Сообщения */}
      {messages.map((msg, index) => (
        <ChatMessage key={msg.id} message={msg} index={index} />
      ))}

      {/* Карточка подтверждения */}
      {pendingConfirmation && (
        <ConfirmationCard
          action={pendingConfirmation.action}
          params={pendingConfirmation.params as Record<string, any>}
          mlSuggestion={pendingConfirmation.mlSuggestion}
          availableCategories={pendingConfirmation.availableCategories}
          availablePersonalTags={pendingConfirmation.availablePersonalTags || []}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}

      {/* Индикатор печатания */}
      {isTyping && <TypingIndicator />}

      {/* Якорь для скролла */}
      <div ref={messagesEndRef} />
    </div>
  );
}
