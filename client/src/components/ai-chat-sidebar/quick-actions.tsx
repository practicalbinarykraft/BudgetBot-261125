import { BarChart3, TrendingUp, Target, Plus, Camera, Lightbulb, ShoppingCart } from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  type: 'chat' | 'action';
  message?: string;
  action?: () => void;
}

interface QuickActionsProps {
  onSendMessage: (message: string) => void;
}

export function QuickActions({ onSendMessage }: QuickActionsProps) {
  const actions: QuickAction[] = [
    // АНАЛИЗ И ВОПРОСЫ → ЧАТ
    {
      icon: <BarChart3 className="w-4 h-4" />,
      label: 'Анализ бюджета',
      type: 'chat',
      message: 'Проанализируй мой бюджет за текущий месяц. Где я могу сэкономить?',
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Тренды',
      type: 'chat',
      message: 'Покажи тренды моих расходов за последние 3 месяца',
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: 'Цели',
      type: 'chat',
      message: 'Как продвигаются мои финансовые цели? Смогу ли достичь их вовремя?',
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      label: 'Советы',
      type: 'chat',
      message: 'Дай 3 совета как улучшить мои финансы',
    },
    {
      icon: <ShoppingCart className="w-4 h-4" />,
      label: 'Где дешевле?',
      type: 'chat',
      message: 'Где мне выгоднее покупать продукты по последним чекам?',
    },
    
    // ДЕЙСТВИЯ → UI (временно disabled, добавим позже)
    // {
    //   icon: <Plus className="w-4 h-4" />,
    //   label: 'Расход',
    //   type: 'action',
    //   action: () => {
    //     // TODO: Открыть dialog добавления расхода
    //   },
    // },
    // {
    //   icon: <Camera className="w-4 h-4" />,
    //   label: 'Чек',
    //   type: 'action',
    //   action: () => {
    //     // TODO: Открыть receipt scanner
    //   },
    // },
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.type === 'chat' && action.message) {
      onSendMessage(action.message);
    } else if (action.type === 'action' && action.action) {
      action.action();
    }
  };

  return (
    <div className="p-3 sm:p-4 border-b border-border">
      <p className="text-xs text-muted-foreground mb-2 sm:mb-3">Быстрые действия:</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleActionClick(action)}
            data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            className="
              px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg
              bg-gradient-to-r from-blue-50 to-purple-50
              dark:from-blue-900/20 dark:to-purple-900/20
              hover:from-blue-100 hover:to-purple-100
              dark:hover:from-blue-900/30 dark:hover:to-purple-900/30
              transition-all
              flex items-center gap-1.5 sm:gap-2
              border border-transparent
              hover:border-blue-200
              dark:hover:border-blue-800
            "
          >
            <span className="shrink-0">{action.icon}</span>
            <span className="text-foreground whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
