import { Translations } from "./types";

export const webAnalysisTranslations: Translations = {
  "analysis.title": { en: "AI Analysis", ru: "AI Анализ" },
  "analysis.insights": { en: "Get AI-powered insights about your finances", ru: "Получите AI-анализ ваших финансов" },
  "analysis.financial_health": { en: "Financial Health Score", ru: "Оценка финансового здоровья" },
  "analysis.no_data": { en: "No data available yet. Add some transactions to see your score.", ru: "Пока нет данных. Добавьте транзакции для расчета оценки." },
  "analysis.price_recommendations": { en: "Price Recommendations", ru: "Рекомендации по ценам" },
  "analysis.no_price_data": { en: "No price data available yet. Scan more receipts to discover savings!", ru: "Пока нет данных о ценах. Сканируйте больше чеков для поиска экономии!" },
  
  // Receipt Scanner
  "analysis.receipt_scanner": { en: "Receipt OCR Scanner", ru: "Сканер чеков OCR" },
  "analysis.upload_receipt_description": { en: "Upload a receipt to automatically extract items and prices", ru: "Загрузите чек для автоматического извлечения товаров и цен" },
  "analysis.scanning": { en: "Scanning...", ru: "Сканирование..." },
  "analysis.upload_receipt": { en: "Upload Receipt", ru: "Загрузить чек" },
  "analysis.receipt_scanned_successfully": { en: "Receipt scanned successfully!", ru: "Чек успешно отсканирован!" },
  "analysis.found_items_from": { en: "Found {count} items from {merchant}", ru: "Найдено {count} товаров из {merchant}" },
  "analysis.failed_to_scan_receipt": { en: "Failed to scan receipt", ru: "Не удалось отсканировать чек" },
  "analysis.extracted_items": { en: "Extracted Items", ru: "Извлеченные товары" },
  "analysis.unknown_item": { en: "Unknown item", ru: "Неизвестный товар" },
  "analysis.qty": { en: "Qty", ru: "Кол-во" },
  "analysis.total": { en: "Total", ru: "Итого" },
  
  // Spending Analysis
  "analysis.spending_analysis": { en: "Spending Analysis", ru: "Анализ расходов" },
  "analysis.analyzing": { en: "Analyzing...", ru: "Анализ..." },
  "analysis.analyze_my_spending": { en: "Analyze My Spending", ru: "Анализировать мои расходы" },
  "analysis.ai_insights": { en: "AI Insights", ru: "AI Рекомендации" },
  "analysis.powered_by_claude": { en: "Powered by Claude", ru: "На основе Claude" },
  "analysis.last_updated_now": { en: "Last updated: Just now", ru: "Обновлено: только что" },
  
  // AI Chat
  "analysis.ai_financial_advisor": { en: "AI Financial Advisor", ru: "AI Финансовый советник" },
  "analysis.no_messages_yet": { en: "No messages yet. Ask me anything about your finances!", ru: "Пока нет сообщений. Спросите меня о ваших финансах!" },
  "analysis.ask_about_spending": { en: "Ask about your spending, budgets, or savings...", ru: "Спросите о расходах, бюджетах или сбережениях..." },
  "analysis.chat_error": { en: "Chat Error", ru: "Ошибка чата" },
  "analysis.failed_to_send_message": { en: "Failed to send message. Please try again.", ru: "Не удалось отправить сообщение. Попробуйте снова." },
  
  // Price Recommendations
  "analysis.price_comparisons": { en: "Price Comparisons", ru: "Сравнение цен" },
  "analysis.scan_receipts_description": { en: "Scan receipts from different merchants to discover price differences", ru: "Сканируйте чеки из разных магазинов для поиска разницы в ценах" },
  "analysis.no_price_comparisons": { en: "No price comparisons available yet. Keep scanning receipts!", ru: "Пока нет сравнений цен. Продолжайте сканировать чеки!" },
  "analysis.savings_overview": { en: "Savings Overview", ru: "Обзор экономии" },
  "analysis.total_potential_savings": { en: "Total Potential Savings", ru: "Общая потенциальная экономия" },
  "analysis.average_savings": { en: "Average Savings", ru: "Средняя экономия" },
  "analysis.ai_shopping_tips": { en: "AI Shopping Tips", ru: "AI Советы по покупкам" },
  "analysis.generating_ai_tips": { en: "Generating AI shopping tips...", ru: "Генерация AI советов по покупкам..." },
  "analysis.found_items_better_prices": { en: "Found {count} items with better prices elsewhere", ru: "Найдено {count} товаров с лучшими ценами в других местах" },
  "analysis.save": { en: "Save", ru: "Экономия" },

  // AI Assistant Sidebar
  "analysis.ai_assistant": { en: "AI Assistant", ru: "AI Ассистент" },
  "analysis.currently_on": { en: "Currently on", ru: "Текущая страница" },
  "analysis.quick_actions": { en: "Quick Actions", ru: "Быстрые действия" },
  "analysis.analyze_budget": { en: "Analyze Budget", ru: "Анализ бюджета" },
  "analysis.trends": { en: "Trends", ru: "Тренды" },
  "analysis.goals": { en: "Goals", ru: "Цели" },
  "analysis.advice": { en: "Advice", ru: "Советы" },
  "analysis.where_cheaper": { en: "Where's cheaper?", ru: "Где дешевле?" },
  "analysis.ask_ai": { en: "Ask AI...", ru: "Спросить AI..." },

  // Confirmation Card
  "analysis.confirm_action": { en: "Confirm Action", ru: "Подтвердите действие" },
  "analysis.execute": { en: "Execute", ru: "Выполнить" },
  "analysis.cancel": { en: "Cancel", ru: "Отмена" },
  "analysis.executing": { en: "Executing...", ru: "Выполняю..." },
  "analysis.parameters": { en: "parameters", ru: "параметров" },
  "analysis.parameters_few": { en: "parameters", ru: "параметра" },
  "analysis.parameter": { en: "parameter", ru: "параметр" },

  // Tool Actions
  "analysis.action_get_balance": { en: "Check Balance", ru: "Проверить баланс" },
  "analysis.action_create_category": { en: "Create Category", ru: "Создать категорию" },
  "analysis.action_add_transaction": { en: "Add Transaction", ru: "Добавить транзакцию" },

  // AI Assistant Errors
  "analysis.api_key_required": { en: "Please add your Anthropic API key in Settings to use AI Assistant", ru: "Добавьте API ключ Anthropic в Настройках для использования AI Ассистента" },
  "analysis.action_failed": { en: "Action failed", ru: "Действие не выполнено" },
  "analysis.try_again": { en: "Please try again", ru: "Попробуйте снова" },
  "analysis.no_api_key": { en: "No API key configured", ru: "API ключ не настроен" },

  // ML Category Suggestions
  "analysis.ml_suggestion": { en: "ML Suggestion", ru: "ML Подсказка" },
  "analysis.confidence": { en: "Confidence", ru: "Уверенность" },
  "analysis.select_category": { en: "Select category", ru: "Выберите категорию" },
  "analysis.select_personal_tag": { en: "Select personal tag (optional)", ru: "Выберите тег (необязательно)" },
  "analysis.no_personal_tag": { en: "No tag", ru: "Без тега" },
};
