/**
 * Заголовок AI чат-сайдбара
 *
 * Для джуна: Простой компонент с:
 * - Иконкой AI
 * - Названием "AI Assistant"
 * - Счетчиком бесплатных сообщений
 * - Текущей страницей для контекста
 * - Кнопкой закрытия
 */

import { X, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useCreditsBalance } from '@/hooks/use-credits-balance';

interface ChatHeaderProps {
  onClose: () => void;
}

/**
 * Получить название текущей страницы
 *
 * Для джуна: AI использует эту информацию чтобы понять контекст вопроса
 */
function getPageContext(location: string): string {
  if (location === '/' || location === '/app/dashboard') return 'Dashboard';
  if (location.includes('/transactions')) return 'Transactions';
  if (location.includes('/wallets')) return 'Wallets';
  if (location.includes('/goals')) return 'Goals';
  if (location.includes('/budgets')) return 'Budgets';
  if (location.includes('/analytics')) return 'Analytics';
  if (location.includes('/settings')) return 'Settings';
  return 'Unknown';
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  const [location] = useLocation();
  const pageContext = getPageContext(location);
  const { data: balance } = useCreditsBalance();

  return (
    <div className="p-3 sm:p-4 border-b border-border">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Currently on: {pageContext}
            </p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          data-testid="button-close-sidebar"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {balance && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800">
          <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
            {balance.messagesRemaining}/{balance.totalGranted} free messages
          </span>
        </div>
      )}
    </div>
  );
}
