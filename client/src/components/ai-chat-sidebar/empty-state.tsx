/**
 * Пустое состояние AI чата
 *
 * Для джуна: Показывается когда нет сообщений.
 * Мотивирует пользователя начать разговор.
 */

import { Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Sparkles className="w-12 h-12 text-purple-500 mb-4" />
      <h4 className="font-semibold mb-2">Start a conversation</h4>
      <p className="text-sm text-muted-foreground">
        Ask me anything about your finances!
      </p>
    </div>
  );
}
