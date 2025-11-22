/**
 * Режимы отображения графика
 */
export type GraphMode = 'lite' | 'pro';

/**
 * Типы прогноза
 */
export type ForecastType = 'linear' | 'ai';

/**
 * Режимы капитала
 */
export type CapitalMode = 'cash' | 'networth';

/**
 * Конфигурация LITE режима
 */
export interface LiteModeConfig {
  mode: 'lite';
  capitalMode: CapitalMode;
  forecastType: ForecastType;
}

/**
 * Конфигурация PRO режима
 */
export interface ProModeConfig {
  mode: 'pro';
  capitalMode: CapitalMode;
  forecastType: ForecastType;
  
  includeRecurringIncome: boolean;
  includeAssetIncome: boolean;
  includeRecurringExpense: boolean;
  includeLiabilityExpense: boolean;
  includePlannedExpense: boolean;
  includeBudgetLimits: boolean;
  includeAssetValueChange: boolean;
  
  showIncome: boolean;
  showExpense: boolean;
  showCapital: boolean;
  showAssetsLine: boolean;
}

export type GraphConfig = LiteModeConfig | ProModeConfig;

/**
 * Дефолтные настройки LITE
 */
export const DEFAULT_LITE_CONFIG: LiteModeConfig = {
  mode: 'lite',
  capitalMode: 'networth',
  forecastType: 'linear',
};

/**
 * Дефолтные настройки PRO
 */
export const DEFAULT_PRO_CONFIG: ProModeConfig = {
  mode: 'pro',
  capitalMode: 'networth',
  forecastType: 'linear',
  
  includeRecurringIncome: true,
  includeAssetIncome: true,
  includeRecurringExpense: true,
  includeLiabilityExpense: true,
  includePlannedExpense: true,
  includeBudgetLimits: true,
  includeAssetValueChange: true,
  
  showIncome: true,
  showExpense: true,
  showCapital: true,
  showAssetsLine: false,
};
