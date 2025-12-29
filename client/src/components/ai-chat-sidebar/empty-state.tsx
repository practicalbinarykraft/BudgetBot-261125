/**
 * Пустое состояние AI чата
 *
 * Для джуна: Показывается когда нет сообщений.
 * Мотивирует пользователя начать разговор.
 */

import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n/context';

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-3 sm:px-4">
      <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 mb-3 sm:mb-4" />
      <h4 className="font-semibold text-sm sm:text-base mb-2">{t("ai_tools.start_conversation")}</h4>
      <p className="text-xs sm:text-sm text-muted-foreground">
        {t("ai_tools.ask_about_finances")}
      </p>
    </div>
  );
}
