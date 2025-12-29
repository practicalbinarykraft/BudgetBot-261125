/**
 * Заголовок AI чат-сайдбара
 *
 * Для джуна: Простой компонент с:
 * - Иконкой AI
 * - Названием "AI Assistant"
 * - Текущей страницей для контекста
 * - Кнопкой закрытия
 */

import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

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

  return (
    <div className="p-3 sm:p-4 border-b border-border flex justify-between items-center">
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
  );
}
