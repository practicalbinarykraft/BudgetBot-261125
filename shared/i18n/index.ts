/**
 * i18n - Unified internationalization system
 * Used by both Telegram bot and Web client
 */

import { Language, Translations } from './types';
import { commonTranslations } from './common';
import { authTranslations } from './auth';
import { transactionTranslations } from './transactions';
import { balanceTranslations } from './balance';
import { incomeTranslations } from './income';
import { receiptTranslations } from './receipts';
import { helpTranslations } from './help';
import { notificationTranslations } from './notifications';
import { webCommonTranslations } from './web-common';
import { webDashboardTranslations } from './web-dashboard';
import { webDashboardChartsTranslations } from './web-dashboard-charts';
import { webTransactionsTranslations } from './web-transactions';
import { webSettingsTranslations } from './web-settings';
import { webSettingsOptionsTranslations } from './web-settings-options';
import { webWalletsTranslations } from './web-wallets';
import { webCategoriesTranslations } from './web-categories';
import { webBudgetsTranslations } from './web-budgets';
import { webTagsTranslations } from './web-tags';
import { webWishlistTranslations } from './web-wishlist';
import { webPlannedTranslations } from './web-planned';
import { webPlannedIncomeTranslations } from './web-planned-income';
import { webRecurringTranslations } from './web-recurring';
import { webAnalysisTranslations } from './web-analysis';
import { webAiToolsTranslations } from './web-ai-tools';
import { webProductCatalogTranslations } from './web-product-catalog';
import { webLandingTranslations } from './web-landing';
import { webAnalyticsTranslations } from './web-analytics';
import { webAssetsTranslations } from './web-assets';

// Export types
export type { Language, Translation, Translations } from './types';

// Combine all translations (Telegram bot + Web client)
const allTranslations: Translations = {
  ...commonTranslations,
  ...authTranslations,
  ...transactionTranslations,
  ...balanceTranslations,
  ...incomeTranslations,
  ...receiptTranslations,
  ...helpTranslations,
  ...notificationTranslations,
  ...webCommonTranslations,
  ...webDashboardTranslations,
  ...webDashboardChartsTranslations,
  ...webTransactionsTranslations,
  ...webSettingsTranslations,
  ...webSettingsOptionsTranslations,
  ...webWalletsTranslations,
  ...webCategoriesTranslations,
  ...webBudgetsTranslations,
  ...webTagsTranslations,
  ...webWishlistTranslations,
  ...webPlannedTranslations,
  ...webPlannedIncomeTranslations,
  ...webRecurringTranslations,
  ...webAnalysisTranslations,
  ...webAiToolsTranslations,
  ...webProductCatalogTranslations,
  ...webLandingTranslations,
  ...webAnalyticsTranslations,
  ...webAssetsTranslations,
};

/**
 * Get translated message with fallback chain:
 * 1. Try requested language
 * 2. Fallback to English
 * 3. Return key if not found
 */
export function t(key: string, lang: Language = 'en'): string {
  const translation = allTranslations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return translation[lang] || translation.en;
}

/**
 * Get user's language preference (default: 'en')
 */
export function getUserLanguage(settings: { language?: string | null } | null): Language {
  if (!settings || !settings.language) {
    return 'en';
  }
  return settings.language === 'ru' ? 'ru' : 'en';
}

/**
 * Format welcome message with all sections
 */
export function getWelcomeMessage(lang: Language = 'en'): string {
  return `${t('welcome.title', lang)}\n${t('welcome.description', lang)}\n\n${t('welcome.features', lang)}\n\n${t('welcome.getting_started', lang)}\n\n${t('welcome.help', lang)}`;
}

/**
 * Format help message with all commands
 */
export function getHelpMessage(lang: Language = 'en'): string {
  const separator = '\n\n━━━━━━━━━━━━━━━━━━━━\n\n';
  
  return `${t('help.title', lang)}${separator}${t('help.shopping_lists', lang)}${separator}${t('help.currency_formats', lang)}${separator}${t('help.other_ways', lang)}${separator}${t('help.commands', lang)}`;
}
