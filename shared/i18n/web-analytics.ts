import { Translations } from "./types";

export const webAnalyticsTranslations: Translations = {
  // Page Header
  "analytics.title": { 
    en: "Expense Analytics", 
    ru: "Аналитика расходов" 
  },
  "analytics.description": { 
    en: "Analyze your spending across categories, people, and types", 
    ru: "Анализ расходов по категориям, людям и типам" 
  },
  
  // Actions
  "analytics.fix_unsorted": { 
    en: "Fix Unsorted", 
    ru: "Исправить несортированные" 
  },
  "analytics.migrating": { 
    en: "Migrating...", 
    ru: "Обработка..." 
  },
  "analytics.migration_complete": { 
    en: "Migration Complete", 
    ru: "Обработка завершена" 
  },
  "analytics.migration_failed": { 
    en: "Migration Failed", 
    ru: "Обработка не удалась" 
  },
  
  // Period Filters (shared with dashboard)
  "analytics.period.week": { 
    en: "This Week", 
    ru: "Эта неделя" 
  },
  "analytics.period.month": { 
    en: "This Month", 
    ru: "Этот месяц" 
  },
  "analytics.period.year": { 
    en: "This Year", 
    ru: "Этот год" 
  },
  
  // Tabs
  "analytics.tab.category": { 
    en: "By Category", 
    ru: "По категориям" 
  },
  "analytics.tab.person": { 
    en: "By Person", 
    ru: "По людям" 
  },
  "analytics.tab.type": { 
    en: "By Type", 
    ru: "По типу" 
  },
  "analytics.tab.unsorted": { 
    en: "Unsorted", 
    ru: "Несортированные" 
  },
  
  // Category Tab
  "analytics.category.title": { 
    en: "Spending by Category", 
    ru: "Расходы по категориям" 
  },
  "analytics.category.no_data": { 
    en: "No category data available for this period", 
    ru: "Нет данных по категориям за этот период" 
  },
  
  // Person Tab
  "analytics.person.title": { 
    en: "Spending by Person", 
    ru: "Расходы по людям" 
  },
  "analytics.person.no_data": { 
    en: "No personal spending data available for this period", 
    ru: "Нет данных по личным расходам за этот период" 
  },
  
  // Type Tab
  "analytics.type.title": { 
    en: "Spending by Type", 
    ru: "Расходы по типу" 
  },
  "analytics.type.no_data": { 
    en: "No type data available for this period", 
    ru: "Нет данных по типам за этот период" 
  },
  
  // Unsorted Tab
  "analytics.unsorted.title": { 
    en: "Unsorted Transactions", 
    ru: "Несортированные транзакции" 
  },
  "analytics.unsorted.description": { 
    en: "These transactions don't have categories or tags assigned", 
    ru: "У этих транзакций нет категорий или тегов" 
  },
  "analytics.unsorted.no_data": { 
    en: "All transactions are sorted!", 
    ru: "Все транзакции отсортированы!" 
  },
  "analytics.unsorted.count": { 
    en: "{count} unsorted transactions", 
    ru: "{count} несортированных транзакций" 
  },
};
